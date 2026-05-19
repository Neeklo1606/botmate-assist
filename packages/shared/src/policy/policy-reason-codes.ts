import { z } from "zod";

/** Stable audit-friendly reason codes — extend with additive enum values only. */
export const PolicyReasonCodeSchema = z.enum([
  "POLICY_OK",
  "POLICY_RUNTIME_DISABLED",
  "TENANT_FROZEN",
  "TENANT_QUARANTINED",
  "RESOURCE_LIMIT",
  "BROWSER_DENIED",
  "TOOL_DENIED",
  "OPERATOR_DENIED",
  /** Legacy replay denial label — prefer **`POLICY_REPLAY_DENIED`** for new audits (Phase 8F). */
  "REPLAY_DENIED",
  /** Snapshot / transported context mismatch (`policyJobContext` vs worker snapshot). */
  "POLICY_SNAPSHOT_STALE",
  /** Legacy stale-label retained for serialized audits — evaluator emits **`POLICY_SNAPSHOT_STALE`** for parity gates. */
  "POLICY_STALE",
  /** Tenant-bound MCP/orchestration calls without scoped identity propagation (warn metric path). */
  "POLICY_CONTEXT_MISSING",
  /** Replay descriptor denied by snapshot runtime domain (`replayDenied` / `replayMutationsDenied`). */
  "POLICY_REPLAY_DENIED",
  /** Phase 8G — dequeue lineage validation / structured warns (`EXECUTION_FAILSAFE_MODEL.md`). Not always emitted by evaluator. */
  "EXECUTION_LINEAGE_MISSING",
  "EXECUTION_CONTEXT_STALE",
  "ASYNC_EXECUTION_REJECTED",
  /** Observability label — surface skipped deterministic policy ingress (warn path). */
  "POLICY_SURFACE_BYPASS",
  /** Phase 8H — registry/facade could not resolve declared governance surface id (additive telemetry). */
  "GOVERNANCE_SURFACE_MISSING",
  /** Phase 8H — lineage spine / attachment inconsistent with tenant-bound expectations (warn layer). */
  "GOVERNANCE_LINEAGE_DRIFT",
  /** Phase 8H — realtime envelope tenant ≠ publish workspace tenant (`SSE_REALTIME_GOVERNANCE.md`). */
  "GOVERNANCE_REALTIME_MISMATCH",
  /** Phase 8H — replay evaluation diverged from lineage-safe expectations (paired with **`POLICY_REPLAY_DENIED`** telemetry). */
  "GOVERNANCE_REPLAY_DRIFT",
  "UNKNOWN_POLICY",
  "INTERNAL_POLICY_ERROR",
]);

export type PolicyReasonCode = z.infer<typeof PolicyReasonCodeSchema>;
