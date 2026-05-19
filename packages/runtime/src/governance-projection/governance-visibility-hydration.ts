/**
 * Phase 11A — deterministic execution governance visibility hydration for API/UI delivery.
 * Joins durable marks with optional bounded signal lanes (no new orchestration).
 */
import type { ExecutionGovernanceVisibility } from "@botmate/shared";
import { dominantGovernanceOverlay, sortGovernanceOverlaysDescending } from "./governance-overlay-order.js";
import type { GovernanceOverlayKind } from "./governance-overlay-taxonomy.js";
import {
  governanceOverlaysFromOperationalMarkFlags,
  type ExecutionOperationalMarkFlags,
} from "./operational-mark-overlays.js";
import { recordExecutionGovernanceVisibilityHydration } from "./governance-projection-metrics.js";

export interface GovernanceVisibilityOptionalSignals {
  /** Operator/browser transport degraded snapshot (bounded; often unset on tenant APIs). */
  operatorTransportDegraded?: boolean;
  /** Policy layer indicates replay surface restriction for this execution. */
  replayPolicySurfaceRestricted?: boolean;
  /** Bounded consistency diagnostic codes (caller caps length). */
  consistencyIssueCodes?: string[];
  /** Active incident ack mute for `governance_mark:{executionId}` (Phase 11E). */
  incidentSuppressed?: boolean;
}

export interface HydrateExecutionGovernanceVisibilityInput {
  marks: ExecutionOperationalMarkFlags | null;
  generatedAtIso: string;
  signals?: GovernanceVisibilityOptionalSignals;
  /** Stable replay restriction codes from policy/matrix joins (optional). */
  replayRestrictionCodes?: string[];
}

function uniqueSortedOverlays(kinds: GovernanceOverlayKind[]): GovernanceOverlayKind[] {
  return sortGovernanceOverlaysDescending([...new Set(kinds)]);
}

/**
 * Deterministic overlay multiset + reasons. Idempotent for identical inputs.
 * Records telemetry via `recordExecutionGovernanceVisibilityHydration`.
 */
export function hydrateExecutionGovernanceVisibility(
  input: HydrateExecutionGovernanceVisibilityInput,
): ExecutionGovernanceVisibility {
  const reasons: ExecutionGovernanceVisibility["reasons"] = [];
  const degradedSignals: ExecutionGovernanceVisibility["degradedSignals"] = [];
  const matrixReplayCodes = [...(input.replayRestrictionCodes ?? [])].slice(0, 32);
  const consistencyFlags = [...(input.signals?.consistencyIssueCodes ?? [])].slice(0, 32);
  const replayOut = new Set<string>(matrixReplayCodes);

  const overlayAcc: GovernanceOverlayKind[] = [];

  if (input.marks) {
    overlayAcc.push(...governanceOverlaysFromOperationalMarkFlags(input.marks));
    const m = input.marks;
    if (m.frozen) reasons.push({ kind: "HARD_BLOCK", code: "frozen", source: "operational_mark" });
    if (m.replayBlocked) reasons.push({ kind: "REPLAY_RESTRICTED", code: "replay_blocked", source: "operational_mark" });
    if (m.governanceQuarantine) {
      reasons.push({ kind: "SOFT_BLOCK", code: "governance_quarantine", source: "operational_mark" });
    }
    if (m.escalated) reasons.push({ kind: "RECOVERING", code: "escalated", source: "operational_mark" });
  }

  if (input.signals?.incidentSuppressed) {
    overlayAcc.push("SUPPRESSED");
    reasons.push({ kind: "SUPPRESSED", code: "incident_muted", source: "incident_ack" });
  }

  if (input.signals?.operatorTransportDegraded) {
    overlayAcc.push("DEGRADED");
    reasons.push({ kind: "DEGRADED", code: "operator_transport_degraded", source: "browser_transport" });
    degradedSignals.push({ code: "operator_transport_degraded", source: "browser_transport" });
  }

  if (input.signals?.replayPolicySurfaceRestricted) {
    overlayAcc.push("REPLAY_RESTRICTED");
    reasons.push({ kind: "REPLAY_RESTRICTED", code: "policy_replay_surface", source: "policy_runtime" });
    replayOut.add("policy_replay_surface");
  }

  for (const code of matrixReplayCodes) {
    overlayAcc.push("REPLAY_RESTRICTED");
    reasons.push({ kind: "REPLAY_RESTRICTED", code, source: "replay_matrix" });
  }

  const overlays = uniqueSortedOverlays(overlayAcc);
  const dominant = dominantGovernanceOverlay(overlays);

  recordExecutionGovernanceVisibilityHydration(dominant);

  return {
    projection: "execution_governance_visibility_v1",
    dominantOverlay: dominant,
    overlays,
    reasons: dedupeGovernanceReasons(reasons),
    degradedSignals,
    replayRestrictions: uniqueSortedStrings([...replayOut]),
    consistencyFlags,
    generatedAt: input.generatedAtIso,
  };
}

function dedupeGovernanceReasons(
  reasons: ExecutionGovernanceVisibility["reasons"],
): ExecutionGovernanceVisibility["reasons"] {
  const seen = new Set<string>();
  const out: ExecutionGovernanceVisibility["reasons"] = [];
  for (const r of reasons) {
    const k = `${r.kind}\0${r.code}\0${r.source}`;
    if (seen.has(k)) continue;
    seen.add(k);
    out.push(r);
  }
  return out;
}

function uniqueSortedStrings(values: string[]): string[] {
  return [...new Set(values)].sort((a, b) => a.localeCompare(b));
}
