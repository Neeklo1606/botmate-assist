import { z } from "zod";

export const RuntimeConsistencyProjectionSchema = z.literal("tenant_runtime_consistency_v1");

export const RuntimeConsistencyIssueSchema = z.object({
  code: z.string(),
  severity: z.enum(["info", "warn", "critical"]),
  count: z.number(),
  sampleIds: z.array(z.string()),
  hint: z.string(),
});

export const RuntimeConsistencyReportSchema = z.object({
  ok: z.literal(true),
  projection: RuntimeConsistencyProjectionSchema,
  generatedAt: z.string(),
  issues: z.array(RuntimeConsistencyIssueSchema),
});

export type RuntimeConsistencyReport = z.infer<typeof RuntimeConsistencyReportSchema>;
