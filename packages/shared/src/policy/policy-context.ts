import { z } from "zod";
import { PolicyJobContextSchema } from "./policy-job-context.js";

export const PolicyActorTypeSchema = z.enum([
  "user",
  "assistant",
  "operator",
  "system",
  "integration",
  "unknown",
]);

export type PolicyActorType = z.infer<typeof PolicyActorTypeSchema>;

/** Inputs to deterministic evaluation — optional fields preserve backward compatibility at call sites. */
export const PolicyEvaluationContextSchema = z.object({
  tenantId: z.string().min(1),
  actorId: z.string().min(1).optional(),
  actorType: PolicyActorTypeSchema.optional(),
  executionId: z.string().min(1).optional(),
  sessionId: z.string().min(1).optional(),
  assistantId: z.string().min(1).optional(),
  operatorId: z.string().min(1).optional(),
  impersonationSessionId: z.string().min(1).optional(),
  delegationGrantId: z.string().min(1).optional(),
  /** When present, evaluator validates parity with `EffectivePolicySnapshot` (staleness gate). */
  policyJobContext: PolicyJobContextSchema.optional(),
  /** Replay governance propagation — contracts only until replay executor lands (`REPLAY_POLICY_MODEL.md`). */
  replayMode: z.enum(["observe", "mutate", "unknown"]).optional(),
  replayReason: z.string().max(512).optional(),
  replayOriginExecutionId: z.string().min(1).optional(),
});

export type PolicyEvaluationContext = z.infer<typeof PolicyEvaluationContextSchema>;
