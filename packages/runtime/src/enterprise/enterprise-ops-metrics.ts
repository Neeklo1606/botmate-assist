/** Phase 11E — enterprise go-live counters merged into `runtimeMetricsSnapshot`. */

let runtimeReconcileJobsCompleted = 0;
let tenantScopeAssertionFailures = 0;
let assistantRunJobsCompleted = 0;
let assistantRunJobsFailed = 0;

export function bumpRuntimeReconcileCompleted(): void {
  runtimeReconcileJobsCompleted += 1;
}

export function bumpTenantScopeAssertionFailure(_resource: string): void {
  tenantScopeAssertionFailures += 1;
}

export function bumpAssistantRunJobCompleted(ok: boolean): void {
  if (ok) assistantRunJobsCompleted += 1;
  else assistantRunJobsFailed += 1;
}

export function enterpriseOpsMetricsPartial(): {
  runtimeReconcileJobsCompleted: number;
  tenantScopeAssertionFailures: number;
  assistantRunJobsCompleted: number;
  assistantRunJobsFailed: number;
} {
  return {
    runtimeReconcileJobsCompleted,
    tenantScopeAssertionFailures,
    assistantRunJobsCompleted,
    assistantRunJobsFailed,
  };
}
