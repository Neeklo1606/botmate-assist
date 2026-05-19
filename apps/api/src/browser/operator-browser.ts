import { randomBytes } from "node:crypto";
import type { PrismaClient } from "@botmate/database";
import { Prisma } from "@botmate/database";
import { enqueue, type JobQueues } from "@botmate/jobs";
import {
  isOperatorBrowserEnabled,
  operatorObserveLeaseMs,
  operatorTakeoverLeaseMs,
} from "@botmate/browser-runtime";
import { mergeExecutionContextSafe, mergePolicyContextSafe, publishGovernedRealtimeToRooms, preferredGovernedRealtimeWireMode } from "@botmate/runtime";
import { RealtimeEnvelopeSchema, type RealtimeEventName } from "@botmate/shared";
import type { Role } from "../types.js";
import { browserFeedRoom } from "../realtime/rooms.js";
import { tryGetRealtimeGateway } from "../realtime/gateway-registry.js";

function elevated(role: Role): boolean {
  return role === "ADMIN" || role === "OWNER";
}

export function makeOperatorFeedRoomToken(): string {
  return randomBytes(24).toString("hex");
}

function clampObserveTtlMs(requestedSec?: number): number {
  const maxMs = operatorObserveLeaseMs();
  const minMs = 120_000;
  if (!requestedSec || !Number.isFinite(requestedSec)) return Math.min(maxMs, 600_000);
  const ms = Math.floor(requestedSec * 1000);
  return Math.min(maxMs, Math.max(minMs, ms));
}

function takeoverHeldByOther(session: {
  takeoverUserId: string | null;
  takeoverLeaseExpiresAt: Date | null;
  operatorMode: string;
}, userId: string, role: Role, now: Date): boolean {
  const tk =
    session.takeoverUserId &&
    session.takeoverLeaseExpiresAt &&
    session.takeoverLeaseExpiresAt > now;
  if (!tk) return false;
  if (elevated(role)) return false;
  return session.takeoverUserId !== userId;
}

function operatorHeldByOther(session: {
  operatorUserId: string | null;
  operatorLeaseExpiresAt: Date | null;
}, userId: string, role: Role, now: Date): boolean {
  const op =
    session.operatorUserId &&
    session.operatorLeaseExpiresAt &&
    session.operatorLeaseExpiresAt > now;
  if (!op) return false;
  if (elevated(role)) return false;
  return session.operatorUserId !== userId;
}

async function appendBrowserAuditEvent(input: {
  prisma: PrismaClient;
  tenantId: string;
  browserSessionId: string;
  type: string;
  payload: Record<string, unknown>;
}): Promise<void> {
  const maxAttempts = 6;
  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    try {
      await input.prisma.$transaction(
        async (tx) => {
          const agg = await tx.browserEvent.aggregate({
            where: { browserSessionId: input.browserSessionId },
            _max: { seq: true },
          });
          const seq = (agg._max.seq ?? 0n) + 1n;
          await tx.browserEvent.create({
            data: {
              tenantId: input.tenantId,
              browserSessionId: input.browserSessionId,
              browserRunId: null,
              seq,
              type: input.type,
              payload: input.payload as Prisma.InputJsonValue,
            },
          });
        },
        { isolationLevel: Prisma.TransactionIsolationLevel.Serializable },
      );
      return;
    } catch (err: unknown) {
      const code = typeof err === "object" && err !== null && "code" in err ? String((err as { code?: unknown }).code) : "";
      if (code === "P2034" && attempt + 1 < maxAttempts) continue;
      throw err;
    }
  }
}

export async function publishOperatorRealtimeEnvelope(input: {
  tenantId: string;
  feedRoomToken: string;
  event: RealtimeEventName;
  payload: Record<string, unknown>;
}): Promise<void> {
  const gw = tryGetRealtimeGateway();
  if (!gw) return;
  const room = browserFeedRoom(input.tenantId, input.feedRoomToken);
  const envelope = RealtimeEnvelopeSchema.parse({
    v: 1,
    tenantId: input.tenantId,
    ts: new Date().toISOString(),
    event: input.event,
    payload: input.payload,
  });
  await publishGovernedRealtimeToRooms({
    gateway: gw,
    publishTenantId: input.tenantId,
    rooms: [room],
    envelope,
    wireMode: preferredGovernedRealtimeWireMode(),
    governanceSurfaceId: "surface.realtime.operator_browser_feed",
  });
}

