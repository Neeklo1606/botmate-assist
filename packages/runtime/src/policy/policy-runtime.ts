import type { PolicyEvaluationResult } from "@botmate/shared";
import { evaluatePolicy } from "./evaluate-policy.js";
import type { EvaluatePolicyInput } from "./policy-types.js";

function readPolicyRuntimeDisabled(): boolean {
  const v = process.env.BOTMATE_POLICY_RUNTIME?.trim().toLowerCase();
  return v === "disabled";
}

function readStrictUnknownDomains(): boolean {
  return process.env.BOTMATE_POLICY_STRICT_DOMAINS?.trim() === "true";
}

function readRequireJobPolicyContext(): boolean {
  return process.env.BOTMATE_POLICY_REQUIRE_JOB_CONTEXT?.trim() === "true";
}

/** Node entry — attaches deployment flags from env (differs across replicas; decisions stable given same flags). */
export function evaluatePolicyWithRuntimeEnv(input: Omit<EvaluatePolicyInput, "flags">): PolicyEvaluationResult {
  const started = Date.now();
  const result = evaluatePolicy({
    ...input,
    flags: {
      policyRuntimeDisabled: readPolicyRuntimeDisabled(),
      strictUnknownDomains: readStrictUnknownDomains(),
      requireJobPolicyContext: readRequireJobPolicyContext(),
    },
  });
  const evaluationMs = Math.max(0, Date.now() - started);
  return {
    ...result,
    evaluationMs,
  };
}
