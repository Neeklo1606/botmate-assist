import { z } from "zod";

/**
 * Immutable effective snapshot — referenced by queue `policyContext` + evaluator.
 * `domains` is intentionally open; compilers may narrow per subsystem keys (`runtime`, `browser`, …).
 */
export const EffectivePolicySnapshotSchema = z.object({
  snapshotId: z.string().min(1),
  snapshotHash: z.string().min(8),
  policyEngineVersion: z.string().min(1),
  compiledAtIso: z.string().min(1),
  freezeGeneration: z.number().int().nonnegative(),
  domains: z.record(z.string(), z.unknown()),
});

export type EffectivePolicySnapshot = z.infer<typeof EffectivePolicySnapshotSchema>;
