import { extractEffectiveExecutionLineage } from "../control-plane/execution-lineage-helpers.js";
import { normalizePolicySnapshot } from "../policy/runtime-policy-bundle.js";

/**
 * Safe additive normalization for transported job / API payloads (`GOVERNANCE_SNAPSHOT_CONSISTENCY.md`).
 * Does not mutate caller-owned objects — returns a shallow-cloned record when lineage/policy normalization applies.
 */
export function normalizeGovernanceSnapshotFields(payload: Record<string, unknown>): Record<string, unknown> {
  const lineage = extractEffectiveExecutionLineage(payload);
  const policyNorm = normalizePolicySnapshot(payload.policyContext);
  const next: Record<string, unknown> = { ...payload, executionLineage: lineage };
  if (policyNorm !== undefined) {
    next.policyContext = policyNorm;
  }
  return next;
}
