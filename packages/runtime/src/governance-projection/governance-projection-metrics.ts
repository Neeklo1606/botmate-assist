/** Metrics for deterministic governance projections (Phase 10F) + visibility delivery (Phase 11A). */

import type { GovernanceOverlayKind } from "./governance-overlay-taxonomy.js";

let governanceIncidentsProjectionBuilds = 0;

let governanceExecutionVisibilityHydrations = 0;
let governanceExecutionListProjections = 0;
const governanceDominantOverlayCounts: Partial<Record<GovernanceOverlayKind | "NONE", number>> = {};

let retentionActivityFactsPurgedTotal = 0;
let retentionGovernanceAuditPurgedTotal = 0;
let retentionExecutionFactsPurgedTotal = 0;

export function bumpGovernanceIncidentsProjectionBuild(): void {
  governanceIncidentsProjectionBuilds += 1;
}

export function recordExecutionGovernanceVisibilityHydration(dominant: GovernanceOverlayKind | null): void {
  governanceExecutionVisibilityHydrations += 1;
  const k = (dominant ?? "NONE") as GovernanceOverlayKind | "NONE";
  governanceDominantOverlayCounts[k] = (governanceDominantOverlayCounts[k] ?? 0) + 1;
}

export function bumpGovernanceExecutionListProjection(rowCount: number): void {
  governanceExecutionListProjections += Math.max(0, rowCount);
}

export function recordRetentionPurgeCounts(input: {
  activityFacts: number;
  governanceAudit: number;
  executionFacts?: number;
}): void {
  retentionActivityFactsPurgedTotal += Math.max(0, input.activityFacts);
  retentionGovernanceAuditPurgedTotal += Math.max(0, input.governanceAudit);
  retentionExecutionFactsPurgedTotal += Math.max(0, input.executionFacts ?? 0);
}

export function governanceProjectionMetricsPartial(): {
  governanceIncidentsProjectionBuilds: number;
  governanceExecutionVisibilityHydrations: number;
  governanceExecutionListProjections: number;
  governanceDominantOverlayCounts: Record<string, number>;
  retentionActivityFactsPurgedTotal: number;
  retentionGovernanceAuditPurgedTotal: number;
  retentionExecutionFactsPurgedTotal: number;
} {
  return {
    governanceIncidentsProjectionBuilds,
    governanceExecutionVisibilityHydrations,
    governanceExecutionListProjections,
    governanceDominantOverlayCounts: { ...governanceDominantOverlayCounts } as Record<string, number>,
    retentionActivityFactsPurgedTotal,
    retentionGovernanceAuditPurgedTotal,
    retentionExecutionFactsPurgedTotal,
  };
}
