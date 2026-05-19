import { z } from "zod";

/** Timeline pagination — bounded chunks for virtualization-friendly UI. */
export const ExecutionTimelineQuerySchema = z.object({
  limit: z.coerce.number().int().min(1).max(80).default(40),
  cursor: z.string().trim().min(1).optional(),
});

export type ExecutionTimelineQuery = z.infer<typeof ExecutionTimelineQuerySchema>;

export const ExecutionTimelineLaneSchema = z.enum([
  "assistant",
  "tools",
  "browser",
  "notifications",
  "policy",
  "governance",
  "replay",
  "queue",
]);

export type ExecutionTimelineLane = z.infer<typeof ExecutionTimelineLaneSchema>;

export const ExecutionTimelineEventSeveritySchema = z.enum(["info", "warn", "critical", "neutral"]);

export const ExecutionTimelineEventSchema = z.object({
  id: z.string(),
  ts: z.string(),
  lane: ExecutionTimelineLaneSchema,
  type: z.string(),
  status: z.string(),
  title: z.string(),
  summary: z.string(),
  severity: ExecutionTimelineEventSeveritySchema,
  executionId: z.string(),
  traceId: z.string(),
  assistantId: z.string().nullable(),
  toolInvocationId: z.string().nullable().optional(),
  browserRunId: z.string().nullable().optional(),
  notificationId: z.string().nullable().optional(),
  policyReasonCode: z.string().nullable().optional(),
  governanceReasonCode: z.string().nullable().optional(),
  replayRelated: z.boolean().optional(),
  /** Stable durable dedupe key — aligns with ExecutionFact.dedupeKey (Phase 9D). */
  dedupeKey: z.string().optional(),
  /** Client-side realtime overlay — discarded when durable rows reconcile (Phase 9D). */
  wsEphemeral: z.boolean().optional(),
  metadata: z.record(z.string(), z.unknown()),
});

export type ExecutionTimelineEvent = z.infer<typeof ExecutionTimelineEventSchema>;

export const ExecutionTimelineResponseSchema = z.object({
  ok: z.literal(true),
  projection: z.literal("tenant_timeline_v1"),
  executionId: z.string(),
  traceId: z.string(),
  items: z.array(ExecutionTimelineEventSchema),
  nextCursor: z.string().nullable(),
  pageSize: z.number(),
  truncated: z.boolean(),
});

export type ExecutionTimelineResponse = z.infer<typeof ExecutionTimelineResponseSchema>;

export const RuntimeQueuesResponseSchema = z.object({
  ok: z.literal(true),
  projection: z.literal("tenant_queue_approx_v1"),
  buckets: z.object({
    assistant: z.object({
      approximatePendingToolInvocations: z.number(),
      approximateAiUsagesWithQueueWait: z.number(),
    }),
    browser: z.object({
      queuedRuns: z.number(),
      runningRuns: z.number(),
    }),
    notifications: z.object({
      pendingDeliveryTenantWide: z.number(),
      queuedDeliveryTenantWide: z.number(),
    }),
    knowledge: z.object({
      documentsPending: z.number(),
      documentsProcessing: z.number(),
      documentsFailed: z.number(),
    }),
  }),
  telemetry: z.object({
    bullMqDepthExcluded: z.literal(true),
    approximateProjection: z.literal(true),
  }),
});

export type RuntimeQueuesResponse = z.infer<typeof RuntimeQueuesResponseSchema>;
