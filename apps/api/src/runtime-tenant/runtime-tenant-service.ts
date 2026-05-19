import type { PrismaClient } from "@botmate/database";
import { Prisma } from "@botmate/database";
import type {
  RuntimeBrowserSessionsApiResponse,
  RuntimeExecutionDetailResponse,
  RuntimeExecutionRow,
  RuntimeExecutionsApiResponse,
  RuntimeNotificationsApiResponse,
  RuntimeOverviewResponse,
  RuntimePolicyEventsApiResponse,
} from "@botmate/shared";
import {
  assertTenantScopeMatch,
  dominantOverlayByExecutionIdFromMarks,
  executionHasActiveIncidentSuppression,
  hydrateExecutionGovernanceVisibility,
  observePrismaQueryTiming,
  recordExecutionDetailProjectionMs,
  recordExecutionListProjectionMs,
} from "@botmate/runtime";
import { getReplayVisibilityMatrix } from "./runtime-tenant-replay-matrix.js";

import { maybeSyncGovernanceAuditProjection } from "./runtime-tenant-governance-sync.js";

export function stuckThresholdMs(): number {
  const v = Number(process.env.RUNTIME_STUCK_THRESHOLD_MS ?? `${1_800_000}`);
  return Math.min(86_400_000, Math.max(120_000, Math.floor(v)));
}

function metaFatal(meta: unknown): string | null {
  if (!meta || typeof meta !== "object") return null;
  const fatal = (meta as { fatalError?: unknown }).fatalError;
  return typeof fatal === "string" && fatal.trim() ? fatal.trim() : null;
}

export async function buildRuntimeOverview(input: {
  prisma: PrismaClient;
  tenantId: string;
  userId: string;
}): Promise<RuntimeOverviewResponse> {
  await maybeSyncGovernanceAuditProjection(input.prisma, input.tenantId);

  const staleBefore = new Date(Date.now() - stuckThresholdMs());
  const last24h = new Date(Date.now() - 86_400_000);

  const [
    aiUsagesLast24h,
    browserRunsQueued,
    browserRunsRunning,
    browserSessionsNonTerminated,
    notificationsPendingAttention,
    stuckToolInvocations,
    stuckBrowserRuns,
    toolInvocationsInFlight,
  ] = await Promise.all([
    input.prisma.aiExecutionUsage.count({
      where: { tenantId: input.tenantId, createdAt: { gte: last24h } },
    }),
    input.prisma.browserRun.count({
      where: { tenantId: input.tenantId, status: "queued" },
    }),
    input.prisma.browserRun.count({
      where: { tenantId: input.tenantId, status: "running" },
    }),
    input.prisma.browserSession.count({
      where: { tenantId: input.tenantId, status: { not: "terminated" } },
    }),
    input.prisma.notification.count({
      where: {
        tenantId: input.tenantId,
        userId: input.userId,
        readAt: null,
        deliveryState: { in: ["pending", "queued"] },
      },
    }),
    input.prisma.toolInvocation.count({
      where: {
        tenantId: input.tenantId,
        status: "START",
        createdAt: { lt: staleBefore },
      },
    }),
    input.prisma.browserRun.count({
      where: {
        tenantId: input.tenantId,
        status: "running",
        updatedAt: { lt: staleBefore },
      },
    }),
    input.prisma.toolInvocation.count({
      where: {
        tenantId: input.tenantId,
        status: "START",
        createdAt: { gte: staleBefore },
      },
    }),
  ]);

  return {
    ok: true,
    counts: {
      aiUsagesLast24h,
      browserRunsQueued,
      browserRunsRunning,
      browserSessionsNonTerminated,
      notificationsPendingAttention,
      stuckToolInvocations,
      stuckBrowserRuns,
      toolInvocationsInFlight,
    },
    telemetry: {
      queueBacklogTenantScoped: false,
      processWideCountersExcluded: true,
      realtimeConnectedHint: "client_ws_only",
    },
  };
}

