import { z } from "zod";
import { ExecutionLineageAttachmentSchema, PolicyJobContextSchema } from "@botmate/shared";
import { JOB_NAMES } from "./queue-names.js";

const tenantScoped = z.object({
  tenantId: z.string().min(1),
});

export const KnowledgeProcessPayloadSchema = tenantScoped.extend({
  documentId: z.string().min(1),
  source: z.enum(["upload", "sync", "manual"]).optional(),
  policyContext: PolicyJobContextSchema.optional(),
  executionLineage: ExecutionLineageAttachmentSchema.optional(),
});
export type KnowledgeProcessPayload = z.infer<typeof KnowledgeProcessPayloadSchema>;

export const EmbeddingsGeneratePayloadSchema = tenantScoped.extend({
  /** KnowledgeDocument id — embeds chunks where `embeddedAt` is null. */
  resourceId: z.string().min(1),
  modelHint: z.string().optional(),
  /** Future: incremental modes; today always pending chunks for the document. */
  mode: z.enum(["pending_chunks"]).default("pending_chunks"),
  policyContext: PolicyJobContextSchema.optional(),
  executionLineage: ExecutionLineageAttachmentSchema.optional(),
});
export type EmbeddingsGeneratePayload = z.infer<typeof EmbeddingsGeneratePayloadSchema>;

export const WebhookDeliverPayloadSchema = tenantScoped.extend({
  webhookId: z.string().min(1),
  eventType: z.string().min(1),
  payloadRef: z.string().optional(),
});
export type WebhookDeliverPayload = z.infer<typeof WebhookDeliverPayloadSchema>;

export const AnalyticsRollupPayloadSchema = tenantScoped.extend({
  window: z.enum(["hour", "day"]),
  anchorIso: z.string().min(1),
});
export type AnalyticsRollupPayload = z.infer<typeof AnalyticsRollupPayloadSchema>;

export const NotificationsDispatchPayloadSchema = tenantScoped.extend({
  notificationId: z.string().min(1),
  channels: z.array(z.enum(["ws", "email", "push"])).default(["ws"]),
  /** Phase 8D — optional policy propagation (`POLICY_PROPAGATION_IMPLEMENTATION.md`). */
  policyContext: PolicyJobContextSchema.optional(),
  executionLineage: ExecutionLineageAttachmentSchema.optional(),
});
export type NotificationsDispatchPayload = z.infer<typeof NotificationsDispatchPayloadSchema>;

/** Async assistant execution — Phase 4A worker/runtime boundary (no autonomous agent loops). */
export const AssistantRunPayloadSchema = tenantScoped.extend({
  assistantId: z.string().min(1),
  sessionId: z.string().min(1),
  correlationId: z.string().optional(),
  /** Optional operator/system prompt override — truncated server-side. */
  prompt: z.string().max(32_000).optional(),
  /** Producer timestamp for queue wait measurement (`Date.now()` ISO). */
  queuedAtIso: z.string().optional(),
  policyContext: PolicyJobContextSchema.optional(),
  executionLineage: ExecutionLineageAttachmentSchema.optional(),
});
export type AssistantRunPayload = z.infer<typeof AssistantRunPayloadSchema>;

export const ToolAsyncExecutePayloadSchema = tenantScoped.extend({
  traceId: z.string().min(1),
  assistantId: z.string().optional(),
  sessionId: z.string().optional(),
  correlationId: z.string().optional(),
  method: z.enum(["GET", "POST"]),
  url: z.string().url(),
  headers: z.record(z.string()).optional(),
  body: z.unknown().optional(),
  allowedHosts: z.array(z.string()).max(48).optional(),
  timeoutMs: z.number().int().positive().max(600_000).default(120_000),
  policyContext: PolicyJobContextSchema.optional(),
  executionLineage: ExecutionLineageAttachmentSchema.optional(),
});
export type ToolAsyncExecutePayload = z.infer<typeof ToolAsyncExecutePayloadSchema>;

