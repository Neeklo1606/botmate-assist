import { bumpRepairTenantScopeViolation } from "./repair-governance-metrics.js";

/**
 * Defence-in-depth when a scoped cleanup job carries `tenantId` — every row mutated must belong to that tenant.
 * Global/system jobs omit scope (`undefined`/`null`) and skip enforcement here.
 */
export function assertRepairRowTenantScoped(
  jobTenantScope: string | undefined | null,
  rowTenantId: string,
  surface: string,
): void {
  if (!jobTenantScope) return;
  if (jobTenantScope !== rowTenantId) {
    bumpRepairTenantScopeViolation();
    throw new Error(`repair_tenant_isolation:${surface}`);
  }
}
