import { z } from "zod";

/** Canonical product event names — extend here; server validates allowlist subset. */
export const PRODUCT_EVENT_NAMES = [
  "activation.first_assistant_created",
  "activation.first_knowledge_uploaded",
  "activation.first_chat_success",
  "activation.first_execution_recorded",
  "activation.runtime_opened",
  "activation.runtime_workspace_opened",
  "activation.compare_opened",
  "activation.incidents_opened",
  "activation.graph_opened",
  "activation.browser_run_started",
  "activation.replay_matrix_opened",
  "activation.operator_opened",
  "support.ws_reconnect",
  "support.runtime_api_error",
  "feedback.submitted",
] as const;

export type ProductEventName = (typeof PRODUCT_EVENT_NAMES)[number];

export const ProductEventBodySchema = z.object({
  name: z.enum(PRODUCT_EVENT_NAMES),
  dedupeKey: z.string().min(1).max(128).optional(),
  route: z.string().max(512).optional(),
  props: z.record(z.union([z.string(), z.number(), z.boolean()])).optional(),
});

export const ProductEventResponseSchema = z.object({
  ok: z.literal(true),
  recorded: z.boolean(),
  deduped: z.boolean().optional(),
});

export const ProductFeedbackBodySchema = z.object({
  category: z.enum([
    "onboarding",
    "runtime",
    "browser",
    "operator",
    "compare",
    "general",
  ]),
  message: z.string().min(3).max(4000),
  route: z.string().max(512).optional(),
});

export const ProductFeedbackResponseSchema = z.object({
  ok: z.literal(true),
  id: z.string(),
});

export const TenantActivationHealthSchema = z.enum([
  "healthy",
  "activating",
  "stuck",
  "inactive",
  "at_risk",
]);

export const TenantActivationSnapshotSchema = z.object({
  ok: z.literal(true),
  tenantId: z.string(),
  health: TenantActivationHealthSchema,
  derived: z.object({
    assistantsCount: z.number().int().nonnegative(),
    activeAssistantsCount: z.number().int().nonnegative(),
    knowledgeDocumentsCount: z.number().int().nonnegative(),
    chatSessionsCount: z.number().int().nonnegative(),
    assistantMessagesCount: z.number().int().nonnegative(),
    executionsCount: z.number().int().nonnegative(),
    browserRunsCount: z.number().int().nonnegative(),
    incidentAcksCount: z.number().int().nonnegative(),
    returningUsers7d: z.number().int().nonnegative(),
  }),
  milestones: z.object({
    firstAssistantCreated: z.boolean(),
    firstKnowledgeUploaded: z.boolean(),
    firstChatSuccess: z.boolean(),
    firstExecutionRecorded: z.boolean(),
    runtimeOpened: z.boolean(),
    compareOpened: z.boolean(),
    incidentsViewed: z.boolean(),
    browserRunStarted: z.boolean(),
  }),
  productEventsLast7d: z.record(z.number().int().nonnegative()),
  hints: z.array(z.string()),
});

export type TenantActivationSnapshot = z.infer<typeof TenantActivationSnapshotSchema>;
export type ProductEventBody = z.infer<typeof ProductEventBodySchema>;
export type ProductFeedbackBody = z.infer<typeof ProductFeedbackBodySchema>;

export const FleetProductAnalyticsSnapshotSchema = z.object({
  ok: z.literal(true),
  windowDays: z.number().int().positive(),
  tenantsTotal: z.number().int().nonnegative(),
  tenantsWithAssistants: z.number().int().nonnegative(),
  tenantsWithKnowledge: z.number().int().nonnegative(),
  tenantsWithChat: z.number().int().nonnegative(),
  tenantsWithExecutions: z.number().int().nonnegative(),
  tenantsRuntimeOpened7d: z.number().int().nonnegative(),
  tenantsCompareOpened7d: z.number().int().nonnegative(),
  tenantsIncidentsOpened7d: z.number().int().nonnegative(),
  tenantsBrowserRuns7d: z.number().int().nonnegative(),
  supportMetrics: z.record(z.unknown()),
});
