import { z } from "zod";

export const ExecutionGraphProjectionSchema = z.literal("tenant_execution_graph_v1");

export const ExecutionGraphNodeKindSchema = z.enum([
  "assistant",
  "tools",
  "browser",
  "queue",
  "notifications",
  "policy",
  "replay",
]);

export type ExecutionGraphNodeKind = z.infer<typeof ExecutionGraphNodeKindSchema>;

export const ExecutionGraphEdgeKindSchema = z.enum([
  "invokes",
  "emits",
  "derived_from",
  "blocked_by",
  "replay_of",
]);

export type ExecutionGraphEdgeKind = z.infer<typeof ExecutionGraphEdgeKindSchema>;

export const ExecutionGraphNodeSchema = z.object({
  id: z.string(),
  kind: ExecutionGraphNodeKindSchema,
  lane: z.string(),
  label: z.string(),
  refId: z.string().nullable(),
  summary: z.string(),
});

export const ExecutionGraphEdgeSchema = z.object({
  id: z.string(),
  kind: ExecutionGraphEdgeKindSchema,
  fromId: z.string(),
  toId: z.string(),
  label: z.string(),
});

export const ExecutionGraphResponseSchema = z.object({
  ok: z.literal(true),
  projection: ExecutionGraphProjectionSchema,
  executionId: z.string(),
  traceId: z.string(),
  nodes: z.array(ExecutionGraphNodeSchema),
  edges: z.array(ExecutionGraphEdgeSchema),
});

export type ExecutionGraphResponse = z.infer<typeof ExecutionGraphResponseSchema>;
