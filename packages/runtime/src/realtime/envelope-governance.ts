import {
  bumpGovernanceRealtimeMismatch,
  bumpPolicyBypassWarning,
  logPolicyStructured,
  type PolicyStructuredLogger,
} from "../policy/policy-metrics.js";
import { bumpRealtimeTenantMismatchBlocked } from "../production/production-metrics.js";
import { shouldBlockRealtimeTenantMismatch } from "../production/production-strict.js";

/** Detect envelope/workspace mismatch before realtime fan-out (`SSE_REALTIME_GOVERNANCE.md`). */
export function observeRealtimeEnvelopeGovernance(input: {
  envelopeTenantId: string;
  publishTenantId: string;
  event: string;
  logger?: PolicyStructuredLogger;
  /** Phase 8H — dimensions for **`governance_observation`** normalization (`EXECUTION_OBSERVABILITY_NORMALIZATION.md`). */
  governanceSurfaceId?: string;
}): { blocked: boolean } {
  if (input.envelopeTenantId.trim() === input.publishTenantId.trim()) {
    return { blocked: false };
  }
  bumpPolicyBypassWarning();
  bumpGovernanceRealtimeMismatch();
  logPolicyStructured(input.logger, "warn", {
    event: "policy_surface_bypass_warn",
    reasonCode: "POLICY_SURFACE_BYPASS",
    governanceReasonCode: "GOVERNANCE_REALTIME_MISMATCH",
    governanceSurfaceId: input.governanceSurfaceId,
    executionSurfaceType: "realtime",
    envelopeTenantId: input.envelopeTenantId,
    publishTenantId: input.publishTenantId,
    realtimeEvent: input.event,
  }, "policy_surface_bypass_warn");
  if (shouldBlockRealtimeTenantMismatch()) {
    bumpRealtimeTenantMismatchBlocked();
    logPolicyStructured(input.logger, "error", {
      event: "realtime_tenant_mismatch_blocked",
      envelopeTenantId: input.envelopeTenantId,
      publishTenantId: input.publishTenantId,
      realtimeEvent: input.event,
    }, "realtime_tenant_mismatch_blocked");
    return { blocked: true };
  }
  return { blocked: false };
}
