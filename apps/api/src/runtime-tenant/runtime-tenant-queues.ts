import type { PrismaClient } from "@botmate/database";
import type { RuntimeQueuesResponse } from "@botmate/shared";

export async function listTenantRuntimeQueues(input: {
  prisma: PrismaClient;
  tenantId: string;
}): Promise<RuntimeQueuesResponse> {
  const last24h = new Date(Date.now() - 86_400_000);

  const [
    approximatePendingToolInvocations,
    approximateAiUsagesWithQueueWait,
    queuedRuns,
    runningRuns,
    pendingDeliveryTenantWide,
    queuedDeliveryTenantWide,
    documentsPending,
    documentsProcessing,
    documentsFailed,
  ] = await Promise.all([
    input.prisma.toolInvocation.count({
      where: { tenantId: input.tenantId, status: "START" },
    }),
    input.prisma.aiExecutionUsage.count({
      where: {
        tenantId: input.tenantId,
        queueWaitMs: { not: null, gt: 0 },
        createdAt: { gte: last24h },
      },
    }),
    input.prisma.browserRun.count({
      where: { tenantId: input.tenantId, status: "queued" },
    }),
    input.prisma.browserRun.count({
      where: { tenantId: input.tenantId, status: "running" },
    }),
    input.prisma.notification.count({
      where: { tenantId: input.tenantId, deliveryState: "pending" },
    }),
    input.prisma.notification.count({
      where: { tenantId: input.tenantId, deliveryState: "queued" },
    }),
    input.prisma.knowledgeDocument.count({
      where: { tenantId: input.tenantId, status: "pending", archivedAt: null },
    }),
    input.prisma.knowledgeDocument.count({
      where: { tenantId: input.tenantId, status: "processing", archivedAt: null },
    }),
    input.prisma.knowledgeDocument.count({
      where: { tenantId: input.tenantId, status: "failed", archivedAt: null },
    }),
  ]);

  return {
    ok: true,
    projection: "tenant_queue_approx_v1",
    buckets: {
      assistant: {
        approximatePendingToolInvocations,
        approximateAiUsagesWithQueueWait,
      },
      browser: {
        queuedRuns,
        runningRuns,
      },
      notifications: {
        pendingDeliveryTenantWide,
        queuedDeliveryTenantWide,
      },
      knowledge: {
        documentsPending,
        documentsProcessing,
        documentsFailed,
      },
    },
    telemetry: {
      bullMqDepthExcluded: true,
      approximateProjection: true,
    },
  };
}
