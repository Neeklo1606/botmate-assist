import { z } from "zod";

export const PolicyDecisionSchema = z.enum([
  "ALLOW",
  "WARN",
  "SOFT_DENY",
  "HARD_DENY",
  "FREEZE",
  "QUARANTINE",
]);

export type PolicyDecision = z.infer<typeof PolicyDecisionSchema>;
