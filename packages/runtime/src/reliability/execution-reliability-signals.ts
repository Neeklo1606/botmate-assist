/**
 * Phase 11F — bounded execution reliability signals (aggregates for health; no autonomous repair).
 */
import type { PrismaClient } from "@botmate/database";
import { collectExecutionSignals } from "../control-plane/observability.js";
import { bumpOrphanUsageRowsObserved } from "../enterprise/enterprise-observability-metrics.js";

function stuckThresholdMs(): number {
  const v = Number(process.env.RUNTIME_STUCK_THRESHOLD_MS ?? `${1_800_000}`);
  return Math.min(86_400_000, Math.max(120_000, Math.floor(v)));
}

export async function collectExecutionReliabilitySignals(prisma: PrismaClient): Promise<{
  stuckThresholdMs: number;
  stuckToolInvocationsStart: number;
  stuckBrowserRuns: number;
  browserRunsByStatus: Record<string, number>;
  messageStreamingCount: number;
  messagePartialCount: number;
  messageFailedCount: number;
  browserQueuedStaleCount: number;
  usageRowsLast24h: number;
  usageOrphanSessionNullLast24h: number;
  executionFactCount: number;
  executionFactProvisionalCount: number;
}> {
  const staleBefore = new Date(Date.now() - stuckThresholdMs());
  const last24h = new Date(Date.now() - 86_400_000);
  const queuedStaleBefore = new Date(Date.now() - 3_600_000);

  const base = await collectExecutionSignals(prisma);

  const [
    messageStreamingCount,
    messagePartialCount,
    messageFailedCount,
    browserQueuedStaleCount,
    usageRowsLast24h,
    usageOrphanSessionNullLast24h,
    executionFactCount,
    executionFactProvisionalCount,
  ] = await Promise.all([
    prisma.message.count({ where: { deliveryStatus: "streaming" } }),
    prisma.message.count({ where: { deliveryStatus: "partial" } }),
    prisma.message.count({ where: { deliveryStatus: "failed" } }),
    prisma.browserRun.count({
      where: { status: "queued", createdAt: { lt: queuedStaleBefore } },
    }),
    prisma.aiExecutionUsage.count({ where: { createdAt: { gte: last24h } } }),
    prisma.aiExecutionUsage.count({
      where: { createdAt: { gte: last24h }, sessionId: null },
    }),
    prisma.executionFact.count(),
    prisma.executionFact.count({ where: { provisional: true } }),
  ]);

  if (usageOrphanSessionNullLast24h > 0) {
    bumpOrphanUsageRowsObserved(usageOrphanSessionNullLast24h);
  }

  return {
    ...base,
    messageStreamingCount,
    messagePartialCount,
    messageFailedCount,
    browserQueuedStaleCount,
    usageRowsLast24h,
    usageOrphanSessionNullLast24h,
    executionFactCount,
    executionFactProvisionalCount,
  };
}