async function publishBrowserOperatorRealtimeEnvelope(
  prisma: PrismaClient,
  input: {
    tenantId: string;
    browserSessionId: string;
    feedRoomToken: string;
    event: RealtimeEventName;
    payload: Record<string, unknown>;
  },
): Promise<void> {
  const overlay = await prisma.browserRun.findFirst({
    where: { tenantId: input.tenantId, browserSessionId: input.browserSessionId },
    orderBy: { createdAt: "desc" },
    select: { id: true, traceId: true },
  });
  const tid = overlay?.traceId?.trim() ? overlay.traceId : null;
  await publishOperatorRealtimeEnvelope({
    tenantId: input.tenantId,
    feedRoomToken: input.feedRoomToken,
    event: input.event,
    payload: {
      ...input.payload,
      browserSessionId: input.browserSessionId,
      browserRunId: overlay?.id ?? null,
      traceId: tid,
      executionId: tid,
    },
  });
}

export async function enqueueBrowserFeedSnapshotJob(input: {
  queue: JobQueues["browserFeedSnapshot"];
  tenantId: string;
  browserSessionId: string;
  force?: boolean;
}): Promise<void> {
  await enqueue.browserFeedSnapshot(
    input.queue,
    mergePolicyContextSafe(
      mergeExecutionContextSafe({
        tenantId: input.tenantId,
        browserSessionId: input.browserSessionId,
        force: Boolean(input.force),
      }) as Record<string, unknown>,
    ) as Record<string, unknown>,
  );
}

export async function acquireOperatorObserveLease(input: {
  prisma: PrismaClient;
  tenantId: string;
  browserSessionId: string;
  userId: string;
  role: Role;
  leaseTtlSec?: number;
}): Promise<{ ok: true } | { ok: false; status: number; code: string; message: string }> {
  if (!isOperatorBrowserEnabled()) {
    return { ok: false, status: 404, code: "OPERATOR_BROWSER_DISABLED", message: "Operator browser layer disabled" };
  }

  const now = new Date();
  const ttlMs = clampObserveTtlMs(input.leaseTtlSec);

  const result = await input.prisma.$transaction(async (tx) => {
    const s = await tx.browserSession.findFirst({
      where: { id: input.browserSessionId, tenantId: input.tenantId },
    });
    if (!s) return { kind: "missing" as const };

    if (takeoverHeldByOther(s, input.userId, input.role, now)) {
      return { kind: "takeover_conflict" as const };
    }
    if (operatorHeldByOther(s, input.userId, input.role, now)) {
      return { kind: "operator_conflict" as const };
    }

    const token = s.operatorFeedRoomToken ?? makeOperatorFeedRoomToken();

    let operatorModeNext: "observe" | "takeover" = "observe";
    const takeoverAliveSameUser =
      s.operatorMode === "takeover" &&
      s.takeoverUserId === input.userId &&
      s.takeoverLeaseExpiresAt &&
      s.takeoverLeaseExpiresAt > now;
    if (takeoverAliveSameUser) {
      operatorModeNext = "takeover";
    }

    await tx.browserSession.update({
      where: { id: s.id },
      data: {
        operatorMode: operatorModeNext,
        operatorUserId: input.userId,
        operatorLeaseExpiresAt: new Date(Date.now() + ttlMs),
        operatorFeedRoomToken: token,
      },
    });

    return { kind: "ok" as const, token };
  });

  if (result.kind === "missing") {
    return { ok: false, status: 404, code: "BROWSER_SESSION_NOT_FOUND", message: "Browser session not found" };
  }
  if (result.kind === "takeover_conflict") {
    return {
      ok: false,
      status: 409,
      code: "OPERATOR_TAKEOVER_HELD_BY_OTHER",
      message: "Another operator holds an active takeover lease",
    };
  }
  if (result.kind === "operator_conflict") {
    return {
      ok: false,
      status: 409,
      code: "OPERATOR_LEASE_CONFLICT",
      message: "Another operator holds an active observe/join lease",
    };
  }

  await appendBrowserAuditEvent({
    prisma: input.prisma,
    tenantId: input.tenantId,
    browserSessionId: input.browserSessionId,
    type: "operator_observed",
    payload: { userId: input.userId },
  });

  await publishBrowserOperatorRealtimeEnvelope(input.prisma, {
    tenantId: input.tenantId,
    browserSessionId: input.browserSessionId,
    feedRoomToken: result.token,
    event: "operator.joined",
    payload: { userId: input.userId, mode: "observe" },
  });

  return { ok: true };
}

