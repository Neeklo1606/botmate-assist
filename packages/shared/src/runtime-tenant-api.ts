import { z } from "zod";
import { ExecutionGovernanceVisibilitySchema, GovernanceOverlayKindWireSchema } from "./governance-visibility-dto.js";

/** Pagination for tenant runtime read APIs — deterministic bounds. */
export const RuntimePaginationQuerySchema = z.object({
  page: z.coerce.number().int().min(1).max(10_000).default(1),
  pageSize: z.coerce.number().int().min(1).max(50).default(20),
});

export type RuntimePaginationQuery = z.infer<typeof RuntimePaginationQuerySchema>;

export const RuntimeExecutionsQuerySchema = RuntimePaginationQuerySchema.extend({
  assistantId: z.string().trim().min(1).optional(),
});

export type RuntimeExecutionsQuery = z.infer<typeof RuntimeExecutionsQuerySchema>;

export const RuntimeBrowserSessionsQuerySchema = RuntimePaginationQuerySchema;

export const RuntimeNotificationsQuerySchema = RuntimePaginationQuerySchema;

export const RuntimePolicyEventsQuerySchema = RuntimePaginationQuerySchema;

export const RuntimeExecutionSurfaceSchema = z.enum(["assistant", "browser", "mixed"]);

export const RuntimeExecutionStatusSchema = z.enum(["succeeded", "failed", "running", "unknown"]);

export const RuntimeExecutionPolicyDecisionSchema = z.enum(["ALLOW", "WARN", "DENY", "UNKNOWN"]);

export const RuntimeExecutionRowSchema = z.object({
  executionId: z.string(),
  usageRowId: z.string(),
  assistantId: z.string().nullable(),
  assistantName: z.string().nullable(),
  sessionId: z.string().nullable(),
  surface: RuntimeExecutionSurfaceSchema,
  status: RuntimeExecutionStatusSchema,
  startedAt: z.string(),
  durationMs: z.number(),
  policyDecision: RuntimeExecutionPolicyDecisionSchema.optional(),
  policyDecisionId: z.string().nullable(),
  browserLinked: z.boolean(),
  replayLikely: z.boolean(),
  /** Phase 11C — marks-only dominant overlay for list rows (detail has full `governanceVisibility`). */
  dominantOverlay: GovernanceOverlayKindWireSchema.nullable().optional(),
});

export const RuntimeExecutionsResponseSchema = z.object({
  ok: z.literal(true),
  items: z.array(RuntimeExecutionRowSchema),
  page: z.number(),
  pageSize: z.number(),
  total: z.number(),
});

export const RuntimeBrowserRunSummarySchema = z.object({
  id: z.string(),
  status: z.string(),
  traceId: z.string(),
  browserSessionId: z.string(),
  startedAt: z.string().nullable(),
  finishedAt: z.string().nullable(),
});

export const RuntimeExecutionDetailSchema = z.object({
  ok: z.literal(true),
  execution: RuntimeExecutionRowSchema,
  usageMetadata: z.record(z.string(), z.unknown()).nullable(),
  browserRuns: z.array(RuntimeBrowserRunSummarySchema),
  governanceVisibility: ExecutionGovernanceVisibilitySchema,
});

export const RuntimeBrowserSessionRowSchema = z.object({
  id: z.string(),
  status: z.string(),
  assistantId: z.string().nullable(),
  chatSessionId: z.string().nullable(),
  operatorMode: z.string(),
  lastUrl: z.string().nullable(),
  activeRuns: z.number(),
  createdAt: z.string(),
  updatedAt: z.string(),
});

export const RuntimeBrowserSessionsResponseSchema = z.object({
  ok: z.literal(true),
  items: z.array(RuntimeBrowserSessionRowSchema),
  page: z.number(),
  pageSize: z.number(),
  total: z.number(),
});

export const RuntimeNotificationRowSchema = z.object({
  id: z.string(),
  kind: z.string(),
  title: z.string(),
  deliveryState: z.string(),
  readAt: z.string().nullable(),
  correlationId: z.string().nullable(),
  traceId: z.string().nullable(),
  executionId: z.string().nullable(),
  createdAt: z.string(),
});

export const RuntimeNotificationsResponseSchema = z.object({
  ok: z.literal(true),
  items: z.array(RuntimeNotificationRowSchema),
  page: z.number(),
  pageSize: z.number(),
  total: z.number(),
});

export const RuntimePolicyEventSeveritySchema = z.enum(["info", "warn", "critical"]);

export const RuntimePolicyEventRowSchema = z.object({
  id: z.string(),
  occurredAt: z.string(),
  severity: RuntimePolicyEventSeveritySchema,
  code: z.string(),
  message: z.string(),
  traceId: z.string().nullable(),
  sessionId: z.string().nullable(),
  surface: z.string(),
});

export const RuntimePolicyProjectionSchema = z.enum(["tenant_db_v1", "tenant_db_v2_persisted"]);

export const RuntimePolicyEventsResponseSchema = z.object({
  ok: z.literal(true),
  projection: RuntimePolicyProjectionSchema,
  items: z.array(RuntimePolicyEventRowSchema),
  page: z.number(),
  pageSize: z.number(),
  total: z.number(),
});

export const RuntimeOverviewResponseSchema = z.object({
  ok: z.literal(true),
  counts: z.object({
    aiUsagesLast24h: z.number(),
    browserRunsQueued: z.number(),
    browserRunsRunning: z.number(),
    browserSessionsNonTerminated: z.number(),
    notificationsPendingAttention: z.number(),
    stuckToolInvocations: z.number(),
    stuckBrowserRuns: z.number(),
    toolInvocationsInFlight: z.number(),
  }),
  telemetry: z.object({
    queueBacklogTenantScoped: z.literal(false),
    processWideCountersExcluded: z.literal(true),
    realtimeConnectedHint: z.literal("client_ws_only"),
  }),
});

export type RuntimeOverviewResponse = z.infer<typeof RuntimeOverviewResponseSchema>;
export type RuntimeExecutionRow = z.infer<typeof RuntimeExecutionRowSchema>;
export type RuntimeExecutionDetailResponse = z.infer<typeof RuntimeExecutionDetailSchema>;
export type RuntimeExecutionsApiResponse = z.infer<typeof RuntimeExecutionsResponseSchema>;
export type RuntimeBrowserSessionsApiResponse = z.infer<typeof RuntimeBrowserSessionsResponseSchema>;
export type RuntimeNotificationsApiResponse = z.infer<typeof RuntimeNotificationsResponseSchema>;
export type RuntimePolicyEventsApiResponse = z.infer<typeof RuntimePolicyEventsResponseSchema>;
