import type { TenantActivationSnapshot } from "@botmate/shared";
import type { PlanEntitlements } from "@botmate/shared";

export type CustomerLifecycleStage =
  | "invited"
  | "onboarded"
  | "activated"
  | "retained"
  | "advanced_runtime"
  | "enterprise_candidate"
  | "churn_risk";

export function deriveCustomerLifecycleStage(input: {
  activation: TenantActivationSnapshot;
  entitlements: PlanEntitlements;
  memberCount: number;
}): CustomerLifecycleStage {
  const { activation, entitlements } = input;
  if (activation.health === "at_risk") return "churn_risk";
  if (activation.health === "stuck" && input.memberCount <= 1) return "invited";
  if (!activation.milestones.firstAssistantCreated) return "onboarded";
  if (!activation.milestones.firstChatSuccess) return "onboarded";
  if (activation.milestones.compareOpened || activation.milestones.incidentsViewed) {
    return entitlements.planTier === "enterprise" ? "enterprise_candidate" : "advanced_runtime";
  }
  if (activation.milestones.runtimeOpened && entitlements.planTier === "pro") {
    return "advanced_runtime";
  }
  if (activation.health === "healthy") return "retained";
  if (activation.health === "activating") return "activated";
  if (activation.health === "inactive") return "churn_risk";
  return "activated";
}

export function recommendedNextStepsForLifecycle(
  stage: CustomerLifecycleStage,
  activation: TenantActivationSnapshot,
): string[] {
  if (activation.hints.length > 0) return activation.hints;
  switch (stage) {
    case "invited":
      return ["Invite teammates from Workspace → Team", "Create your first assistant"];
    case "onboarded":
      return ["Upload knowledge", "Send a test chat message"];
    case "activated":
      return ["Publish an assistant", "Explore leads inbox"];
    case "advanced_runtime":
      return ["Review failed executions in Runtime", "Acknowledge open incidents"];
    case "enterprise_candidate":
      return ["Contact sales for enterprise workspace tools", "Enable advanced runtime mode"];
    case "churn_risk":
      return ["Check integrations and realtime connection", "Contact support with diagnostics export"];
    default:
      return ["Keep assistants active", "Monitor usage on Workspace hub"];
  }
}
