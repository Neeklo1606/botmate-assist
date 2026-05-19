/**
 * Phase 11E — storage growth signals for `/health/runtime` (aggregates only).
 */
import type { PrismaClient } from "@botmate/database";

export async function collectStorageRetentionSignals(prisma: PrismaClient): Promise<{
  executionFactCount: number;
  aiExecutionUsageCount: number;
  runtimeActivityFactCount: number;
  runtimeActivityFactExpiredPending: number;
  governanceAuditEventCount: number;
  notificationQueuedCount: number;
  browserArtifactCount: number;
}> {
  const now = new Date();
  const [
    executionFactCount,
    aiExecutionUsageCount,
    runtimeActivityFactCount,
    runtimeActivityFactExpiredPending,
    governanceAuditEventCount,
    notificationQueuedCount,
    browserArtifactCount,
  ] = await Promise.all([
    prisma.executionFact.count(),
    prisma.aiExecutionUsage.count(),
    prisma.runtimeActivityFact.count(),
    prisma.runtimeActivityFact.count({
      where: { expiresAt: { not: null, lt: now } },
    }),
    prisma.runtimeGovernanceAuditEvent.count(),
    prisma.notification.count({ where: { deliveryState: "queued" } }),
    prisma.browserArtifact.count(),
  ]);

  return {
    executionFactCount,
    aiExecutionUsageCount,
    runtimeActivityFactCount,
    runtimeActivityFactExpiredPending,
    governanceAuditEventCount,
    notificationQueuedCount,
    browserArtifactCount,
  };
}
