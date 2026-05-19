import type { PrismaClient } from "@botmate/database";
import type { CustomerLifecycleStage } from "./tenant-lifecycle.js";
import { buildTenantActivationSnapshot } from "../product-analytics/tenant-activation-snapshot.js";
import { deriveCustomerLifecycleStage, recommendedNextStepsForLifecycle } from "./tenant-lifecycle.js";
import { resolvePlanEntitlements, resolveTenantPlanTier } from "./plan-entitlements.js";

export type OnboardingStepsPersisted = {
  assistantCreated?: boolean;
  openAiConfigured?: boolean;
  knowledgeUploaded?: boolean;
  firstChatSuccess?: boolean;
  runtimeOpened?: boolean;
  onboardingCompleted?: boolean;
};

export async function syncTenantWorkspaceState(
  prisma: PrismaClient,
  tenantId: string,
): Promise<{
  lifecycleStage: CustomerLifecycleStage;
  recommendedActions: string[];
  onboardingCompletedAt: Date | null;
  onboardingSteps: OnboardingStepsPersisted;
}> {
  const tenant = await prisma.tenant.findUnique({
    where: { id: tenantId },
    select: { planTier: true },
  });
  const planTier = resolveTenantPlanTier(tenant?.planTier);
  const entitlements = resolvePlanEntitlements(planTier);
  const activation = await buildTenantActivationSnapshot(prisma, tenantId);
  const memberCount = await prisma.user.count({ where: { tenantId } });
  const tenantUserIds = await prisma.user.findMany({
    where: { tenantId },
    select: { id: true },
  });
  const openAiCount = await prisma.integrationAccount.count({
    where: {
      userId: { in: tenantUserIds.map((u) => u.id) },
      provider: "OPENAI",
      isActive: true,
    },
  });

  const lifecycleStage = deriveCustomerLifecycleStage({
    activation,
    entitlements,
    memberCount,
  });
  const recommendedActions = recommendedNextStepsForLifecycle(lifecycleStage, activation);

  const onboardingSteps: OnboardingStepsPersisted = {
    assistantCreated: activation.milestones.firstAssistantCreated,
    openAiConfigured: openAiCount > 0,
    knowledgeUploaded: activation.milestones.firstKnowledgeUploaded,
    firstChatSuccess: activation.milestones.firstChatSuccess,
    runtimeOpened: activation.milestones.runtimeOpened,
    onboardingCompleted:
      activation.milestones.firstAssistantCreated &&
      activation.milestones.firstKnowledgeUploaded &&
      activation.milestones.firstChatSuccess,
  };

  const onboardingCompletedAt =
    onboardingSteps.onboardingCompleted ? new Date() : null;

  const churnRiskAt =
    lifecycleStage === "churn_risk" ? new Date() : null;

  await prisma.tenantWorkspaceState.upsert({
    where: { tenantId },
    create: {
      tenantId,
      lifecycleStage,
      onboardingSteps,
      recommendedActions,
      onboardingCompletedAt,
      churnRiskAt,
      lifecycleSyncedAt: new Date(),
    },
    update: {
      lifecycleStage,
      onboardingSteps,
      recommendedActions,
      onboardingCompletedAt,
      churnRiskAt,
      lifecycleSyncedAt: new Date(),
    },
  });

  return {
    lifecycleStage,
    recommendedActions,
    onboardingCompletedAt,
    onboardingSteps,
  };
}

export async function getTenantWorkspaceState(prisma: PrismaClient, tenantId: string) {
  const row = await prisma.tenantWorkspaceState.findUnique({ where: { tenantId } });
  if (!row) {
    return syncTenantWorkspaceState(prisma, tenantId);
  }
  if (
    !row.lifecycleSyncedAt ||
    Date.now() - row.lifecycleSyncedAt.getTime() > 5 * 60_000
  ) {
    return syncTenantWorkspaceState(prisma, tenantId);
  }
  return {
    lifecycleStage: row.lifecycleStage as CustomerLifecycleStage,
    recommendedActions: Array.isArray(row.recommendedActions)
      ? (row.recommendedActions as string[])
      : [],
    onboardingCompletedAt: row.onboardingCompletedAt,
    onboardingSteps: (row.onboardingSteps ?? {}) as OnboardingStepsPersisted,
  };
}
