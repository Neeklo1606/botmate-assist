/**
 * Phase 11F — commercial SaaS usage visibility (aggregates only; not a billing engine).
 */
import type { PrismaClient } from "@botmate/database";

export async function collectTenantUsageSignals(prisma: PrismaClient): Promise<{
  windowHours: number;
  distinctTenantsWithUsage: number;
  aiExecutionUsageRows: number;
  browserRuns: number;
  assistantRunUsageRows: number;
  estimatedCostUsdSum: number | null;
  messagesCreated: number;
}> {
  const windowHours = 24;
  const since = new Date(Date.now() - windowHours * 3_600_000);

  const [usageGrouped, browserRuns, messagesCreated, costAgg] = await Promise.all([
    prisma.aiExecutionUsage.groupBy({
      by: ["tenantId"],
      where: { createdAt: { gte: since } },
      _count: { _all: true },
    }),
    prisma.browserRun.count({ where: { createdAt: { gte: since } } }),
    prisma.message.count({ where: { createdAt: { gte: since } } }),
    prisma.aiExecutionUsage.aggregate({
      where: { createdAt: { gte: since }, estimatedCostUsd: { not: null } },
      _sum: { estimatedCostUsd: true },
    }),
  ]);

  const aiExecutionUsageRows = usageGrouped.reduce((n, g) => n + g._count._all, 0);

  const assistantRunUsageRows = await prisma.aiExecutionUsage.count({
    where: {
      createdAt: { gte: since },
      sink: "worker_assistant_run",
    },
  });

  return {
    windowHours,
    distinctTenantsWithUsage: usageGrouped.length,
    aiExecutionUsageRows,
    browserRuns,
    assistantRunUsageRows,
    estimatedCostUsdSum:
      costAgg._sum.estimatedCostUsd !== null && costAgg._sum.estimatedCostUsd !== undefined
        ? Number(costAgg._sum.estimatedCostUsd)
        : null,
    messagesCreated,
  };
}
