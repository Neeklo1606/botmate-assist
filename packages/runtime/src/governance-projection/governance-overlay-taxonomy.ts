/** Phase 10F — deterministic governance overlays (documentation + derivation helpers). */

export const GOVERNANCE_OVERLAY_KINDS = [
  "HARD_BLOCK",
  "SOFT_BLOCK",
  "DEGRADED",
  "OBSERVE_ONLY",
  "RECOVERING",
  "SUPPRESSED",
  "REPLAY_RESTRICTED",
] as const;

export type GovernanceOverlayKind = (typeof GOVERNANCE_OVERLAY_KINDS)[number];
