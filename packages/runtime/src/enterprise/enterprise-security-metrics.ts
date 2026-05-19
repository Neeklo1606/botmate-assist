/**
 * Phase 11F — security/audit counters (suspicious access patterns; no PII).
 */

let assistantRunEnqueueForbidden = 0;
let artifactAccessDenied = 0;
let wsTicketRejected = 0;
let runtimeApiDisabledHits = 0;

export function bumpAssistantRunEnqueueForbidden(): void {
  assistantRunEnqueueForbidden += 1;
}

export function bumpArtifactAccessDenied(): void {
  artifactAccessDenied += 1;
}

export function bumpWsTicketRejected(): void {
  wsTicketRejected += 1;
}

export function bumpRuntimeApiDisabledHit(): void {
  runtimeApiDisabledHits += 1;
}

export function enterpriseSecurityMetricsPartial(): {
  assistantRunEnqueueForbidden: number;
  artifactAccessDenied: number;
  wsTicketRejected: number;
  runtimeApiDisabledHits: number;
} {
  return {
    assistantRunEnqueueForbidden,
    artifactAccessDenied,
    wsTicketRejected,
    runtimeApiDisabledHits,
  };
}
