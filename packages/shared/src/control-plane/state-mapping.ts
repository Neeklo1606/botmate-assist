import type { UnifiedExecutionState } from "./schemas.js";

/** Maps persisted browser automation rows (`BrowserRun.status`). */
export function mapBrowserRunStatus(status: string): UnifiedExecutionState {
  switch (status) {
    case "queued":
      return "queued";
    case "running":
      return "running";
    case "succeeded":
      return "completed";
    case "failed":
      return "failed";
    case "cancelled":
      return "cancelled";
    default:
      return "blocked";
  }
}

/** Maps chat tool ledger (`ToolInvocation.status`). */
export function mapToolInvocationStatus(status: string): UnifiedExecutionState {
  switch (status) {
    case "START":
      return "running";
    case "SUCCESS":
      return "completed";
    case "FAIL":
      return "failed";
    default:
      return "blocked";
  }
}
