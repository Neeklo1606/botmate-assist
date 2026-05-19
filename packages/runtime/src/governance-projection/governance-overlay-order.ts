import type { GovernanceOverlayKind } from "./governance-overlay-taxonomy.js";

const RANK: Record<GovernanceOverlayKind, number> = {
  HARD_BLOCK: 700,
  REPLAY_RESTRICTED: 600,
  DEGRADED: 550,
  SOFT_BLOCK: 500,
  RECOVERING: 400,
  SUPPRESSED: 300,
  OBSERVE_ONLY: 200,
};

export function governanceOverlayPrecedence(kind: GovernanceOverlayKind): number {
  return RANK[kind];
}

/** Highest-precedence overlay first — deterministic ordering. */
export function sortGovernanceOverlaysDescending(kinds: GovernanceOverlayKind[]): GovernanceOverlayKind[] {
  const uniq = [...new Set(kinds)];
  uniq.sort((a, b) => RANK[b] - RANK[a]);
  return uniq;
}

export function dominantGovernanceOverlay(kinds: GovernanceOverlayKind[]): GovernanceOverlayKind | null {
  if (kinds.length === 0) return null;
  const sorted = sortGovernanceOverlaysDescending(kinds);
  return sorted[0] ?? null;
}
