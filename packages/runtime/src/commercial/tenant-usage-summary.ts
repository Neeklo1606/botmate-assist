import type { PrismaClient } from "@botmate/database";
import type { PlanEntitlements } from "@botmate/shared";
import { resolvePlanEntitlements, resolveTenantPlanTier } from "./plan-entitlements.js";

function quotaItem(input: {
  key: string;
  label: string;
  used: number;
  limit: number;
}) {
  const limit = Math.max(1, input.limit);
  const percent = Math.min(100, Math.round((input.used / limit) * 100));
  return {
    key: input.key,
    label: input.label,
    used: input.used,
    limit: input.limit,
    percent,
    atLimit: input.used >= input.limit,
  };
}

export async function buildTenantUsageSummary(
  prisma: PrismaClient,
  tenantId: string,
): Promise<{
  ok: true;
  windowDays: number;
  executions: ReturnType<typeof quotaItem>;
  browserRuns: ReturnType<typeof quotaItem>;
  assistants: ReturnType<typeof quotaItem>;
  knowledgeDocuments: ReturnType<typeof quotaItem>;
  members: ReturnType<typeof quotaItem>;
  messagesLastWindow: number;
  storageApproxDocuments: number;
  entitlements: PlanEntitlements;
}> {
  const windowDays = 30;
  const since = new Date(Date.now() - windowDays * 86_400_000);
  const monthStart = new Date();
  monthStart.setUTCDate(1);
  monthStart.setUTCHours(0, 0, 0, 0);

  const tenant = await prisma.tenant.findUnique({
    where: { id: tenantId },
    select: { planTier: true },
  });
  const entitlements = resolvePlanEntitlements(resolveTenantPlanTier(tenant?.planTier));

  const [
    executionsMonth,
    browserRunsMonth,
    assistantsCount,
    knowledgeDocs,
    membersCount,
    messagesLastWindow,
  ] = await Promise.all([
    prisma.aiExecutionUsage.count({
      where: { tenantId, createdAt: { gte: monthStart } },
    }),
    prisma.browserRun.count({
      where: { tenantId, createdAt: { gte: monthStart } },
    }),
    prisma.assistant.count({ where: { tenantId, archivedAt: null } }),
    prisma.knowledgeDocument.count({ where: { tenantId } }),
    prisma.user.count({ where: { tenantId } }),
    prisma.message.count({ where: { tenantId, createdAt: { gte: since } } }),
  ]);

  return {
    ok: true,
    windowDays,
    entitlements,
    executions: quotaItem({
      key: "executions",
      label: "Executions (calendar month)",
      used: executionsMonth,
      limit: entitlements.executionsPerMonth,
    }),
    browserRuns: quotaItem({
      key: "browserRuns",
      label: "Browser runs (calendar month)",
      used: browserRunsMonth,
      limit: Math.max(entitlements.browserRunsPerMonth, 1),
    }),
    assistants: quotaItem({
      key: "assistants",
      label: "Active assistants",
      used: assistantsCount,
      limit: entitlements.maxAssistants,
    }),
    knowledgeDocuments: quotaItem({
      key: "knowledge",
      label: "Knowledge documents",
      used: knowledgeDocs,
      limit: entitlements.maxKnowledgeDocuments,
    }),
    members: quotaItem({
      key: "members",
      label: "Workspace members",
      used: membersCount,
      limit: entitlements.maxWorkspaceMembers,
    }),
    messagesLastWindow,
    storageApproxDocuments: knowledgeDocs,
  };
}
