import type { RuntimeLifecycleEventName } from "./schemas.js";

/**
 * Declarative hints for bridging legacy envelopes/logs into `runtime.*` vocabulary.
 * Emitters stay unchanged in Phase 6A — consumers MAY derive unified events client-side or in future gateways.
 */
export const LEGACY_EVENT_TO_RUNTIME_LIFECYCLE: Readonly<
  Partial<Record<string, RuntimeLifecycleEventName>>
> = {
  // Browser realtime / SSE-ish signals
  "browser.step_started": "runtime.streaming",
  "browser.snapshot": "runtime.streaming",
  "browser.step_completed": "runtime.streaming",
  "browser.error": "runtime.failed",
  // Operator plane (Phase 5D)
  "operator.takeover": "runtime.waiting",
  "operator.joined": "runtime.waiting",
  "browser.feed_snapshot": "runtime.streaming",
};
