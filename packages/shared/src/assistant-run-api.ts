import { z } from "zod";

/** Internal-only bounded activation — POST when `BOTMATE_ASSISTANT_RUN_ENQUEUE_ENABLED=true`. */
export const AssistantRunEnqueueBodySchema = z.object({
  assistantId: z.string().min(1),
  sessionId: z.string().min(1),
  /** Optional seed — worker uses this as `traceId` / `executionId` when provided. */
  correlationId: z.string().min(1).max(128).optional(),
  prompt: z.string().max(32_000).optional(),
});

export const AssistantRunEnqueueResponseSchema = z.object({
  ok: z.literal(true),
  enqueued: z.boolean(),
  traceId: z.string(),
  jobId: z.string().optional(),
  reason: z.enum(["SESSION_LOCK", "SESSION_STREAMING_ACTIVE"]).optional(),
});

export type AssistantRunEnqueueBody = z.infer<typeof AssistantRunEnqueueBodySchema>;
export type AssistantRunEnqueueResponse = z.infer<typeof AssistantRunEnqueueResponseSchema>;
