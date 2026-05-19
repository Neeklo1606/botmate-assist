/** Phase 10D — execution safety counters merged into `runtimeMetricsSnapshot`. */

let reconcileEnqueueCooldownSuppressions = 0;

export function bumpReconcileEnqueueCooldownSuppressed(): void {
  reconcileEnqueueCooldownSuppressions += 1;
}

export function executionSafetyMetricsPartial(): {
  reconcileEnqueueCooldownSuppressions: number;
} {
  return { reconcileEnqueueCooldownSuppressions };
}
