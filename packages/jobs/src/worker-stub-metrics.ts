/** Phase 11B — visibility for BullMQ stub completions (`worker-runtime.ts`). */

const stubCompletionsByQueue: Record<string, number> = {};
let workerStubCompletionsTotal = 0;
let workerStubRejectionsTotal = 0;

export function bumpWorkerStubCompletion(queue: string, reason: "missing_processor" | "intentional_stub"): void {
  workerStubCompletionsTotal += 1;
  const key = `${queue}:${reason}`;
  stubCompletionsByQueue[key] = (stubCompletionsByQueue[key] ?? 0) + 1;
}

export function bumpWorkerStubRejection(queue: string): void {
  workerStubRejectionsTotal += 1;
  const key = `${queue}:rejected`;
  stubCompletionsByQueue[key] = (stubCompletionsByQueue[key] ?? 0) + 1;
}

export function workerStubMetricsSnapshot(): {
  workerStubCompletionsTotal: number;
  workerStubRejectionsTotal: number;
  workerStubCompletionsByQueue: Record<string, number>;
} {
  return {
    workerStubCompletionsTotal,
    workerStubRejectionsTotal,
    workerStubCompletionsByQueue: { ...stubCompletionsByQueue },
  };
}
