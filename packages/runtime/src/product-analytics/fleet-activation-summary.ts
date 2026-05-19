import type { PrismaClient } from "@botmate/database";
import { productSupportMetricsSnapshot } from "./product-support-metrics.js";

export async function buildFleetProductAnalyticsSnapshot(prisma: PrismaClient): Promise<{
  ok: true;
  windowDays: number;
  tenantsTotal: number;
  tenantsWithAssistants: number;
  tenantsWithKnowledge: number;
  tenantsWithChat: number;
  tenantsWithExecutions: number;
  tenantsRuntimeOpened7d: number;
  tenantsCompareOpened7d: number;
  tenantsIncidentsOpened7d: number;
  tenantsBrowserRuns7d: number;
  supportMetrics: Record<string, number>;
}> {
  const windowDays = 7;
  const since = new Date(Date.now() - windowDays * 86_400_000);

  const [
    tenantsTotal,
    assistantGrouped,
    knowledgeGrouped,
    chatGrouped,
    executionGrouped,
    runtimeOpenedGrouped,
    compareOpenedGrouped,
    incidentsOpenedGrouped,
    browserGrouped,
  ] = await Promise.all([
    prisma.tenant.count(),
    prisma.assistant.groupBy({ by: ["tenantId"], where: { archivedAt: null } }),
    prisma.knowledgeDocument.groupBy({ by: ["tenantId"] }),
    prisma.message.groupBy({
      by: ["tenantId"],
      where: { role: "ASSISTANT", createdAt: { gte: since } },
    }),
    prisma.aiExecutionUsage.groupBy({
      by: ["tenantId"],
      where: { createdAt: { gte: since } },
    }),
    prisma.productAnalyticsEvent.groupBy({
      by: ["tenantId"],
      where: {
        createdAt: { gte: since },
        name: "activation.runtime_opened",
      },
    }),
    prisma.productAnalyticsEvent.groupBy({
      by: ["tenantId"],
      where: {
        createdAt: { gte: since },
        name: "activation.compare_opened",
      },
    }),
    prisma.productAnalyticsEvent.groupBy({
      by: ["tenantId"],
      where: {
        createdAt: { gte: since },
        name: "activation.incidents_opened",
      },
    }),
    prisma.browserRun.groupBy({
      by: ["tenantId"],
      where: { createdAt: { gte: since } },
    }),
  ]);

  return {
    ok: true,
    windowDays,
    tenantsTotal,
    tenantsWithAssistants: assistantGrouped.length,
    tenantsWithKnowledge: knowledgeGrouped.length,
    tenantsWithChat: chatGrouped.length,
    tenantsWithExecutions: executionGrouped.length,
    tenantsRuntimeOpened7d: runtimeOpenedGrouped.length,
    tenantsCompareOpened7d: compareOpenedGrouped.length,
    tenantsIncidentsOpened7d: incidentsOpenedGrouped.length,
    tenantsBrowserRuns7d: browserGrouped.length,
    supportMetrics: productSupportMetricsSnapshot(),
  };
}
