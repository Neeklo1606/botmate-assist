import type { GovernanceOverlayKind } from "./governance-overlay-taxonomy.js";
import { dominantGovernanceOverlay, sortGovernanceOverlaysDescending } from "./governance-overlay-order.js";

/** Subset of `ExecutionOperationalMark` booleans consumed for overlay derivation (Phase 10F). */
export interface ExecutionOperationalMarkFlags {
  frozen: boolean;
  governanceQuarantine: boolean;
  replayBlocked: boolean;
  escalated: boolean;
}

/**
 * Maps durable operational marks to governance overlays — deterministic, idempotent ordering.
 * Does not yet join transport-derived `DEGRADED` overlays (Phase 11).
 */
export function governanceOverlaysFromOperationalMarkFlags(
  flags: ExecutionOperationalMarkFlags,
): GovernanceOverlayKind[] {
  const acc: GovernanceOverlayKind[] = [];
  if (flags.frozen) acc.push("HARD_BLOCK");
  if (flags.replayBlocked) acc.push("REPLAY_RESTRICTED");
  if (flags.governanceQuarantine) acc.push("SOFT_BLOCK");
  if (flags.escalated) acc.push("RECOVERING");
  return sortGovernanceOverlaysDescending(acc);
}

export function governanceOverlaySummaryFromOperationalMarkFlags(flags: ExecutionOperationalMarkFlags): {
  overlays: GovernanceOverlayKind[];
  dominant: GovernanceOverlayKind | null;
} {
  const overlays = governanceOverlaysFromOperationalMarkFlags(flags);
  return { overlays, dominant: dominantGovernanceOverlay(overlays) };
}
