import type {
  EffectivePolicySnapshot,
  PolicyActionDescriptor,
  PolicyEvaluationContext,
} from "@botmate/shared";

export type { PolicyEvaluationResult, PolicyDecision, PolicyReasonCode } from "@botmate/shared";

/** Pure evaluation input — flags are explicit to keep `evaluatePolicy` testable/deterministic per flag set. */
export interface EvaluatePolicyInput {
  snapshot: EffectivePolicySnapshot;
  context: PolicyEvaluationContext;
  actionDescriptor: PolicyActionDescriptor;
  flags?: EvaluatePolicyFlags;
}

export interface EvaluatePolicyFlags {
  /** Platform killswitch — all decisions become `HARD_DENY` + `POLICY_RUNTIME_DISABLED`. */
  policyRuntimeDisabled?: boolean;
  /**
   * When true and `snapshot.domains` is empty, risky action kinds deny with `UNKNOWN_POLICY`.
   * Default false preserves backward compatibility for legacy queues without compiled rules.
   */
  strictUnknownDomains?: boolean;
  /**
   * When true (`BOTMATE_POLICY_REQUIRE_JOB_CONTEXT=true`), tenant-facing async queues without
   * `policyJobContext` fail closed with **`POLICY_CONTEXT_MISSING`** (hygiene queues exempt).
   */
  requireJobPolicyContext?: boolean;
}