export async function acquireOperatorJoinLease(input: {
  prisma: PrismaClient;
  tenantId: string;
  browserSessionId: string;
  userId: string;
  role: Role;
  leaseTtlSec?: number;
}): Promise<{ ok: true } | { ok: false; status: number; code: string; message: string }> {
  if (!isOperatorBrowserEnabled()) {
    return { ok: false, status: 404, code: "OPERATOR_BROWSER_DISABLED", message: "Operator browser layer disabled" };
  }

  const now = new Date();
  const ttlMs = clampObserveTtlMs(input.leaseTtlSec);

  const result = await input.prisma.$transaction(async (tx) => {
    const s = await tx.browserSession.findFirst({
      where: { id: input.browserSessionId, tenantId: input.tenantId },
    });
    if (!s) return { kind: "missing" as const };

    if (takeoverHeldByOther(s, input.userId, input.role, now)) {
      return { kind: "takeover_conflict" as const };
    }
    if (operatorHeldByOther(s, input.userId, input.role, now)) {
      return { kind: "operator_conflict" as const };
    }

    const token = s.operatorFeedRoomToken ?? makeOperatorFeedRoomToken();

    let operatorModeNext: "join" | "takeover" = "join";
    const takeoverAliveSameUser =
      s.operatorMode === "takeover" &&
      s.takeoverUserId === input.userId &&
      s.takeoverLeaseExpiresAt &&
      s.takeoverLeaseExpiresAt > now;
    if (takeoverAliveSameUser) {
      operatorModeNext = "takeover";
    }

    await tx.browserSession.update({
      where: { id: s.id },
      data: {
        operatorMode: operatorModeNext,
        operatorUserId: input.userId,
        operatorLeaseExpiresAt: new Date(Date.now() + ttlMs),
        operatorFeedRoomToken: token,
      },
    });

    return { kind: "ok" as const, token };
  });

  if (result.kind === "missing") {
    return { ok: false, status: 404, code: "BROWSER_SESSION_NOT_FOUND", message: "Browser session not found" };
  }
  if (result.kind === "takeover_conflict") {
    return {
      ok: false,
      status: 409,
      code: "OPERATOR_TAKEOVER_HELD_BY_OTHER",
      message: "Another operator holds an active takeover lease",
    };
  }
  if (result.kind === "operator_conflict") {
    return {
      ok: false,
      status: 409,
      code: "OPERATOR_LEASE_CONFLICT",
      message: "Another operator holds an active observe/join lease",
    };
  }

  await appendBrowserAuditEvent({
    prisma: input.prisma,
    tenantId: input.tenantId,
    browserSessionId: input.browserSessionId,
    type: "operator_joined",
    payload: { userId: input.userId, mode: "join" },
  });

  await publishBrowserOperatorRealtimeEnvelope(input.prisma, {
    tenantId: input.tenantId,
    browserSessionId: input.browserSessionId,
    feedRoomToken: result.token,
    event: "operator.joined",
    payload: { userId: input.userId, mode: "join" },
  });

  return { ok: true };
}

