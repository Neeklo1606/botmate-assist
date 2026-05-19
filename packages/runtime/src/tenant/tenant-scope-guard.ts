/**
 * Phase 11E — bounded tenant scope assertions for runtime reads (defense in depth).
 */
import { bumpTenantScopeAssertionFailure } from "../enterprise/enterprise-ops-metrics.js";

export class TenantScopeViolationError extends Error {
  readonly code = "TENANT_SCOPE_VIOLATION";

  constructor(message: string) {
    super(message);
    this.name = "TenantScopeViolationError";
  }
}

/** Returns false and bumps metric when `rowTenantId !== expectedTenantId`. */
export function assertTenantScopeMatch(input: {
  expectedTenantId: string;
  rowTenantId: string | null | undefined;
  resource: string;
}): boolean {
  const row = input.rowTenantId?.trim();
  if (!row || row === input.expectedTenantId) return true;
  bumpTenantScopeAssertionFailure(input.resource);
  return false;
}

/** Strict variant — throws for API handlers that must fail closed in strict mode. */
export function assertTenantScopeOrThrow(input: {
  expectedTenantId: string;
  rowTenantId: string | null | undefined;
  resource: string;
}): void {
  if (!assertTenantScopeMatch(input)) {
    throw new TenantScopeViolationError(
      `Tenant scope mismatch on ${input.resource}: expected ${input.expectedTenantId}`,
    );
  }
}
