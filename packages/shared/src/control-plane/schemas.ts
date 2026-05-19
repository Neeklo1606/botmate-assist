import { z } from "zod";

/** Logical runtime facets surfaced by the Phase 6A control plane registry. */
export const RuntimeSubsystemSchema = z.enum([
  "assistant",
  "browser",
  "tool",
  "realtime",
  "queue",
  "operator",
  "rag",
  "notifications",
]);
export type RuntimeSubsystem = z.infer<typeof RuntimeSubsystemSchema>;

/** Canonical lifecycle projection — adapters map legacy enums/statuses here without rewriting workers. */
export const UnifiedExecutionStateSchema = z.enum([
  "queued",
  "running",
  "streaming",
  "waiting_operator",
  "blocked",
  "completed",
  "failed",
  "cancelled",
  "expired",
]);
export type UnifiedExecutionState = z.infer<typeof UnifiedExecutionStateSchema>;

/** Cross-runtime envelope vocabulary (additive — legacy names remain valid alongside these). */
export const RuntimeLifecycleEventNameSchema = z.enum([
  "runtime.started",
  "runtime.completed",
  "runtime.failed",
  "runtime.blocked",
  "runtime.streaming",
  "runtime.waiting",
]);
export type RuntimeLifecycleEventName = z.infer<typeof RuntimeLifecycleEventNameSchema>;

/**
 * Recommended correlation hierarchy:
 * - `correlationId` — durable business correlation (often assistant/chat correlation seed).
 * - `traceId` — primary tracing root (today aligned with worker/chat tracing helpers).
 * - `executionId` — optional finer-grained unit (tool invocation attempt, browser run id, BullMQ job id).
 */
export const ExecutionIdentitySchema = z.object({
  correlationId: z.string().min(1),
  traceId: z.string().min(1),
  executionId: z.string().min(1).optional(),
  parentExecutionId: z.string().optional(),
  spanId: z.string().optional(),
  rootSpanId: z.string().optional(),
});
export type ExecutionIdentity = z.infer<typeof ExecutionIdentitySchema>;

export const RuntimeHealthStatusSchema = z.enum(["healthy", "degraded", "disabled", "unknown"]);
export type RuntimeHealthStatus = z.infer<typeof RuntimeHealthStatusSchema>;
