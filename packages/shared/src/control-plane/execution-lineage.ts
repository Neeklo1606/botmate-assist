import { z } from "zod";

/**
 * Optional BullMQ attachment — additive migration (`EXECUTION_LINEAGE_ARCHITECTURE.md`).
 * Top-level `traceId` / `correlationId` on some payloads remain authoritative fallbacks at dequeue.
 */
export const ExecutionLineageAttachmentSchema = z.object({
  correlationId: z.string().min(1).max(512).optional(),
  traceId: z.string().min(1).max(512).optional(),
  executionId: z.string().min(1).max(512).optional(),
  causationId: z.string().min(1).max(512).optional(),
  replayOriginExecutionId: z.string().min(1).max(512).optional(),
  actorId: z.string().min(1).max(512).optional(),
});

export type ExecutionLineageAttachment = z.infer<typeof ExecutionLineageAttachmentSchema>;
