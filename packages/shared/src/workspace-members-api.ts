import { z } from "zod";
import { RoleSchema } from "./auth.js";
import { TenantPlanTierSchema } from "./workspace-saas-api.js";

export const InvitableRoleSchema = z.enum(["ADMIN", "OPERATOR", "VIEWER"]);

export const WorkspaceInviteCreateBodySchema = z.object({
  email: z.string().email(),
  role: InvitableRoleSchema,
});

export const WorkspaceInviteRowSchema = z.object({
  id: z.string(),
  email: z.string().email(),
  role: RoleSchema,
  status: z.enum(["pending", "accepted", "revoked", "expired"]),
  expiresAt: z.string(),
  createdAt: z.string(),
  inviteUrl: z.string().optional(),
});

export const WorkspaceInvitesResponseSchema = z.object({
  ok: z.literal(true),
  items: z.array(WorkspaceInviteRowSchema),
});

export const WorkspaceInviteCreateResponseSchema = z.object({
  ok: z.literal(true),
  invite: WorkspaceInviteRowSchema,
  emailPreview: z
    .object({
      subject: z.string(),
      body: z.string(),
    })
    .optional(),
});

export const AcceptInviteRequestSchema = z.object({
  token: z.string().min(16).max(256),
  password: z.string().min(8).max(128),
  fullName: z.string().min(1).max(120),
});

export const AcceptInviteResponseSchema = z.object({
  ok: z.literal(true),
  user: z.object({
    id: z.string(),
    tenantId: z.string(),
    email: z.string().email(),
    fullName: z.string(),
    role: RoleSchema,
  }),
  token: z.string().optional(),
});

export const WorkspaceMemberPatchBodySchema = z.object({
  role: InvitableRoleSchema,
});

export const WorkspaceOnboardingStateSchema = z.object({
  ok: z.literal(true),
  lifecycleStage: z.enum([
    "invited",
    "onboarded",
    "activated",
    "retained",
    "advanced_runtime",
    "enterprise_candidate",
    "churn_risk",
  ]),
  onboardingCompletedAt: z.string().nullable(),
  onboardingSteps: z.object({
    assistantCreated: z.boolean().optional(),
    openAiConfigured: z.boolean().optional(),
    knowledgeUploaded: z.boolean().optional(),
    firstChatSuccess: z.boolean().optional(),
    runtimeOpened: z.boolean().optional(),
    onboardingCompleted: z.boolean().optional(),
  }),
  recommendedActions: z.array(z.string()),
});

export type WorkspaceInviteCreateBody = z.infer<typeof WorkspaceInviteCreateBodySchema>;
export type AcceptInviteRequest = z.infer<typeof AcceptInviteRequestSchema>;
export type WorkspaceOnboardingState = z.infer<typeof WorkspaceOnboardingStateSchema>;

export const PlanLimitErrorBodySchema = z.object({
  error: z.object({
    code: z.string(),
    message: z.string(),
    trace_id: z.string().optional(),
    planTier: TenantPlanTierSchema.optional(),
    upgradeTier: TenantPlanTierSchema.nullable().optional(),
    limitKey: z.string().optional(),
  }),
});

export const WorkspaceSupportDiagnosticsV2Schema = z.object({
  ok: z.literal(true),
  tenantId: z.string(),
  planTier: TenantPlanTierSchema,
  integrations: z.object({
    openAiConfigured: z.boolean(),
    openAiOwnerUserId: z.string().nullable(),
    openAiReachable: z.boolean().nullable(),
  }),
  runtime: z.object({
    enabled: z.boolean(),
    executionsTotal: z.number().int().nonnegative(),
    executionsLast24h: z.number().int().nonnegative(),
  }),
  worker: z.object({
    redisConfigured: z.boolean(),
    queuesAvailable: z.boolean(),
    assistantRunEnqueueEnabled: z.boolean(),
  }),
  hints: z.array(z.string()),
  recoveryActions: z.array(
    z.object({
      label: z.string(),
      href: z.string(),
    }),
  ),
  exportBundle: z.object({
    generatedAt: z.string(),
    tenantId: z.string(),
    planTier: TenantPlanTierSchema,
  }),
});
