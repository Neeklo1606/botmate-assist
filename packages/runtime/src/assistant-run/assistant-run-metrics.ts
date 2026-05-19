/** Phase 11D — bounded `assistant.run` enqueue observability (internal activation only). */

let assistantRunEnqueueAccepted = 0;
let assistantRunEnqueueDeduped = 0;
let assistantRunEnqueueRejected = 0;
let assistantRunEnqueueDisabled = 0;

export function bumpAssistantRunEnqueueAccepted(): void {
  assistantRunEnqueueAccepted += 1;
}

export function bumpAssistantRunEnqueueDeduped(): void {
  assistantRunEnqueueDeduped += 1;
}

export function bumpAssistantRunEnqueueRejected(): void {
  assistantRunEnqueueRejected += 1;
}

export function bumpAssistantRunEnqueueDisabled(): void {
  assistantRunEnqueueDisabled += 1;
}

export function assistantRunMetricsPartial(): {
  assistantRunEnqueueAccepted: number;
  assistantRunEnqueueDeduped: number;
  assistantRunEnqueueRejected: number;
  assistantRunEnqueueDisabled: number;
} {
  return {
    assistantRunEnqueueAccepted,
    assistantRunEnqueueDeduped,
    assistantRunEnqueueRejected,
    assistantRunEnqueueDisabled,
  };
}
