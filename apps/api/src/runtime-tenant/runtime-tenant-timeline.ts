import type { PrismaClient } from "@botmate/database";
import type {
  ExecutionTimelineEvent,
  ExecutionTimelineResponse,
  ExecutionTimelineQuery,
} from "@botmate/shared";

import {
  governancePrimaryCodeFromFatal,
  maybeSyncGovernanceAuditProjection,
} from "./runtime-tenant-governance-sync.js";
import { attachTimelineDedupeKeys, materializeExecutionFacts } from "./runtime-tenant-facts.js";

const MAX_MERGED_EVENTS = 420;

function metaFatal(meta: unknown): string | null {
  if (!meta || typeof meta !== "object") return null;
  const fatal = (meta as { fatalError?: unknown }).fatalError;
  return typeof fatal === "string" && fatal.trim() ? fatal.trim() : null;
}

function compareTimelineAsc(a: { ts: string; id: string }, b: { ts: string; id: string }): number {
  const c = a.ts.localeCompare(b.ts);
  return c !== 0 ? c : a.id.localeCompare(b.id);
}

function encodeTimelineCursor(ev: { ts: string; id: string }): string {
  return Buffer.from(JSON.stringify(ev), "utf8").toString("base64url");
}

export function decodeTimelineCursor(raw: string): { ts: string; id: string } | null {
  try {
    const json = Buffer.from(raw, "base64url").toString("utf8");
    const v = JSON.parse(json) as unknown;
    if (!v || typeof v !== "object") return null;
    const ts = (v as { ts?: unknown }).ts;
    const id = (v as { id?: unknown }).id;
    if (typeof ts !== "string" || typeof id !== "string") return null;
    return { ts, id };
  } catch {
    return null;
  }
}

function mapPersistedSeverity(s: string): ExecutionTimelineEvent["severity"] {
  if (s === "critical") return "critical";
  if (s === "warn") return "warn";
  if (s === "info") return "info";
  return "neutral";
}

function governanceLaneFromSurface(surface: string, code: string): ExecutionTimelineEvent["lane"] {
  if (surface === "policy" || code.startsWith("POLICY_")) return "policy";
  return "governance";
}

