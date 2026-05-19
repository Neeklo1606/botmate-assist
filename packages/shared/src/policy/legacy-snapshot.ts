import { EffectivePolicySnapshotSchema, type EffectivePolicySnapshot } from "./effective-policy.js";

const LEGACY_HASH =
  "phase8d0000000000000000000000000000000000000000000000000000000000" as const;

/**
 * Permissive Phase 8D placeholder — real tenants should compile snapshots from policy packs.
 * Hash is stable and long enough for `EffectivePolicySnapshotSchema` + strict transport checks.
 */
export function createPhase8dLegacyEffectivePolicySnapshot(
  overrides?: Partial<Pick<EffectivePolicySnapshot, "snapshotId" | "freezeGeneration" | "domains">>,
): EffectivePolicySnapshot {
  return EffectivePolicySnapshotSchema.parse({
    snapshotId: overrides?.snapshotId ?? "phase8d-legacy-snapshot-v1",
    snapshotHash: LEGACY_HASH,
    policyEngineVersion: "8d.0.0",
    compiledAtIso: new Date(0).toISOString(),
    freezeGeneration: overrides?.freezeGeneration ?? 0,
    domains: overrides?.domains ?? {},
  });
}
