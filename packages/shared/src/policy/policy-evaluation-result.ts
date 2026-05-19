import { z } from "zod";
import { PolicyDecisionSchema } from "./policy-decision.js";
import { PolicyReasonCodeSchema } from "./policy-reason-codes.js";

export const PolicyEvaluationResultSchema = z.object({
  decision: PolicyDecisionSchema,
  primaryReason: PolicyReasonCodeSchema,
  secondaryReasons: z.array(PolicyReasonCodeSchema).optional(),
  snapshotId: z.string().min(1),
  snapshotHash: z.string().min(1),
  evaluationMs: z.number().nonnegative(),
  /** Deterministic id — hash of canonical inputs (`POLICY_EVALUATOR.md`). */
  policyDecisionId: z.string().min(16),
});

export type PolicyEvaluationResult = z.infer<typeof PolicyEvaluationResultSchema>;
