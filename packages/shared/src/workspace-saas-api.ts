import { z } from "zod";
import { TenantActivationSnapshotSchema } from "./product-analytics-api.js";

export const TenantPlanTierSchema = z.enum(["starter", "pro", "enterprise"]);

export const PlanEntitlementsSchema = z.object({
  planTier: TenantPlanTierSchema,
  runtimeUi: z.boolean(),
  runtimeWorkspaceUi: z.boolean(),
  browserAutomation: z.boolean(),
  maxAssistants: z.number().int().positive(),
  maxKnowledgeDocuments: z.number().int().positive(),
  maxWorkspaceMembers: z.number().int().positive(),
  executionsPerMonth: z.number().int().positive(),
  browserRunsPerMonth: z.number().int().nonnegative(),
});

export const UsageQuotaItemSchema = z.object({
  key: z.string(),
  label: z.string(),
  used: z.number().int().nonnegative(),
  limit: z.number().int().nonnegative(),
  percent: z.number().min(0).max(100),
  atLimit: z.boolean(),
});

export const WorkspaceUsageSummarySchema = z.object({
  ok: z.literal(true),
  windowDays: z.number().int().positive(),
  executions: UsageQuotaItemSchema,
  browserRuns: UsageQuotaItemSchema,
  assistants: UsageQuotaItemSchema,
  knowledgeDocuments: UsageQuotaItemSchema,
  members: UsageQuotaItemSchema,
  messagesLastWindow: z.number().int().nonnegative(),
  storageApproxDocuments: z.number().int().nonnegative(),
});

export const WorkspaceMemberRowSchema = z.object({
  id: z.string(),
  email: z.string().email(),
  fullName: z.string(),
  role: z.enum(["OWNER", "ADMIN", "OPERATOR", "VIEWER"]),
  createdAt: z.string(),
});

export const WorkspaceMembersResponseSchema = z.object({
  ok: z.literal(true),
  items: z.array(WorkspaceMemberRowSchema),
});

export const WorkspaceOverviewSchema = z.object({
  ok: z.literal(true),
  tenantId: z.string(),
  tenantName: z.string(),
  planTier: TenantPlanTierSchema,
  suspended: z.boolean(),
  archived: z.boolean(),
  lifecycleStage: z.enum([
    "invited",
    "onboarded",
    "activated",
    "retained",
    "advanced_runtime",
    "enterprise_candidate",
    "churn_risk",
  ]),
  entitlements: PlanEntitlementsSchema,
  activation: TenantActivationSnapshotSchema,
  recommendedNextSteps: z.array(z.string()),
  onboardingCompletedAt: z.string().nullable().optional(),
  onboardingSteps: z
    .object({
      assistantCreated: z.boolean().optional(),
      openAiConfigured: z.boolean().optional(),
      knowledgeUploaded: z.boolean().optional(),
      firstChatSuccess: z.boolean().optional(),
      runtimeOpened: z.boolean().optional(),
      onboardingCompleted: z.boolean().optional(),
    })
    .optional(),
});

export const WorkspaceSupportDiagnosticsSchema = z.object({
  ok: z.literal(true),
  tenantId: z.string(),
  planTier: TenantPlanTierSchema,
  integrations: z.object({
    openAiConfigured: z.boolean(),
    openAiOwnerUserId: z.string().nullable(),
  }),
  runtime: z.object({
    enabled: z.boolean(),
    executionsTotal: z.number().int().nonnegative(),
    executionsLast24h: z.number().int().nonnegative(),
  }),
  hints: z.array(z.string()),
  exportBundle: z.object({
    generatedAt: z.string(),
    tenantId: z.string(),
    planTier: TenantPlanTierSchema,
  }),
});

export const IntegrationOpenAiStatusSchema = z.object({
  ok: z.literal(true),
  configured: z.boolean(),
  maskedKey: z.string().nullable(),
});

export type TenantPlanTier = z.infer<typeof TenantPlanTierSchema>;
export type PlanEntitlements = z.infer<typeof PlanEntitlementsSchema>;
export type UsageQuotaItem = z.infer<typeof UsageQuotaItemSchema>;
