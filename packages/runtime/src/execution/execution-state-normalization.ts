/**
 * Phase 11E — canonical execution phase mapping (normalization only; no schema migration).
 *
 * Unifies heterogeneous store enums into a single wire vocabulary for projections/UI.
 */

/** Canonical runtime execution phase — superset of lifecycle + store statuses. */
export type RuntimeExecutionPhase =
  | "pending"
  | "running"
  | "streaming"
  | "partial"
  | "succeeded"
  | "failed"
  | "cancelled"
  | "blocked"
  | "frozen"
  | "unknown";

export type MessageDeliveryStatusWire = "complete" | "streaming" | "partial" | "failed";
export type BrowserRunStatusWire = "queued" | "running" | "succeeded" | "failed" | "cancelled";
export type ToolInvocationStatusWire = "START" | "SUCCESS" | "FAIL";

export function normalizeMessageDeliveryStatus(status: string | null | undefined): RuntimeExecutionPhase {
  switch (status) {
    case "complete":
      return "succeeded";
    case "streaming":
      return "streaming";
    case "partial":
      return "partial";
    case "failed":
      return "failed";
    default:
      return "unknown";
  }
}

export function normalizeBrowserRunStatus(status: string | null | undefined): RuntimeExecutionPhase {
  switch (status) {
    case "queued":
      return "pending";
    case "running":
      return "running";
    case "succeeded":
      return "succeeded";
    case "failed":
      return "failed";
    case "cancelled":
      return "cancelled";
    default:
      return "unknown";
  }
}

export function normalizeToolInvocationStatus(status: string | null | undefined): RuntimeExecutionPhase {
  switch (status) {
    case "START":
      return "running";
    case "SUCCESS":
      return "succeeded";
    case "FAIL":
      return "failed";
    default:
      return "unknown";
  }
}

/** BullMQ job state → coarse execution phase (queue lifecycle). */
export function normalizeQueueJobState(state: string | null | undefined): RuntimeExecutionPhase {
  switch (state) {
    case "waiting":
    case "delayed":
    case "paused":
      return "pending";
    case "active":
      return "running";
    case "completed":
      return "succeeded";
    case "failed":
      return "failed";
    default:
      return "unknown";
  }
}

/** `execution.*` realtime lifecycle events → phase. */
export function normalizeLifecycleEventPhase(event: string | null | undefined): RuntimeExecutionPhase {
  switch (event) {
    case "execution.started":
      return "pending";
    case "execution.running":
      return "running";
    case "execution.completed":
      return "succeeded";
    case "execution.failed":
      return "failed";
    case "execution.blocked":
      return "blocked";
    case "execution.frozen":
      return "frozen";
    case "execution.replayed":
      return "succeeded";
    default:
      return "unknown";
  }
}

/** Collapse phase to list/detail `status` tri-state used by `RuntimeExecutionRow`. */
export function runtimeExecutionPhaseToRowStatus(
  phase: RuntimeExecutionPhase,
): "succeeded" | "failed" | "running" {
  if (phase === "failed" || phase === "blocked" || phase === "cancelled") return "failed";
  if (phase === "running" || phase === "streaming" || phase === "pending" || phase === "partial") {
    return "running";
  }
  return "succeeded";
}
