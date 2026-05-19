/** Phase 11B — production strict / convergence telemetry. */

let controlPlaneGovernanceBypassObserved = 0;
let controlPlaneGovernanceBypassBlocked = 0;
let legacyPolicySnapshotMints = 0;
let realtimeTenantMismatchBlocked = 0;
let mcpPolicyContextRejected = 0;

export function bumpControlPlaneGovernanceBypassObserved(): void {
  controlPlaneGovernanceBypassObserved += 1;
}

export function bumpControlPlaneGovernanceBypassBlocked(): void {
  controlPlaneGovernanceBypassBlocked += 1;
}

export function bumpLegacyPolicySnapshotMint(): void {
  legacyPolicySnapshotMints += 1;
}

export function bumpRealtimeTenantMismatchBlocked(): void {
  realtimeTenantMismatchBlocked += 1;
}

export function bumpMcpPolicyContextRejected(): void {
  mcpPolicyContextRejected += 1;
}

export function productionStrictMetricsPartial(): {
  controlPlaneGovernanceBypassObserved: number;
  controlPlaneGovernanceBypassBlocked: number;
  legacyPolicySnapshotMints: number;
  realtimeTenantMismatchBlocked: number;
  mcpPolicyContextRejected: number;
} {
  return {
    controlPlaneGovernanceBypassObserved,
    controlPlaneGovernanceBypassBlocked,
    legacyPolicySnapshotMints,
    realtimeTenantMismatchBlocked,
    mcpPolicyContextRejected,
  };
}
