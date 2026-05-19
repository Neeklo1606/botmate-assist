import { bumpIncidentMutedUntilPolicyRejection } from "./incident-governance-metrics.js";

/** Max mute horizon from `now` when setting `mutedUntil` on incident ack; default 14d, min 1m, max ~366d. */
export function runtimeIncidentMuteMaxMs(): number {
  const v = Number(process.env.RUNTIME_INCIDENT_MUTE_MAX_MS ?? `${14 * 86400_000}`);
  return Math.min(366 * 86400_000, Math.max(60_000, Math.floor(v)));
}

/**
 * Rejects `mutedUntil` too far in the future relative to `now` — prevents unbounded suppression.
 * Returns `false` when rejected (and bumps observability counter).
 */
export function validateIncidentMutedUntilWindow(now: Date, mutedUntil?: Date): boolean {
  if (!mutedUntil) return true;
  const maxEnd = now.getTime() + runtimeIncidentMuteMaxMs();
  if (mutedUntil.getTime() > maxEnd) {
    bumpIncidentMutedUntilPolicyRejection();
    return false;
  }
  return true;
}
