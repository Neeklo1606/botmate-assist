import type { RuntimeSubsystem } from "@botmate/shared";
import type { GovernanceGateResult } from "./governance.js";
import { evaluateRuntimeSubsystemGate } from "./governance.js";

/**
 * Extension seam for quotas / budgets — Phase 6A ships governance-only wiring (deterministic, offline).
 */
export function evaluateUnifiedRuntimePolicy(input: {
  tenantId: string;
  subsystem: RuntimeSubsystem;
}): GovernanceGateResult {
  const gate = evaluateRuntimeSubsystemGate(input);
  if (!gate.ok) return gate;

  const quotaMode = process.env.RUNTIME_POLICY_QUOTA_MODE?.trim().toLowerCase();
  if (quotaMode && quotaMode !== "off") {
    void quotaMode;
  }

  return { ok: true };
}
