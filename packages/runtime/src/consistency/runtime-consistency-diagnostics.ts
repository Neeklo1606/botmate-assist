import type { PrismaClient } from "@botmate/database";
import type { RuntimeConsistencyReport } from "@botmate/shared";

function stuckThresholdMs(): number {
  const v = Number(process.env.RUNTIME_STUCK_THRESHOLD_MS ?? `${1_800_000}`);
  return Math.min(86_400_000, Math.max(120_000, Math.floor(v)));
}

/**
 * Tenant consistency diagnostics — worker-safe projection (`tenant_runtime_consistency_v1`).
 */
export async function getRuntimeConsistencyDiagnostics(input: {
  prisma: PrismaClient;
  tenantId: string;
}): Promise<RuntimeConsistencyReport> {
  const staleBefore = new Date(Date.now() - stuckThresholdMs());
  const sevenDays = new Date(Date.now() - 7 * 86_400_000);

  const [
    staleTools,
    stuckBrowsers,
    notificationsMissingCorrelation,
    orphanBrowserRunsSample,
    factsMissingUsageSample,
    governanceDeniedRecent,
  ] = await Promise.all([
    input.prisma.toolInvocation.count({
      where: { tenantId: input.tenantId, status: "START", createdAt: { lt: staleBefore } },
    }),
    input.prisma.browserRun.count({
      where: { tenantId: input.tenantId, status: "running", updatedAt: { lt: staleBefore } },
    }),
    input.prisma.notification.count({
      where: {
        tenantId: input.tenantId,
        kind: "job",
        createdAt: { gte: sevenDays },
        traceId: null,
        correlationId: null,
      },
    }),
    input.prisma.browserRun.findMany({
      where: { tenantId: input.tenantId },
      select: { id: true, traceId: true },
      orderBy: { createdAt: "desc" },
      take: 40,
    }),
    input.prisma.executionFact.findMany({
      where: { tenantId: input.tenantId },
      select: { id: true, traceId: true },
      orderBy: { ts: "desc" },
      take: 40,
    }),
    input.prisma.runtimeGovernanceAuditEvent.count({
      where: {
        tenantId: input.tenantId,
        createdAt: { gte: sevenDays },
        code: "POLICY_DENIED",
      },
    }),
  ]);

  const traceSamples = orphanBrowserRunsSample.map((r) => r.traceId);
  const usagesForTraces =
    traceSamples.length === 0 ?
      []
    : await input.prisma.aiExecutionUsage.findMany({
        where: { tenantId: input.tenantId, traceId: { in: traceSamples } },
        select: { traceId: true },
      });
  const usageTrace = new Set(usagesForTraces.map((u) => u.traceId));
  const orphanBrowserIds = orphanBrowserRunsSample.filter((r) => !usageTrace.has(r.traceId)).map((r) => r.id);

  const factTraces = factsMissingUsageSample.map((f) => f.traceId);
  const usagesForFacts =
    factTraces.length === 0 ?
      []
    : await input.prisma.aiExecutionUsage.findMany({
        where: { tenantId: input.tenantId, traceId: { in: factTraces } },
        select: { traceId: true },
      });
  const usageFactTrace = new Set(usagesForFacts.map((u) => u.traceId));
  const orphanFactIds = factsMissingUsageSample.filter((f) => !usageFactTrace.has(f.traceId)).map((f) => f.id);

  const issues: RuntimeConsistencyReport["issues"] = [];

  if (staleTools > 0) {
    issues.push({
      code: "STALE_TOOL_INVOCATIONS_START",
      severity: "warn",
      count: staleTools,
      sampleIds: [],
      hint: "ToolInvocation stuck in START beyond RUNTIME_STUCK_THRESHOLD_MS — governance projection should mirror drift signals.",
    });
  }

  if (stuckBrowsers > 0) {
    issues.push({
      code: "STALE_BROWSER_RUN_RUNNING",
      severity: "warn",
      count: stuckBrowsers,
      sampleIds: [],
      hint: "BrowserRun stuck running beyond threshold — inspect worker/browser-runtime connectivity.",
    });
  }

  if (notificationsMissingCorrelation > 0) {
    issues.push({
      code: "NOTIFICATION_MISSING_EXECUTION_CORRELATION",
      severity: "info",
      count: notificationsMissingCorrelation,
      sampleIds: [],
      hint: "Recent job notifications without traceId/correlationId — timeline correlation degraded.",
    });
  }

  if (orphanBrowserIds.length > 0) {
    issues.push({
      code: "BROWSER_RUN_TRACE_USAGE_MISMATCH_SAMPLE",
      severity: "warn",
      count: orphanBrowserIds.length,
      sampleIds: orphanBrowserIds.slice(0, 12),
      hint: "Sample latest BrowserRun rows whose traceId lacks AiExecutionUsage anchor (tenant scoped).",
    });
  }

  if (orphanFactIds.length > 0) {
    issues.push({
      code: "EXECUTION_FACT_MISSING_USAGE_SAMPLE",
      severity: "info",
      count: orphanFactIds.length,
      sampleIds: orphanFactIds.slice(0, 12),
      hint: "ExecutionFact rows referencing traces without matching AiExecutionUsage — TTL retention mismatch possible.",
    });
  }

  if (governanceDeniedRecent > 0) {
    issues.push({
      code: "RECENT_POLICY_DENIED_AUDIT_ROWS",
      severity: "info",
      count: governanceDeniedRecent,
      sampleIds: [],
      hint: "Persisted POLICY_DENIED governance projection signals (last 7d).",
    });
  }

  return {
    ok: true,
    projection: "tenant_runtime_consistency_v1",
    generatedAt: new Date().toISOString(),
    issues,
  };
}