export async function listRuntimeExecutions(input: {
  prisma: PrismaClient;
  tenantId: string;
  page: number;
  pageSize: number;
  assistantId?: string;
}): Promise<RuntimeExecutionsApiResponse> {
  const projectionStarted = Date.now();
  const where: Prisma.AiExecutionUsageWhereInput = {
    tenantId: input.tenantId,
    ...(input.assistantId ? { assistantId: input.assistantId } : {}),
  };

  const total = await input.prisma.aiExecutionUsage.count({ where });

  const rows = await input.prisma.aiExecutionUsage.findMany({
    where,
    orderBy: { createdAt: "desc" },
    skip: (input.page - 1) * input.pageSize,
    take: input.pageSize,
    select: {
      id: true,
      traceId: true,
      assistantId: true,
      sessionId: true,
      durationMs: true,
      metadata: true,
      createdAt: true,
    },
  });

  const assistantIds = [...new Set(rows.map((r) => r.assistantId).filter((x): x is string => Boolean(x)))];
  const assistants =
    assistantIds.length === 0
      ? []
      : await input.prisma.assistant.findMany({
          where: { tenantId: input.tenantId, id: { in: assistantIds } },
          select: { id: true, name: true },
        });
  const assistantNameById = new Map(assistants.map((a) => [a.id, a.name]));

  const traceIds = [...new Set(rows.map((r) => r.traceId))];
  const browserHits =
    traceIds.length === 0
      ? []
      : await input.prisma.browserRun.findMany({
          where: { tenantId: input.tenantId, traceId: { in: traceIds } },
          select: { traceId: true },
          distinct: ["traceId"],
        });
  const browserTrace = new Set(browserHits.map((b) => b.traceId));

  const markRows =
    traceIds.length === 0
      ? []
      : await input.prisma.executionOperationalMark.findMany({
          where: { tenantId: input.tenantId, executionId: { in: traceIds } },
          select: {
            executionId: true,
            frozen: true,
            escalated: true,
            replayBlocked: true,
            governanceQuarantine: true,
          },
        });
  const dominantByExecutionId = dominantOverlayByExecutionIdFromMarks(markRows);

  const items: RuntimeExecutionRow[] = rows.map((r) => {
    const fatal = metaFatal(r.metadata);
    const replayLikely =
      typeof r.metadata === "object" &&
      r.metadata !== null &&
      "replayOriginExecutionId" in r.metadata &&
      typeof (r.metadata as { replayOriginExecutionId?: unknown }).replayOriginExecutionId === "string";

    const browserLinked = browserTrace.has(r.traceId);
    let surface: RuntimeExecutionRow["surface"] = "assistant";
    if (browserLinked) surface = "mixed";

    let status: RuntimeExecutionRow["status"] = "succeeded";
    if (fatal) status = "failed";

    return {
      executionId: r.traceId,
      usageRowId: r.id,
      assistantId: r.assistantId ?? null,
      assistantName: r.assistantId ? assistantNameById.get(r.assistantId) ?? null : null,
      sessionId: r.sessionId ?? null,
      surface,
      status,
      startedAt: r.createdAt.toISOString(),
      durationMs: r.durationMs,
      policyDecision: fatal ? "DENY" : "UNKNOWN",
      policyDecisionId: null,
      browserLinked,
      replayLikely,
      dominantOverlay: dominantByExecutionId.get(r.traceId) ?? null,
    };
  });

  const result = {
    ok: true as const,
    items,
    page: input.page,
    pageSize: input.pageSize,
    total,
  };
  recordExecutionListProjectionMs(Date.now() - projectionStarted);
  observePrismaQueryTiming("runtime.list_executions", projectionStarted);
  return result;
}

