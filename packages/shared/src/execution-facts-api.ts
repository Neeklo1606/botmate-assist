import { z } from "zod";

export const ExecutionFactsQuerySchema = z.object({
  page: z.coerce.number().int().min(1).max(10_000).default(1),
  pageSize: z.coerce.number().int().min(1).max(80).default(40),
});

export type ExecutionFactsQuery = z.infer<typeof ExecutionFactsQuerySchema>;

export const ExecutionFactRowSchema = z.object({
  id: z.string(),
  dedupeKey: z.string(),
  lane: z.string(),
  type: z.string(),
  status: z.string(),
  severity: z.string(),
  ts: z.string(),
  summary: z.string(),
  sourceTable: z.string(),
  sourceId: z.string(),
  policyReasonCode: z.string().nullable(),
  governanceReasonCode: z.string().nullable(),
  replayRelated: z.boolean(),
  provisional: z.boolean(),
});

export const ExecutionFactsResponseSchema = z.object({
  ok: z.literal(true),
  projection: z.literal("tenant_execution_facts_v1"),
  executionId: z.string(),
  traceId: z.string(),
  items: z.array(ExecutionFactRowSchema),
  page: z.number(),
  pageSize: z.number(),
  total: z.number(),
});

export type ExecutionFactsResponse = z.infer<typeof ExecutionFactsResponseSchema>;
