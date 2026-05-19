/**
 * Phase 11F — client-side realtime pressure counters (process-local; devtools / future export).
 */

let timelineMergeHits = 0;
let timelineMergeMisses = 0;
let runtimeInvalidationBursts = 0;
let activityStreamCapTruncations = 0;

export function bumpTimelineMergeHit(): void {
  timelineMergeHits += 1;
}

export function bumpTimelineMergeMiss(): void {
  timelineMergeMisses += 1;
}

export function bumpRuntimeInvalidationBurst(): void {
  runtimeInvalidationBursts += 1;
}

export function bumpActivityStreamCapTruncation(): void {
  activityStreamCapTruncations += 1;
}

export function getRuntimeClientPressureSnapshot(): {
  timelineMergeHits: number;
  timelineMergeMisses: number;
  runtimeInvalidationBursts: number;
  activityStreamCapTruncations: number;
} {
  return {
    timelineMergeHits,
    timelineMergeMisses,
    runtimeInvalidationBursts,
    activityStreamCapTruncations,
  };
}