export async function getRuntimeExecutionDetail(input: {
  prisma: PrismaClient;
  tenantId: string;
  executionKey: string;
}): Promise<RuntimeExecutionDetailResponse | null> {
  const projectionStarted = Date.now();
  const usage = await input.prisma.aiExecutionUsage.findFirst({
    where: {
      tenantId: input.tenantId,
      OR: [{ id: input.executionKey }, { traceId: input.executionKey }],
    },
    select: {
      id: true,
      traceId: true,
      assistantId: true,
      sessionId: true,
      durationMs: true,
      metadata: true,
      createdAt: true,
    },
  });

  if (!usage) return null;

  const assistantName =
    usage.assistantId === null
      ? null
      : (
          await input.prisma.assistant.findFirst({
            where: { id: usage.assistantId, tenantId: input.tenantId },
            select: { name: true },
          })
        )?.name ?? null;

  const browserRunsRaw = await input.prisma.browserRun.findMany({
    where: { tenantId: input.tenantId, traceId: usage.traceId },
    select: {
      id: true,
      tenantId: true,
      status: true,
      traceId: true,
      browserSessionId: true,
      startedAt: true,
      finishedAt: true,
    },
    orderBy: { createdAt: "desc" },
    take: 48,
  });
  const browserRuns = browserRunsRaw.filter((b) =>
    assertTenantScopeMatch({
      expectedTenantId: input.tenantId,
      rowTenantId: b.tenantId,
      resource: "browser_run",
    }),
  );

  const markRow = await input.prisma.executionOperationalMark.findUnique({
    where: {
      tenantId_executionId: { tenantId: input.tenantId, executionId: usage.traceId },
    },
    select: {
      frozen: true,
      escalated: true,
      replayBlocked: true,
      governanceQuarantine: true,
    },
  });

  const marks = markRow
    ? {
        frozen: markRow.frozen,
        escalated: markRow.escalated,
        replayBlocked: markRow.replayBlocked,
        governanceQuarantine: markRow.governanceQuarantine,
      }
    : null;

  const fatal = metaFatal(usage.metadata);
  const replayLikely =
    typeof usage.metadata === "object" &&
    usage.metadata !== null &&
    "replayOriginExecutionId" in usage.metadata &&
    typeof (usage.metadata as { replayOriginExecutionId?: unknown }).replayOriginExecutionId === "string";

  const browserLinked = browserRuns.length > 0;
  const surface: RuntimeExecutionRow["surface"] = browserLinked ? "mixed" : "assistant";

  const execution: RuntimeExecutionRow = {
    executionId: usage.traceId,
    usageRowId: usage.id,
    assistantId: usage.assistantId ?? null,
    assistantName,
    sessionId: usage.sessionId ?? null,
    surface,
    status: fatal ? "failed" : "succeeded",
    startedAt: usage.createdAt.toISOString(),
    durationMs: usage.durationMs,
    policyDecision: fatal ? "DENY" : "UNKNOWN",
    policyDecisionId: null,
    browserLinked,
    replayLikely,
  };

  const md =
    usage.metadata && typeof usage.metadata === "object" && usage.metadata !== null
      ? Object.fromEntries(
          Object.entries(usage.metadata as Record<string, unknown>).filter(
            ([k]) => typeof k === "string" && k.length > 0 && k.length < 128,
          ),
        )
      : null;

  const replayMatrix = await getReplayVisibilityMatrix({
    prisma: input.prisma,
    tenantId: input.tenantId,
    executionKey: usage.traceId,
  });

  const replayRestrictionCodes = replayMatrix?.reasons.slice(0, 16) ?? [];
  const replayPolicySurfaceRestricted =
    replayMatrix?.tier === "forbidden" || replayMatrix?.tier === "restricted";

  const incidentSuppressed = await executionHasActiveIncidentSuppression(
    input.prisma,
    input.tenantId,
    usage.traceId,
  );

  const payload = {
    ok: true as const,
    execution,
    usageMetadata: md,
    governanceVisibility: hydrateExecutionGovernanceVisibility({
      marks,
      generatedAtIso: new Date().toISOString(),
      replayRestrictionCodes,
      signals: { replayPolicySurfaceRestricted, incidentSuppressed },
    }),
    browserRuns: browserRuns.map((b) => ({
      id: b.id,
      status: b.status,
      traceId: b.traceId,
      browserSessionId: b.browserSessionId,
      startedAt: b.startedAt?.toISOString() ?? null,
      finishedAt: b.finishedAt?.toISOString() ?? null,
    })),
  };
  recordExecutionDetailProjectionMs(Date.now() - projectionStarted);
  observePrismaQueryTiming("runtime.execution_detail", projectionStarted);
  return payload;
}

