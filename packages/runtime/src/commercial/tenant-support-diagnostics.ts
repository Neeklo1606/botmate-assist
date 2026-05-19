import type { PrismaClient } from "@botmate/database";
import { resolvePlanEntitlements, resolveTenantPlanTier } from "./plan-entitlements.js";

export async function buildTenantSupportDiagnostics(
  prisma: PrismaClient,
  tenantId: string,
  userId: string,
  opts?: {
    redisConfigured?: boolean;
    queuesAvailable?: boolean;
    assistantRunEnqueueEnabled?: boolean;
  },
): Promise<{
  ok: true;
  tenantId: string;
  planTier: ReturnType<typeof resolveTenantPlanTier>;
  integrations: {
    openAiConfigured: boolean;
    openAiOwnerUserId: string | null;
    openAiReachable: boolean | null;
  };
  runtime: { enabled: boolean; executionsTotal: number; executionsLast24h: number };
  worker: {
    redisConfigured: boolean;
    queuesAvailable: boolean;
    assistantRunEnqueueEnabled: boolean;
  };
  hints: string[];
  recoveryActions: Array<{ label: string; href: string }>;
  exportBundle: { generatedAt: string; tenantId: string; planTier: ReturnType<typeof resolveTenantPlanTier> };
}> {
  const last24h = new Date(Date.now() - 86_400_000);

  const tenant = await prisma.tenant.findUnique({
    where: { id: tenantId },
    select: { planTier: true, suspendedAt: true },
  });
  const planTier = resolveTenantPlanTier(tenant?.planTier);
  const entitlements = resolvePlanEntitlements(planTier);

  const [openAi, executionsTotal, executionsLast24h] = await Promise.all([
    prisma.integrationAccount.findFirst({
      where: { userId, provider: "OPENAI", isActive: true },
      select: { userId: true },
    }),
    prisma.aiExecutionUsage.count({ where: { tenantId } }),
    prisma.aiExecutionUsage.count({ where: { tenantId, createdAt: { gte: last24h } } }),
  ]);

  const redisConfigured = opts?.redisConfigured ?? Boolean(process.env.REDIS_URL?.trim());
  const queuesAvailable = opts?.queuesAvailable ?? false;
  const assistantRunEnqueueEnabled =
    opts?.assistantRunEnqueueEnabled ??
    process.env.BOTMATE_ASSISTANT_RUN_ENQUEUE_ENABLED?.trim().toLowerCase() === "true";

  const hints: string[] = [];
  const recoveryActions: Array<{ label: string; href: string }> = [];

  if (tenant?.suspendedAt) hints.push("Workspace is suspended — contact account owner.");
  if (!openAi) {
    hints.push("OpenAI integration not configured — assistants cannot call models.");
    recoveryActions.push({ label: "Connect OpenAI", href: "/workspace?tab=integrations" });
  }
  if (!entitlements.runtimeUi) {
    hints.push("Runtime is not on current plan — upgrade to Pro for execution visibility.");
    recoveryActions.push({ label: "View plan & usage", href: "/workspace?tab=overview" });
  }
  if (!redisConfigured) {
    hints.push("REDIS_URL not configured — background jobs and realtime may be degraded.");
  } else if (!queuesAvailable) {
    hints.push("Worker queues unavailable — start worker service or check Redis connectivity.");
    recoveryActions.push({ label: "Runtime overview", href: "/runtime" });
  }
  if (executionsTotal === 0) {
    hints.push("No executions recorded — complete guided chat test after OpenAI setup.");
    recoveryActions.push({ label: "Open chat", href: "/chat" });
  }
  if (hints.length === 0) hints.push("No critical issues detected from tenant-scoped checks.");

  return {
    ok: true,
    tenantId,
    planTier,
    integrations: {
      openAiConfigured: Boolean(openAi),
      openAiOwnerUserId: openAi?.userId ?? null,
      openAiReachable: openAi ? true : null,
    },
    runtime: {
      enabled: entitlements.runtimeUi,
      executionsTotal,
      executionsLast24h,
    },
    worker: {
      redisConfigured,
      queuesAvailable,
      assistantRunEnqueueEnabled,
    },
    hints,
    recoveryActions,
    exportBundle: {
      generatedAt: new Date().toISOString(),
      tenantId,
      planTier,
    },
  };
}