export async function acquireOperatorTakeoverLease(input: {
  prisma: PrismaClient;
  tenantId: string;
  browserSessionId: string;
  userId: string;
  role: Role;
  leaseTtlSec?: number;
}): Promise<{ ok: true } | { ok: false; status: number; code: string; message: string }> {
  if (!isOperatorBrowserEnabled()) {
    return { ok: false, status: 404, code: "OPERATOR_BROWSER_DISABLED", message: "Operator browser layer disabled" };
  }

  if (!elevated(input.role)) {
    return {
      ok: false,
      status: 403,
      code: "OPERATOR_TAKEOVER_FORBIDDEN",
      message: "Takeover requires ADMIN or OWNER role",
    };
  }

  const now = new Date();
  const takeoverMs = operatorTakeoverLeaseMs();
  const opMs = clampObserveTtlMs(input.leaseTtlSec);

  const result = await input.prisma.$transaction(async (tx) => {
    const s = await tx.browserSession.findFirst({
      where: { id: input.browserSessionId, tenantId: input.tenantId },
    });
    if (!s) return { kind: "missing" as const };

    const tkHeld =
      s.takeoverUserId &&
      s.takeoverLeaseExpiresAt &&
      s.takeoverLeaseExpiresAt > now &&
      s.takeoverUserId !== input.userId;
    if (tkHeld) return { kind: "takeover_conflict" as const };

    const token = s.operatorFeedRoomToken ?? makeOperatorFeedRoomToken();

    await tx.browserSession.update({
      where: { id: s.id },
      data: {
        operatorMode: "takeover",
        takeoverUserId: input.userId,
        takeoverLeaseExpiresAt: new Date(Date.now() + takeoverMs),
        operatorUserId: input.userId,
        operatorLeaseExpiresAt: new Date(Date.now() + opMs),
        operatorFeedRoomToken: token,
      },
    });

    return { kind: "ok" as const, token };
  });

  if (result.kind === "missing") {
    return { ok: false, status: 404, code: "BROWSER_SESSION_NOT_FOUND", message: "Browser session not found" };
  }
  if (result.kind === "takeover_conflict") {
    return {
      ok: false,
      status: 409,
      code: "OPERATOR_TAKEOVER_CONFLICT",
      message: "Another administrator holds an active takeover lease",
    };
  }

  await appendBrowserAuditEvent({
    prisma: input.prisma,
    tenantId: input.tenantId,
    browserSessionId: input.browserSessionId,
    type: "operator_takeover",
    payload: { userId: input.userId },
  });

  await publishBrowserOperatorRealtimeEnvelope(input.prisma, {
    tenantId: input.tenantId,
    browserSessionId: input.browserSessionId,
    feedRoomToken: result.token,
    event: "operator.takeover",
    payload: { userId: input.userId },
  });

  return { ok: true };
}

