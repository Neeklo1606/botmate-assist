/** Counters for repair governance / isolation — in-process gauges (mirror `runtime-metrics.ts` primitives). */

let repairTenantScopeViolations = 0;

export function bumpRepairTenantScopeViolation(): void {
  repairTenantScopeViolations += 1;
}

export function repairGovernanceMetricsPartial(): {
  repairTenantScopeViolations: number;
} {
  return { repairTenantScopeViolations };
}
