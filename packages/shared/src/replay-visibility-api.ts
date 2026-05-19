import { z } from "zod";

export const ReplayVisibilityMatrixProjectionSchema = z.literal("tenant_replay_visibility_v1");

export const ReplayVisibilityTierSchema = z.enum(["visible", "restricted", "forbidden", "dangerous"]);

export type ReplayVisibilityTier = z.infer<typeof ReplayVisibilityTierSchema>;

export const ReplayVisibilityMatrixSchema = z.object({
  ok: z.literal(true),
  projection: ReplayVisibilityMatrixProjectionSchema,
  executionId: z.string(),
  traceId: z.string(),
  replayLikely: z.boolean(),
  tier: ReplayVisibilityTierSchema,
  reasons: z.array(z.string()),
});

export type ReplayVisibilityMatrix = z.infer<typeof ReplayVisibilityMatrixSchema>;