export async function listRuntimeBrowserSessions(input: {
  prisma: PrismaClient;
  tenantId: string;
  page: number;
  pageSize: number;
}): Promise<RuntimeBrowserSessionsApiResponse> {
  const where = { tenantId: input.tenantId };
  const total = await input.prisma.browserSession.count({ where });

  const rows = await input.prisma.browserSession.findMany({
    where,
    orderBy: { updatedAt: "desc" },
    skip: (input.page - 1) * input.pageSize,
    take: input.pageSize,
    select: {
      id: true,
      status: true,
      assistantId: true,
      chatSessionId: true,
      operatorMode: true,
      lastUrl: true,
      createdAt: true,
      updatedAt: true,
      _count: {
        select: {
          runs: { where: { status: { in: ["queued", "running"] } } },
        },
      },
    },
  });

  return {
    ok: true,
    items: rows.map((r) => ({
      id: r.id,
      status: r.status,
      assistantId: r.assistantId ?? null,
      chatSessionId: r.chatSessionId ?? null,
      operatorMode: r.operatorMode,
      lastUrl: r.lastUrl ?? null,
      activeRuns: r._count.runs,
      createdAt: r.createdAt.toISOString(),
      updatedAt: r.updatedAt.toISOString(),
    })),
    page: input.page,
    pageSize: input.pageSize,
    total,
  };
}

export async function listRuntimeNotifications(input: {
  prisma: PrismaClient;
  tenantId: string;
  userId: string;
  page: number;
  pageSize: number;
}): Promise<RuntimeNotificationsApiResponse> {
  const where = { tenantId: input.tenantId, userId: input.userId };
  const total = await input.prisma.notification.count({ where });

  const rows = await input.prisma.notification.findMany({
    where,
    orderBy: { createdAt: "desc" },
    skip: (input.page - 1) * input.pageSize,
    take: input.pageSize,
    select: {
      id: true,
      kind: true,
      title: true,
      deliveryState: true,
      readAt: true,
      correlationId: true,
      traceId: true,
      executionId: true,
      createdAt: true,
    },
  });

  return {
    ok: true,
    items: rows.map((r) => ({
      id: r.id,
      kind: r.kind,
      title: r.title,
      deliveryState: r.deliveryState,
      readAt: r.readAt?.toISOString() ?? null,
      correlationId: r.correlationId ?? null,
      traceId: r.traceId ?? null,
      executionId: r.executionId ?? null,
      createdAt: r.createdAt.toISOString(),
    })),
    page: input.page,
    pageSize: input.pageSize,
    total,
  };
}

export async function listRuntimePolicyEvents(input: {
  prisma: PrismaClient;
  tenantId: string;
  page: number;
  pageSize: number;
}): Promise<RuntimePolicyEventsApiResponse> {
  await maybeSyncGovernanceAuditProjection(input.prisma, input.tenantId);

  const total = await input.prisma.runtimeGovernanceAuditEvent.count({
    where: { tenantId: input.tenantId },
  });

  const rows = await input.prisma.runtimeGovernanceAuditEvent.findMany({
    where: { tenantId: input.tenantId },
    orderBy: { createdAt: "desc" },
    skip: (input.page - 1) * input.pageSize,
    take: input.pageSize,
    select: {
      id: true,
      createdAt: true,
      severity: true,
      code: true,
      message: true,
      traceId: true,
      sessionId: true,
      surface: true,
    },
  });

  const coerceSeverity = (s: string): "info" | "warn" | "critical" => {
    if (s === "critical") return "critical";
    if (s === "warn") return "warn";
    return "info";
  };

  return {
    ok: true,
    projection: "tenant_db_v2_persisted",
    items: rows.map((r) => ({
      id: `persisted:${r.id}`,
      occurredAt: r.createdAt.toISOString(),
      severity: coerceSeverity(r.severity),
      code: r.code,
      message: r.message.slice(0, 512),
      traceId: r.traceId ?? null,
      sessionId: r.sessionId ?? null,
      surface: r.surface,
    })),
    page: input.page,
    pageSize: input.pageSize,
    total,
  };
}
