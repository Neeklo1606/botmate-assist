import type { FastifyInstance, FastifyReply } from "fastify";
import { prisma } from "@botmate/database";
import {
  isBrowserRuntimeEnabled,
  isOperatorBrowserEnabled,
} from "@botmate/browser-runtime";
import {
  PolicyEnforcementError,
  enforceOperatorActionPolicyIngress,
  readRuntimePolicyEpoch,
} from "@botmate/runtime";
import { authenticate } from "../auth.js";
import { enforceUnifiedRuntimeGate } from "../control-plane/runtime-guard.js";
import { requireWorkspaceAuth } from "../workspace-auth.js";
import { signWsTicket } from "../realtime/ws-auth.js";
import { browserFeedRoom } from "../realtime/rooms.js";
import { getBrowserJobQueues } from "../browser/browser-job-gateway.js";
import {
  acquireOperatorJoinLease,
  acquireOperatorObserveLease,
  acquireOperatorTakeoverLease,
  enqueueBrowserFeedSnapshotJob,
  loadOperatorFeedProjection,
  releaseOperatorSessionLease,
} from "../browser/operator-browser.js";

function gateOperatorPolicyOrReply(
  reply: FastifyReply,
  traceId: string,
  auth: { tenantId: string; userId: string },
  actionType: "observe" | "join" | "takeover",
): boolean {
  try {
    enforceOperatorActionPolicyIngress({
      tenantId: auth.tenantId,
      userId: auth.userId,
      actionType,
    });
    return true;
  } catch (err) {
    if (err instanceof PolicyEnforcementError) {
      void reply.code(403).send({
        error: {
          code: "POLICY_DENIED",
          message: `Operator ${actionType} denied by policy`,
          trace_id: traceId,
        },
      });
      return false;
    }
    throw err;
  }
}

async function maybeEnqueueFeedSnapshot(input: {
  tenantId: string;
  browserSessionId: string;
  force?: boolean;
}): Promise<void> {
  const queues = getBrowserJobQueues();
  if (!queues || !isBrowserRuntimeEnabled() || !isOperatorBrowserEnabled()) return;
  await enqueueBrowserFeedSnapshotJob({
    queue: queues.browserFeedSnapshot,
    tenantId: input.tenantId,
    browserSessionId: input.browserSessionId,
    force: input.force,
  });
}

async function loadSessionToken(browserSessionId: string, tenantId: string): Promise<string | null> {
  const row = await prisma.browserSession.findFirst({
    where: { id: browserSessionId, tenantId },
    select: { operatorFeedRoomToken: true },
  });
  return row?.operatorFeedRoomToken ?? null;
}

