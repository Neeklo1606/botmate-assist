import type { PrismaClient } from "@botmate/database";
import type { ExecutionFactsResponse, ExecutionTimelineEvent } from "@botmate/shared";

export function executionFactsMaterializationDisabled(): boolean {
  return process.env.BOTMATE_RUNTIME_EXECUTION_FACTS?.trim() === "false";
}

/** Stable durable dedupe identity derived from timeline rows (Phase 9D). */
export function executionTimelineDedupeKey(ev: ExecutionTimelineEvent): string {
  const lane = ev.lane;
  const type = ev.type;
  if (ev.toolInvocationId) return `ToolInvocation:${ev.toolInvocationId}:${lane}:${type}`;
  if (ev.notificationId) return `Notification:${ev.notificationId}:${lane}:${type}`;
  if (ev.browserRunId && type.startsWith("browser_run")) return `BrowserRun:${ev.browserRunId}:${lane}:${type}`;
  const meta = ev.metadata as Record<string, unknown>;
  if (typeof meta.persistedId === "string") return `RuntimeGovernanceAuditEvent:${meta.persistedId}:${lane}:${type}`;
  if (typeof meta.usageRowId === "string") return `AiExecutionUsage:${String(meta.usageRowId)}:${lane}:${type}`;
  if (type === "browser_artifact_recorded") {
    const pk =
      typeof meta.persistedArtifactId === "string" ? meta.persistedArtifactId : ev.id.replace(/^artifact:/, "");
    const brid = ev.browserRunId ?? "none";
    return `BrowserArtifact:${pk}:${brid}:${lane}:${type}`;
  }
  if (ev.browserRunId && typeof meta.browserEventId === "string") {
    return `BrowserEvent:${String(meta.browserEventId)}:${lane}:${type}`;
  }
  return `TimelineSynthetic:${ev.id}:${lane}:${type}`;
}

export function inferFactSource(ev: ExecutionTimelineEvent): { sourceTable: string; sourceId: string } {
  const dk = executionTimelineDedupeKey(ev);
  const parts = dk.split(":");
  const sourceTable = parts[0] ?? "unknown";
  const sourceId = parts[1] ?? ev.id;
  return { sourceTable, sourceId };
}

export function attachTimelineDedupeKeys(events: ExecutionTimelineEvent[]): ExecutionTimelineEvent[] {
  return events.map((e) => ({ ...e, dedupeKey: executionTimelineDedupeKey(e) }));
}

export async function materializeExecutionFacts(input: {
  prisma: PrismaClient;
  tenantId: string;
  executionIdCanonical: string;
  traceId: string;
  items: ExecutionTimelineEvent[];
}): Promise<void> {
  if (executionFactsMaterializationDisabled()) return;

  for (const ev of input.items) {
    const dedupeKey = executionTimelineDedupeKey(ev);
    const { sourceTable, sourceId } = inferFactSource(ev);
    const meta = ev.metadata as Record<string, unknown>;
    const correlationId =
      ev.notificationId ? input.traceId : typeof meta.correlationId === "string" ? meta.correlationId : null;

    await input.prisma.executionFact.upsert({
      where: { tenantId_dedupeKey: { tenantId: input.tenantId, dedupeKey } },
      create: {
        tenantId: input.tenantId,
        dedupeKey,
        executionId: input.executionIdCanonical,
        traceId: input.traceId,
        correlationId,
        assistantId: ev.assistantId,
        lane: ev.lane,
        type: ev.type,
        status: ev.status,
        severity: ev.severity,
        ts: new Date(ev.ts),
        summary: ev.summary.slice(0, 16_000),
        policyReasonCode: ev.policyReasonCode ?? null,
        governanceReasonCode: ev.governanceReasonCode ?? null,
        replayRelated: Boolean(ev.replayRelated),
        sourceTable,
        sourceId,
        provisional: false,
      },
      update: {
        executionId: input.executionIdCanonical,
        traceId: input.traceId,
        correlationId,
        assistantId: ev.assistantId,
        status: ev.status,
        severity: ev.severity,
        summary: ev.summary.slice(0, 16_000),
        ts: new Date(ev.ts),
        policyReasonCode: ev.policyReasonCode ?? null,
        governanceReasonCode: ev.governanceReasonCode ?? null,
        replayRelated: Boolean(ev.replayRelated),
        sourceTable,
        sourceId,
        provisional: false,
      },
    });
  }
}

export async function listExecutionFactsPage(input: {
  prisma: PrismaClient;
  tenantId: string;
  executionKey: string;
  page: number;
  pageSize: number;
}): Promise<ExecutionFactsResponse | null> {
  const usage = await input.prisma.aiExecutionUsage.findFirst({
    where: {
      tenantId: input.tenantId,
      OR: [{ id: input.executionKey }, { traceId: input.executionKey }],
    },
    select: { traceId: true },
  });

  if (!usage) return null;

  const traceId = usage.traceId;

  const total = await input.prisma.executionFact.count({
    where: { tenantId: input.tenantId, traceId },
  });

  const rows = await input.prisma.executionFact.findMany({
    where: { tenantId: input.tenantId, traceId },
    orderBy: { ts: "desc" },
    skip: (input.page - 1) * input.pageSize,
    take: input.pageSize,
    select: {
      id: true,
      dedupeKey: true,
      lane: true,
      type: true,
      status: true,
      severity: true,
      ts: true,
      summary: true,
      sourceTable: true,
      sourceId: true,
      policyReasonCode: true,
      governanceReasonCode: true,
      replayRelated: true,
      provisional: true,
    },
  });

  return {
    ok: true,
    projection: "tenant_execution_facts_v1",
    executionId: traceId,
    traceId,
    items: rows.map((r) => ({
      id: r.id,
      dedupeKey: r.dedupeKey,
      lane: r.lane,
      type: r.type,
      status: r.status,
      severity: r.severity,
      ts: r.ts.toISOString(),
      summary: r.summary.slice(0, 2048),
      sourceTable: r.sourceTable,
      sourceId: r.sourceId,
      policyReasonCode: r.policyReasonCode ?? null,
      governanceReasonCode: r.governanceReasonCode ?? null,
      replayRelated: r.replayRelated,
      provisional: r.provisional,
    })),
    page: input.page,
    pageSize: input.pageSize,
    total,
  };
}
