import { z } from "zod";

/** Minimal propagation unit — enqueue + dequeue parity (`POLICY_PROPAGATION_IMPLEMENTATION.md`). */
export const PolicyJobContextSchema = z.object({
  snapshotId: z.string().min(1),
  snapshotHash: z.string().min(8),
  freezeGeneration: z.number().int().nonnegative(),
});

export type PolicyJobContext = z.infer<typeof PolicyJobContextSchema>;