export function registerBrowserOperatorRoutes(app: FastifyInstance): void {
  const base = "/api/v1/browser/sessions/:browserSessionId";

  app.post(`${base}/observe`, { preHandler: authenticate }, async (request, reply) => {
    const auth = request.auth!;
    if (!requireWorkspaceAuth(auth)) {
      return reply.code(403).send({
        error: {
          code: "AUTH_FORBIDDEN",
          message: "Workspace session required",
          trace_id: request.id,
        },
      });
    }

    if (!enforceUnifiedRuntimeGate(reply, request.id, auth.tenantId, "operator")) {
      return;
    }

    if (!gateOperatorPolicyOrReply(reply, request.id, auth, "observe")) {
      return;
    }

    const browserSessionId = (request.params as { browserSessionId: string }).browserSessionId;
    const body = (request.body ?? {}) as { leaseTtlSec?: number };

    const result = await acquireOperatorObserveLease({
      prisma,
      tenantId: auth.tenantId,
      browserSessionId,
      userId: auth.userId,
      role: auth.role,
      leaseTtlSec: body.leaseTtlSec,
    });

    if (!result.ok) {
      return reply.code(result.status).send({
        error: {
          code: result.code,
          message: result.message,
          trace_id: request.id,
        },
      });
    }

    await maybeEnqueueFeedSnapshot({ tenantId: auth.tenantId, browserSessionId });

    const token = await loadSessionToken(browserSessionId, auth.tenantId);
    const refreshed = await prisma.browserSession.findFirst({
      where: { id: browserSessionId, tenantId: auth.tenantId },
      select: {
        operatorMode: true,
        operatorLeaseExpiresAt: true,
        takeoverLeaseExpiresAt: true,
      },
    });

    return reply.send({
      browserSessionId,
      operatorMode: refreshed?.operatorMode ?? null,
      operatorLeaseExpiresAt: refreshed?.operatorLeaseExpiresAt ?? null,
      takeoverLeaseExpiresAt: refreshed?.takeoverLeaseExpiresAt ?? null,
      feedRoomToken: token,
      realtimeRoom: token ? browserFeedRoom(auth.tenantId, token) : null,
    });
  });

  app.post(`${base}/join`, { preHandler: authenticate }, async (request, reply) => {
    const auth = request.auth!;
    if (!requireWorkspaceAuth(auth)) {
      return reply.code(403).send({
        error: {
          code: "AUTH_FORBIDDEN",
          message: "Workspace session required",
          trace_id: request.id,
        },
      });
    }

    if (!enforceUnifiedRuntimeGate(reply, request.id, auth.tenantId, "operator")) {
      return;
    }

    if (!gateOperatorPolicyOrReply(reply, request.id, auth, "join")) {
      return;
    }

    const browserSessionId = (request.params as { browserSessionId: string }).browserSessionId;
    const body = (request.body ?? {}) as { leaseTtlSec?: number };

    const result = await acquireOperatorJoinLease({
      prisma,
      tenantId: auth.tenantId,
      browserSessionId,
      userId: auth.userId,
      role: auth.role,
      leaseTtlSec: body.leaseTtlSec,
    });

    if (!result.ok) {
      return reply.code(result.status).send({
        error: {
          code: result.code,
          message: result.message,
          trace_id: request.id,
        },
      });
    }

    await maybeEnqueueFeedSnapshot({ tenantId: auth.tenantId, browserSessionId });

    const token = await loadSessionToken(browserSessionId, auth.tenantId);
    const refreshed = await prisma.browserSession.findFirst({
      where: { id: browserSessionId, tenantId: auth.tenantId },
      select: {
        operatorMode: true,
        operatorLeaseExpiresAt: true,
        takeoverLeaseExpiresAt: true,
      },
    });

    return reply.send({
      browserSessionId,
      operatorMode: refreshed?.operatorMode ?? null,
      operatorLeaseExpiresAt: refreshed?.operatorLeaseExpiresAt ?? null,
      takeoverLeaseExpiresAt: refreshed?.takeoverLeaseExpiresAt ?? null,
      feedRoomToken: token,
      realtimeRoom: token ? browserFeedRoom(auth.tenantId, token) : null,
    });
  });

  app.post(`${base}/takeover`, { preHandler: authenticate }, async (request, reply) => {
    const auth = request.auth!;
    if (!requireWorkspaceAuth(auth)) {
      return reply.code(403).send({
        error: {
          code: "AUTH_FORBIDDEN",
          message: "Workspace session required",
          trace_id: request.id,
        },
      });
    }

    if (!enforceUnifiedRuntimeGate(reply, request.id, auth.tenantId, "operator")) {
      return;
    }

    if (!gateOperatorPolicyOrReply(reply, request.id, auth, "takeover")) {
      return;
    }

    const browserSessionId = (request.params as { browserSessionId: string }).browserSessionId;
    const body = (request.body ?? {}) as { leaseTtlSec?: number };

    const result = await acquireOperatorTakeoverLease({
      prisma,
      tenantId: auth.tenantId,
      browserSessionId,
      userId: auth.userId,
      role: auth.role,
      leaseTtlSec: body.leaseTtlSec,
    });

    if (!result.ok) {
      return reply.code(result.status).send({
        error: {
          code: result.code,
          message: result.message,
          trace_id: request.id,
        },
      });
    }

    await maybeEnqueueFeedSnapshot({ tenantId: auth.tenantId, browserSessionId, force: true });

    const token = await loadSessionToken(browserSessionId, auth.tenantId);
    const refreshed = await prisma.browserSession.findFirst({
      where: { id: browserSessionId, tenantId: auth.tenantId },
      select: {
        operatorMode: true,
        operatorLeaseExpiresAt: true,
        takeoverLeaseExpiresAt: true,
      },
    });

    return reply.send({
      browserSessionId,
      operatorMode: refreshed?.operatorMode ?? null,
      operatorLeaseExpiresAt: refreshed?.operatorLeaseExpiresAt ?? null,
      takeoverLeaseExpiresAt: refreshed?.takeoverLeaseExpiresAt ?? null,
      feedRoomToken: token,
      realtimeRoom: token ? browserFeedRoom(auth.tenantId, token) : null,
    });
  });

  app.post(`${base}/release`, { preHandler: authenticate }, async (request, reply) => {
    const auth = request.auth!;
    if (!requireWorkspaceAuth(auth)) {
      return reply.code(403).send({
        error: {
          code: "AUTH_FORBIDDEN",
          message: "Workspace session required",
          trace_id: request.id,
        },
      });
    }

    if (!enforceUnifiedRuntimeGate(reply, request.id, auth.tenantId, "operator")) {
      return;
    }

    const browserSessionId = (request.params as { browserSessionId: string }).browserSessionId;
    const body = (request.body ?? {}) as { force?: boolean };

    const result = await releaseOperatorSessionLease({
      prisma,
      tenantId: auth.tenantId,
      browserSessionId,
      userId: auth.userId,
      role: auth.role,
      force: body.force,
    });

    if (!result.ok) {
      return reply.code(result.status).send({
        error: {
          code: result.code,
          message: result.message,
          trace_id: request.id,
        },
      });
    }

    return reply.send({ browserSessionId, released: true });
  });

  app.get(`${base}/feed`, { preHandler: authenticate }, async (request, reply) => {
    const auth = request.auth!;
    if (!requireWorkspaceAuth(auth)) {
      return reply.code(403).send({
        error: {
          code: "AUTH_FORBIDDEN",
          message: "Workspace session required",
          trace_id: request.id,
        },
      });
    }

    if (!enforceUnifiedRuntimeGate(reply, request.id, auth.tenantId, "operator")) {
      return;
    }

    const browserSessionId = (request.params as { browserSessionId: string }).browserSessionId;
    const q = request.query as { events?: string };

    const rawLimit = Number(q.events ?? "40");
    const eventLimit = Number.isFinite(rawLimit) ? rawLimit : 40;

    const projection = await loadOperatorFeedProjection({
      prisma,
      tenantId: auth.tenantId,
      browserSessionId,
      eventLimit,
    });

    if (!projection.ok) {
      return reply.code(projection.status).send({
        error: {
          code: projection.code,
          message: projection.message,
          trace_id: request.id,
        },
      });
    }

    return reply.send(projection);
  });

  app.post(`${base}/feed/refresh`, { preHandler: authenticate }, async (request, reply) => {
    const auth = request.auth!;
    if (!requireWorkspaceAuth(auth)) {
      return reply.code(403).send({
        error: {
          code: "AUTH_FORBIDDEN",
          message: "Workspace session required",
          trace_id: request.id,
        },
      });
    }

    if (!enforceUnifiedRuntimeGate(reply, request.id, auth.tenantId, "operator")) {
      return;
    }

    const browserSessionId = (request.params as { browserSessionId: string }).browserSessionId;
    const body = (request.body ?? {}) as { force?: boolean };

    const session = await prisma.browserSession.findFirst({
      where: { id: browserSessionId, tenantId: auth.tenantId },
      select: {
        operatorLeaseExpiresAt: true,
        takeoverLeaseExpiresAt: true,
        operatorUserId: true,
        takeoverUserId: true,
      },
    });

    if (!session) {
      return reply.code(404).send({
        error: {
          code: "BROWSER_SESSION_NOT_FOUND",
          message: "Browser session not found",
          trace_id: request.id,
        },
      });
    }

    const now = new Date();
    const leaseOk =
      (session.operatorLeaseExpiresAt && session.operatorLeaseExpiresAt > now && session.operatorUserId) ||
      (session.takeoverLeaseExpiresAt && session.takeoverLeaseExpiresAt > now && session.takeoverUserId);

    const elevated = auth.role === "ADMIN" || auth.role === "OWNER";
    const holderOp = session.operatorUserId === auth.userId;
    const holderTk = session.takeoverUserId === auth.userId;

    if (!leaseOk) {
      return reply.code(409).send({
        error: {
          code: "OPERATOR_FEED_NO_LEASE",
          message: "Acquire observe/join/takeover before refreshing feed snapshots",
          trace_id: request.id,
        },
      });
    }

    const forceAllowed = elevated && Boolean(body.force);
    if (!holderOp && !holderTk && !elevated) {
      return reply.code(403).send({
        error: {
          code: "OPERATOR_FEED_REFRESH_FORBIDDEN",
          message: "Not authorized",
          trace_id: request.id,
        },
      });
    }

    await maybeEnqueueFeedSnapshot({
      tenantId: auth.tenantId,
      browserSessionId,
      force: forceAllowed,
    });

    return reply.send({ queued: true, force: Boolean(forceAllowed) });
  });

  app.post(`${base}/ws-feed-ticket`, { preHandler: authenticate }, async (request, reply) => {
    const auth = request.auth!;
    if (!requireWorkspaceAuth(auth)) {
      return reply.code(403).send({
        error: {
          code: "AUTH_FORBIDDEN",
          message: "Workspace session required",
          trace_id: request.id,
        },
      });
    }

    if (!enforceUnifiedRuntimeGate(reply, request.id, auth.tenantId, "operator")) {
      return;
    }

    const browserSessionId = (request.params as { browserSessionId: string }).browserSessionId;

    const session = await prisma.browserSession.findFirst({
      where: { id: browserSessionId, tenantId: auth.tenantId },
      select: {
        operatorFeedRoomToken: true,
        operatorLeaseExpiresAt: true,
        takeoverLeaseExpiresAt: true,
        operatorUserId: true,
        takeoverUserId: true,
      },
    });

    if (!session?.operatorFeedRoomToken) {
      return reply.code(404).send({
        error: {
          code: "OPERATOR_FEED_TOKEN_MISSING",
          message: "Acquire a lease before minting feed tickets",
          trace_id: request.id,
        },
      });
    }

    const now = new Date();
    const leaseOk =
      (session.operatorLeaseExpiresAt && session.operatorLeaseExpiresAt > now && session.operatorUserId) ||
      (session.takeoverLeaseExpiresAt && session.takeoverLeaseExpiresAt > now && session.takeoverUserId);

    if (!leaseOk) {
      return reply.code(409).send({
        error: {
          code: "OPERATOR_FEED_NO_LEASE",
          message: "Operator lease expired — renew observe/join/takeover",
          trace_id: request.id,
        },
      });
    }

    const elevated = auth.role === "ADMIN" || auth.role === "OWNER";
    const holderOp = session.operatorUserId === auth.userId;
    const holderTk = session.takeoverUserId === auth.userId;

    if (!elevated && !holderOp && !holderTk) {
      return reply.code(403).send({
        error: {
          code: "OPERATOR_FEED_TICKET_FORBIDDEN",
          message: "Not authorized for this browser feed",
          trace_id: request.id,
        },
      });
    }

    const ttlSec = 120;
    const ticket = signWsTicket(
      {
        userId: auth.userId,
        tenantId: auth.tenantId,
        role: auth.role,
        browserFeedTokens: [session.operatorFeedRoomToken],
        tenantPolicyEpoch: readRuntimePolicyEpoch(),
      },
      ttlSec,
    );

    return reply.send({
      ticket,
      expiresInSec: ttlSec,
      websocketUrl: "/api/v1/realtime/ws",
      realtimeRoom: browserFeedRoom(auth.tenantId, session.operatorFeedRoomToken),
    });
  });
}
