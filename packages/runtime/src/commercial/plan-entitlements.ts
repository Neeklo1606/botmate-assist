import type { PlanEntitlements, TenantPlanTier } from "@botmate/shared";

const MATRIX: Record<TenantPlanTier, PlanEntitlements> = {
  starter: {
    planTier: "starter",
    runtimeUi: false,
    runtimeWorkspaceUi: false,
    browserAutomation: false,
    maxAssistants: 3,
    maxKnowledgeDocuments: 25,
    maxWorkspaceMembers: 5,
    executionsPerMonth: 2_000,
    browserRunsPerMonth: 0,
  },
  pro: {
    planTier: "pro",
    runtimeUi: true,
    runtimeWorkspaceUi: false,
    browserAutomation: true,
    maxAssistants: 25,
    maxKnowledgeDocuments: 200,
    maxWorkspaceMembers: 15,
    executionsPerMonth: 25_000,
    browserRunsPerMonth: 500,
  },
  enterprise: {
    planTier: "enterprise",
    runtimeUi: true,
    runtimeWorkspaceUi: true,
    browserAutomation: true,
    maxAssistants: 200,
    maxKnowledgeDocuments: 5_000,
    maxWorkspaceMembers: 100,
    executionsPerMonth: 250_000,
    browserRunsPerMonth: 10_000,
  },
};

export function resolvePlanEntitlements(planTier: TenantPlanTier): PlanEntitlements {
  return MATRIX[planTier];
}

export function resolveTenantPlanTier(raw: string | null | undefined): TenantPlanTier {
  if (raw === "pro" || raw === "enterprise" || raw === "starter") return raw;
  return "starter";
}