/** Phase 5C — deterministic Playwright execution (worker-local). */
export const BrowserRunPayloadSchema = tenantScoped.extend({
  browserRunId: z.string().min(1),
  browserSessionId: z.string().min(1),
  traceId: z.string().min(1),
  /** Redis realtime room id (e.g. tenant:x:chat:y) — validated worker-side prefix. */
  redisRoom: z.string().min(1).max(512).optional(),
  policyContext: PolicyJobContextSchema.optional(),
  executionLineage: ExecutionLineageAttachmentSchema.optional(),
});
export type BrowserRunPayload = z.infer<typeof BrowserRunPayloadSchema>;

/** Phase 5D — bounded Playwright snapshot for operator browser feed (no CDP streaming). */
export const BrowserFeedSnapshotPayloadSchema = tenantScoped.extend({
  browserSessionId: z.string().min(1),
  force: z.boolean().optional(),
  policyContext: PolicyJobContextSchema.optional(),
  executionLineage: ExecutionLineageAttachmentSchema.optional(),
});
export type BrowserFeedSnapshotPayload = z.infer<typeof BrowserFeedSnapshotPayloadSchema>;

export const BrowserCleanupPayloadSchema = z.object({
  tenantId: z.string().min(1).optional(),
  mode: z
    .enum(["reclaim_stale_leases", "expire_idle_sessions", "expire_operator_leases"])
    .default("reclaim_stale_leases"),
  limit: z.number().int().positive().max(500).default(50),
  policyContext: PolicyJobContextSchema.optional(),
  executionLineage: ExecutionLineageAttachmentSchema.optional(),
});
export type BrowserCleanupPayload = z.infer<typeof BrowserCleanupPayloadSchema>;

export const ArtifactCleanupPayloadSchema = z.object({
  tenantId: z.string().min(1).optional(),
  limit: z.number().int().positive().max(500).default(100),
  policyContext: PolicyJobContextSchema.optional(),
  executionLineage: ExecutionLineageAttachmentSchema.optional(),
});
export type ArtifactCleanupPayload = z.infer<typeof ArtifactCleanupPayloadSchema>;

/** Phase 9F — bounded reconciliation hints (`RUNTIME_RECONCILIATION.md`). */
export const RuntimeReconcilePayloadSchema = tenantScoped.extend({
  policyContext: PolicyJobContextSchema.optional(),
  executionLineage: ExecutionLineageAttachmentSchema.optional(),
});
export type RuntimeReconcilePayload = z.infer<typeof RuntimeReconcilePayloadSchema>;

export const JOB_SCHEMA_BY_NAME = {
  [JOB_NAMES.KNOWLEDGE_PROCESS]: KnowledgeProcessPayloadSchema,
  [JOB_NAMES.EMBEDDINGS_GENERATE]: EmbeddingsGeneratePayloadSchema,
  [JOB_NAMES.WEBHOOK_DELIVER]: WebhookDeliverPayloadSchema,
  [JOB_NAMES.ANALYTICS_ROLLUP]: AnalyticsRollupPayloadSchema,
  [JOB_NAMES.NOTIFICATIONS_DISPATCH]: NotificationsDispatchPayloadSchema,
  [JOB_NAMES.ASSISTANT_RUN]: AssistantRunPayloadSchema,
  [JOB_NAMES.TOOLS_ASYNC_EXECUTE]: ToolAsyncExecutePayloadSchema,
  [JOB_NAMES.BROWSER_RUN]: BrowserRunPayloadSchema,
  [JOB_NAMES.BROWSER_FEED_SNAPSHOT]: BrowserFeedSnapshotPayloadSchema,
  [JOB_NAMES.BROWSER_CLEANUP]: BrowserCleanupPayloadSchema,
  [JOB_NAMES.ARTIFACT_CLEANUP]: ArtifactCleanupPayloadSchema,
  [JOB_NAMES.RUNTIME_RECONCILE]: RuntimeReconcilePayloadSchema,
} as const;
