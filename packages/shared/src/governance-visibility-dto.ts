import { z } from "zod";

/** Mirrors `GovernanceOverlayKind` in `@botmate/runtime` — wire contract only. */
export const GovernanceOverlayKindWireSchema = z.enum([
  "HARD_BLOCK",
  "SOFT_BLOCK",
  "DEGRADED",
  "OBSERVE_ONLY",
  "RECOVERING",
  "SUPPRESSED",
  "REPLAY_RESTRICTED",
]);
export type GovernanceOverlayKindWire = z.infer<typeof GovernanceOverlayKindWireSchema>;

export const GovernanceOverlayReasonSourceSchema = z.enum([
  "operational_mark",
  "incident_ack",
  "policy_runtime",
  "replay_matrix",
  "consistency",
  "browser_transport",
  "realtime_hint",
  "queue_pressure",
]);
export type GovernanceOverlayReasonSource = z.infer<typeof GovernanceOverlayReasonSourceSchema>;

export const GovernanceOverlayReasonRowSchema = z.object({
  kind: GovernanceOverlayKindWireSchema,
  code: z.string(),
  source: GovernanceOverlayReasonSourceSchema,
  detail: z.string().optional(),
});

export const GovernanceDegradedSignalWireSchema = z.object({
  code: z.string(),
  source: z.string(),
});

export const ExecutionGovernanceVisibilitySchema = z.object({
  projection: z.literal("execution_governance_visibility_v1"),
  dominantOverlay: GovernanceOverlayKindWireSchema.nullable(),
  overlays: z.array(GovernanceOverlayKindWireSchema),
  reasons: z.array(GovernanceOverlayReasonRowSchema),
  /** Transport / operator-merge hints (often empty from tenant APIs; filled client-side via realtime). */
  degradedSignals: z.array(GovernanceDegradedSignalWireSchema),
  /** Policy / matrix derived — stable string codes. */
  replayRestrictions: z.array(z.string()),
  /** Consistency diagnostic codes affecting this execution scope (bounded list). */
  consistencyFlags: z.array(z.string()),
  generatedAt: z.string(),
});

export type ExecutionGovernanceVisibility = z.infer<typeof ExecutionGovernanceVisibilitySchema>;
