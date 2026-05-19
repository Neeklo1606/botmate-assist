/**
 * Phase 10E — logical incident phases for UX / governance narration.
 * Not stored as a Postgres ENUM; projection + ack rows imply phase (see `INCIDENT_STATE_MACHINE.md`).
 */
export const INCIDENT_OPERATIONAL_PHASES = [
  "OPEN",
  "ACKNOWLEDGED",
  "INVESTIGATING",
  "CONTAINED",
  "DEGRADED",
  "RECOVERING",
  "RESOLVED",
  "SUPPRESSED",
] as const;

export type IncidentOperationalPhase = (typeof INCIDENT_OPERATIONAL_PHASES)[number];
