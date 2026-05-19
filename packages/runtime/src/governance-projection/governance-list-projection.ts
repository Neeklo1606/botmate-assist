/**
 * Phase 11C — bounded execution-list governance (operational marks only; no replay matrix per row).
 */
import type { GovernanceOverlayKind } from "./governance-overlay-taxonomy.js";
import {
  governanceOverlaySummaryFromOperationalMarkFlags,
  type ExecutionOperationalMarkFlags,
} from "./operational-mark-overlays.js";
import { bumpGovernanceExecutionListProjection } from "./governance-projection-metrics.js";

export function dominantOverlayFromOperationalMarkFlags(
  flags: ExecutionOperationalMarkFlags | null | undefined,
): GovernanceOverlayKind | null {
  if (!flags) return null;
  return governanceOverlaySummaryFromOperationalMarkFlags(flags).dominant;
}

export type OperationalMarkRow = ExecutionOperationalMarkFlags & { executionId: string };

/** Map executionId → dominant overlay for a single list page (max 50 rows). */
export function dominantOverlayByExecutionIdFromMarks(
  marks: OperationalMarkRow[],
): Map<string, GovernanceOverlayKind | null> {
  const out = new Map<string, GovernanceOverlayKind | null>();
  for (const m of marks) {
    out.set(
      m.executionId,
      dominantOverlayFromOperationalMarkFlags({
        frozen: m.frozen,
        escalated: m.escalated,
        replayBlocked: m.replayBlocked,
        governanceQuarantine: m.governanceQuarantine,
      }),
    );
  }
  bumpGovernanceExecutionListProjection(marks.length);
  return out;
}