export async function releaseOperatorSessionLease(input: {
  prisma: PrismaClient;
  tenantId: string;
  browserSessionId: string;
  userId: string;
  role: Role;
  force?: boolean;
}): Promise<{ ok: true } | { ok: false; status: number; code: string; message: string }> {
  if (!isOperatorBrowserEnabled()) {
    return { ok: false, status: 404, code: "OPERATOR_BROWSER_DISABLED", message: "Operator browser layer disabled" };
  }

  const session = await input.prisma.browserSession.findFirst({
    where: { id: input.browserSessionId, tenantId: input.tenantId },
    select: {
      operatorFeedRoomToken: true,
      operatorUserId: true,
      takeoverUserId: true,
      operatorMode: true,
      operatorLeaseExpiresAt: true,
      takeoverLeaseExpiresAt: true,
    },
  });

  if (!session) {
    return { ok: false, status: 404, code: "BROWSER_SESSION_NOT_FOUND", message: "Browser session not found" };
  }

  const allowForce = elevated(input.role) && Boolean(input.force);

  const holderOp = session.operatorUserId === input.userId;
  const holderTk = session.takeoverUserId === input.userId;

  if (!holderOp && !holderTk && !allowForce) {
    return {
      ok: false,
      status: 403,
      code: "OPERATOR_RELEASE_FORBIDDEN",
      message: "Not authorized to release this lease",
    };
  }

  const token = session.operatorFeedRoomToken;

  const patch: Prisma.BrowserSessionUpdateManyMutationInput = {};

  if (allowForce) {
    patch.operatorMode = "none";
    patch.operatorUserId = null;
    patch.operatorLeaseExpiresAt = null;
    patch.takeoverUserId = null;
    patch.takeoverLeaseExpiresAt = null;
  } else if (holderTk) {
    patch.takeoverUserId = null;
    patch.takeoverLeaseExpiresAt = null;
    patch.operatorMode = "none";
    patch.operatorUserId = null;
    patch.operatorLeaseExpiresAt = null;
  } else if (holderOp) {
    patch.operatorUserId = null;
    patch.operatorLeaseExpiresAt = null;
    patch.operatorMode = "none";
  }

  await input.prisma.browserSession.updateMany({
    where: { id: input.browserSessionId, tenantId: input.tenantId },
    data: patch,
  });

  const auditType = holderTk || allowForce ? "operator_released" : "operator_left";
  const realtimeEvent: RealtimeEventName = holderTk || allowForce ? "operator.released" : "operator.left";

  await appendBrowserAuditEvent({
    prisma: input.prisma,
    tenantId: input.tenantId,
    browserSessionId: input.browserSessionId,
    type: auditType,
    payload: { userId: input.userId, force: Boolean(allowForce) },
  });

  if (token) {
    await publishBrowserOperatorRealtimeEnvelope(input.prisma, {
      tenantId: input.tenantId,
      browserSessionId: input.browserSessionId,
      feedRoomToken: token,
      event: realtimeEvent,
      payload: { userId: input.userId, force: Boolean(allowForce) },
    });
  }

  return { ok: true };
}

export async function loadOperatorFeedProjection(input: {
  prisma: PrismaClient;
  tenantId: string;
  browserSessionId: string;
  eventLimit?: number;
}): Promise<
  | {
      ok: true;
      session: Record<string, unknown>;
      recentOperatorEvents: Array<{ type: string; payload: unknown; seq: string; createdAt: Date }>;
    }
  | { ok: false; status: number; code: string; message: string }
> {
  const session = await input.prisma.browserSession.findFirst({
    where: { id: input.browserSessionId, tenantId: input.tenantId },
  });

  if (!session) {
    return { ok: false, status: 404, code: "BROWSER_SESSION_NOT_FOUND", message: "Browser session not found" };
  }

  const types = [
    "operator_observed",
    "operator_joined",
    "operator_left",
    "operator_takeover",
    "operator_released",
    "browser_feed_snapshot",
  ];

  const limit = Math.min(80, Math.max(8, input.eventLimit ?? 40));

  const rows = await input.prisma.browserEvent.findMany({
    where: { tenantId: input.tenantId, browserSessionId: input.browserSessionId, type: { in: types } },
    orderBy: { seq: "desc" },
    take: limit,
    select: { type: true, payload: true, seq: true, createdAt: true },
  });

  return {
    ok: true,
    session: {
      id: session.id,
      tenantId: session.tenantId,
      chatSessionId: session.chatSessionId,
      assistantId: session.assistantId,
      status: session.status,
      lastUrl: session.lastUrl,
      operatorMode: session.operatorMode,
      operatorLeaseExpiresAt: session.operatorLeaseExpiresAt,
      takeoverLeaseExpiresAt: session.takeoverLeaseExpiresAt,
      operatorFeedRoomPresent: Boolean(session.operatorFeedRoomToken),
      operatorFeedLastEmittedAt: session.operatorFeedLastEmittedAt,
    },
    recentOperatorEvents: rows.map((r) => ({
      type: r.type,
      payload: r.payload,
      seq: String(r.seq),
      createdAt: r.createdAt,
    })),
  };
}
