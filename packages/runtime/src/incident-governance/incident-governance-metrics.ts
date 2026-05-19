/** Counters for deterministic incident / operational state API paths (Phase 10E). */

let incidentAckUpserts = 0;
let consistencyIncidentAckUpserts = 0;
let operationalMarkMutations = 0;
let incidentMutedUntilPolicyRejections = 0;

export function bumpIncidentAckUpsert(): void {
  incidentAckUpserts += 1;
}

export function bumpConsistencyIncidentAckUpsert(): void {
  consistencyIncidentAckUpserts += 1;
}

export function bumpOperationalMarkMutation(): void {
  operationalMarkMutations += 1;
}

export function bumpIncidentMutedUntilPolicyRejection(): void {
  incidentMutedUntilPolicyRejections += 1;
}

export function incidentGovernanceMetricsPartial(): {
  incidentAckUpserts: number;
  consistencyIncidentAckUpserts: number;
  operationalMarkMutations: number;
  incidentMutedUntilPolicyRejections: number;
} {
  return {
    incidentAckUpserts,
    consistencyIncidentAckUpserts,
    operationalMarkMutations,
    incidentMutedUntilPolicyRejections,
  };
}
