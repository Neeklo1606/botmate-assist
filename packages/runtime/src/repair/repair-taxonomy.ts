/**
 * Phase 10C — repair taxonomy skeleton (architecture).
 * Stable string literals only; BullMQ queues are NOT added until product approves wiring.
 */

export const RUNTIME_REPAIR_TAXONOMY = [
  "runtime.repair.cleanup",
  "runtime.repair.reconcile",
  "runtime.repair.stale",
  "runtime.repair.orphan",
  "runtime.repair.requeue",
] as const;

export type RuntimeRepairTaxonomyKind = (typeof RUNTIME_REPAIR_TAXONOMY)[number];

export type RepairClassificationTier =
  | "SAFE_AUTOMATIC"
  | "SAFE_SCOPED"
  | "MANUAL_REVIEW"
  | "NEVER_AUTOMATIC";