export async function getExecutionTimeline(input: {
  prisma: PrismaClient;
  tenantId: string;
  userId: string;
  executionKey: string;
  query: ExecutionTimelineQuery;
}): Promise<ExecutionTimelineResponse | null> {
  await maybeSyncGovernanceAuditProjection(input.prisma, input.tenantId);

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
      queueWaitMs: true,
      jobId: true,
      sink: true,
      totalTokens: true,
    },
  });

  if (!usage) return null;

  const traceId = usage.traceId;
  const assistantId = usage.assistantId ?? null;
  const sessionId = usage.sessionId ?? null;
  const fatal = metaFatal(usage.metadata);
  const replayLikely =
    typeof usage.metadata === "object" &&
    usage.metadata !== null &&
    "replayOriginExecutionId" in usage.metadata &&
    typeof (usage.metadata as { replayOriginExecutionId?: unknown }).replayOriginExecutionId === "string";

  const windowStart = new Date(usage.createdAt.getTime() - 120_000);
  const windowEnd = new Date(usage.createdAt.getTime() + usage.durationMs + 3_600_000);

  const browserRuns = await input.prisma.browserRun.findMany({
    where: { tenantId: input.tenantId, traceId },
    select: {
      id: true,
      status: true,
      traceId: true,
      browserSessionId: true,
      toolInvocationId: true,
      queuedReason: true,
      startedAt: true,
      finishedAt: true,
      createdAt: true,
      error: true,
    },
    orderBy: { createdAt: "asc" },
    take: 24,
  });

  const runIds = browserRuns.map((r) => r.id);
  const sessionIds = [...new Set(browserRuns.map((r) => r.browserSessionId))];

  const [browserEvents, artifacts, tools, notifications, governanceRows] = await Promise.all([
    runIds.length === 0 && sessionIds.length === 0
      ? Promise.resolve([])
      : input.prisma.browserEvent.findMany({
          where: {
            tenantId: input.tenantId,
            OR: [
              ...(runIds.length ? [{ browserRunId: { in: runIds } }] : []),
              ...(sessionIds.length
                ? [{ browserSessionId: { in: sessionIds }, createdAt: { gte: windowStart, lte: windowEnd } }]
                : []),
            ],
          },
          select: {
            id: true,
            type: true,
            payload: true,
            createdAt: true,
            browserRunId: true,
            browserSessionId: true,
          },
          orderBy: { seq: "asc" },
          take: 80,
        }),
    runIds.length === 0
      ? Promise.resolve([])
      : input.prisma.browserArtifact.findMany({
          where: { tenantId: input.tenantId, browserRunId: { in: runIds }, deletedAt: null },
          select: { id: true, browserRunId: true, kind: true, createdAt: true },
          orderBy: { createdAt: "asc" },
          take: 48,
        }),
    sessionId
      ? input.prisma.toolInvocation.findMany({
          where: {
            tenantId: input.tenantId,
            sessionId,
            createdAt: { gte: windowStart, lte: windowEnd },
          },
          select: { id: true, toolName: true, status: true, success: true, error: true, createdAt: true },
          orderBy: { createdAt: "asc" },
          take: 36,
        })
      : Promise.resolve([]),
    input.prisma.notification.findMany({
      where: {
        tenantId: input.tenantId,
        userId: input.userId,
        OR: [{ correlationId: traceId }, { traceId }],
      },
      select: {
        id: true,
        kind: true,
        title: true,
        deliveryState: true,
        createdAt: true,
        correlationId: true,
        traceId: true,
        executionId: true,
      },
      orderBy: { createdAt: "asc" },
      take: 24,
    }),
    input.prisma.runtimeGovernanceAuditEvent.findMany({
      where: {
        tenantId: input.tenantId,
        OR: [{ traceId }, ...(sessionId ? [{ sessionId }] : [])],
      },
      select: {
        id: true,
        code: true,
        severity: true,
        message: true,
        surface: true,
        traceId: true,
        metadata: true,
        createdAt: true,
      },
      orderBy: { createdAt: "asc" },
      take: 120,
    }),
  ]);

  const items: ExecutionTimelineEvent[] = [];

  items.push({
    id: `usage:${usage.id}`,
    ts: usage.createdAt.toISOString(),
    lane: "assistant",
    type: "ai_execution_usage_recorded",
    status: fatal ? "failed" : "completed",
    title: "Execution usage recorded",
    summary: `${usage.sink} · ${usage.durationMs} ms${usage.totalTokens != null ? ` · tokens ${usage.totalTokens}` : ""}`,
    severity: fatal ? "critical" : "neutral",
    executionId: traceId,
    traceId,
    assistantId,
    policyReasonCode: fatal ? governancePrimaryCodeFromFatal(fatal) : undefined,
    replayRelated: replayLikely || undefined,
    metadata: { usageRowId: usage.id, jobId: usage.jobId ?? null, queueWaitMs: usage.queueWaitMs ?? null },
  });

  if (usage.queueWaitMs != null && usage.queueWaitMs > 0) {
    items.push({
      id: `queue_wait:${usage.id}`,
      ts: usage.createdAt.toISOString(),
      lane: "queue",
      type: "execution_queue_wait",
      status: "completed",
      title: "Queue wait observed",
      summary: `queueWaitMs=${usage.queueWaitMs}`,
      severity: "info",
      executionId: traceId,
      traceId,
      assistantId,
      metadata: { approximate: true, usageRowId: usage.id },
    });
  }

  if (replayLikely) {
    items.push({
      id: `replay:${usage.id}`,
      ts: usage.createdAt.toISOString(),
      lane: "replay",
      type: "replay_marker",
      status: "info",
      title: "Replay correlation",
      summary: "replayOriginExecutionId present on usage metadata",
      severity: "info",
      executionId: traceId,
      traceId,
      assistantId,
      replayRelated: true,
      metadata: { replayLikely: true, usageRowId: usage.id },
    });
  }

  if (fatal) {
    items.push({
      id: `policy:fatal_usage:${usage.id}`,
      ts: usage.createdAt.toISOString(),
      lane: "policy",
      type: "assistant_fatal_metadata",
      status: "failed",
      title: "Assistant fatal metadata",
      summary: fatal.slice(0, 280),
      severity: "critical",
      executionId: traceId,
      traceId,
      assistantId,
      policyReasonCode: governancePrimaryCodeFromFatal(fatal),
      metadata: { source: "AiExecutionUsage.metadata", usageRowId: usage.id },
    });
  }

  for (const g of governanceRows) {
    const lane = governanceLaneFromSurface(g.surface, g.code);
    items.push({
      id: `govrow:${g.id}`,
      ts: g.createdAt.toISOString(),
      lane,
      type: "governance_audit_projection",
      status: "recorded",
      title: g.code,
      summary: g.message.slice(0, 280),
      severity: mapPersistedSeverity(g.severity),
      executionId: traceId,
      traceId,
      assistantId,
      governanceReasonCode: g.code.startsWith("GOVERNANCE_") ? g.code : undefined,
      policyReasonCode: g.code.startsWith("POLICY_") ? g.code : undefined,
      metadata: {
        persistedId: g.id,
        surface: g.surface,
        ...(typeof g.metadata === "object" && g.metadata !== null ? (g.metadata as Record<string, unknown>) : {}),
      },
    });
  }

  for (const t of tools) {
    items.push({
      id: `tool:${t.id}`,
      ts: t.createdAt.toISOString(),
      lane: "tools",
      type: "tool_invocation",
      status: String(t.status).toLowerCase(),
      title: t.toolName,
      summary: t.error ? t.error.slice(0, 200) : t.success ? "success" : "pending/completed",
      severity: t.status === "FAIL" || (t.status === "START" && Boolean(t.error)) ? "warn" : "neutral",
      executionId: traceId,
      traceId,
      assistantId,
      toolInvocationId: t.id,
      metadata: { sessionCorrelation: sessionId ?? null },
    });
  }

  for (const br of browserRuns) {
    items.push({
      id: `browser_run:create:${br.id}`,
      ts: br.createdAt.toISOString(),
      lane: "browser",
      type: "browser_run_scheduled",
      status: br.status,
      title: "Browser run",
      summary: `${br.status}${br.queuedReason ? ` · ${br.queuedReason}` : ""}`,
      severity: br.status === "failed" ? "critical" : "neutral",
      executionId: traceId,
      traceId,
      assistantId,
      browserRunId: br.id,
      metadata: {
        browserSessionId: br.browserSessionId,
        toolInvocationId: br.toolInvocationId ?? null,
      },
    });
    if (br.startedAt) {
      items.push({
        id: `browser_run:started:${br.id}`,
        ts: br.startedAt.toISOString(),
        lane: "browser",
        type: "browser_run_started",
        status: "running",
        title: "Browser run started",
        summary: br.browserSessionId,
        severity: "info",
        executionId: traceId,
        traceId,
        assistantId,
        browserRunId: br.id,
        metadata: { browserSessionId: br.browserSessionId },
      });
    }
    if (br.finishedAt) {
      items.push({
        id: `browser_run:finished:${br.id}`,
        ts: br.finishedAt.toISOString(),
        lane: "browser",
        type: "browser_run_finished",
        status: br.status,
        title: "Browser run finished",
        summary: String(br.status),
        severity: br.status === "failed" ? "critical" : "neutral",
        executionId: traceId,
        traceId,
        assistantId,
        browserRunId: br.id,
        metadata: { browserSessionId: br.browserSessionId, error: br.error ?? null },
      });
    }
  }

  for (const ev of browserEvents) {
    items.push({
      id: `browser_event:${ev.id}`,
      ts: ev.createdAt.toISOString(),
      lane: "browser",
      type: ev.type,
      status: "recorded",
      title: ev.type.replace(/_/g, " "),
      summary:
        typeof ev.payload === "object" && ev.payload !== null ? JSON.stringify(ev.payload).slice(0, 200) : "",
      severity: ev.type.includes("error") ? "critical" : "neutral",
      executionId: traceId,
      traceId,
      assistantId,
      browserRunId: ev.browserRunId ?? undefined,
      metadata: {
        browserSessionId: ev.browserSessionId,
        browserEventId: ev.id,
        payload: ev.payload ?? undefined,
      },
    });
  }

  for (const a of artifacts) {
    items.push({
      id: `artifact:${a.id}`,
      ts: a.createdAt.toISOString(),
      lane: "browser",
      type: "browser_artifact_recorded",
      status: "stored",
      title: `Artifact · ${a.kind}`,
      summary: "reference only",
      severity: "neutral",
      executionId: traceId,
      traceId,
      assistantId,
      browserRunId: a.browserRunId ?? undefined,
      metadata: {
        artifactKind: a.kind,
        artifactReferenceOnly: true,
        persistedArtifactId: a.id,
      },
    });
  }

  for (const n of notifications) {
    items.push({
      id: `notification:${n.id}`,
      ts: n.createdAt.toISOString(),
      lane: "notifications",
      type: "notification_correlated",
      status: n.deliveryState,
      title: n.title.slice(0, 160),
      summary: String(n.kind),
      severity: n.deliveryState === "failed" ? "warn" : "neutral",
      executionId: traceId,
      traceId,
      assistantId,
      notificationId: n.id,
      metadata: {
        correlationId: n.correlationId ?? traceId,
        notificationTraceId: n.traceId ?? null,
        notificationExecutionId: n.executionId ?? null,
      },
    });
  }

  items.sort((a, b) => compareTimelineAsc({ ts: a.ts, id: a.id }, { ts: b.ts, id: b.id }));

  const truncated = items.length >= MAX_MERGED_EVENTS;
  const merged = truncated ? items.slice(0, MAX_MERGED_EVENTS) : items;

  try {
    await materializeExecutionFacts({
      prisma: input.prisma,
      tenantId: input.tenantId,
      executionIdCanonical: traceId,
      traceId,
      items: merged,
    });
  } catch {
    /* materialization must not block timeline reads */
  }

  const cursorParsed = input.query.cursor ? decodeTimelineCursor(input.query.cursor) : null;
  let startIdx = 0;
  if (cursorParsed) {
    startIdx = merged.findIndex((ev) => compareTimelineAsc({ ts: ev.ts, id: ev.id }, cursorParsed) > 0);
    if (startIdx === -1) startIdx = merged.length;
  }

  const slice = merged.slice(startIdx, startIdx + input.query.limit);
  const hasMore = startIdx + slice.length < merged.length;
  const nextCursor =
    hasMore && slice.length > 0
      ? encodeTimelineCursor({ ts: slice[slice.length - 1].ts, id: slice[slice.length - 1].id })
      : null;

  return {
    ok: true,
    projection: "tenant_timeline_v1",
    executionId: traceId,
    traceId,
    items: attachTimelineDedupeKeys(slice),
    nextCursor,
    pageSize: slice.length,
    truncated,
  };
}
