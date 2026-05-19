/** Phase 12C — in-process support/product counters (not a BI platform). */

const counters = {
  productEventsIngested: 0,
  productEventsDeduped: 0,
  productFeedbackSubmitted: 0,
  runtimeApiErrorsReported: 0,
  wsReconnectsReported: 0,
  activationSnapshotsBuilt: 0,
};

export function bumpProductEventIngested(): void {
  counters.productEventsIngested += 1;
}

export function bumpProductEventDeduped(): void {
  counters.productEventsDeduped += 1;
}

export function bumpProductFeedbackSubmitted(): void {
  counters.productFeedbackSubmitted += 1;
}

export function bumpRuntimeApiErrorReported(): void {
  counters.runtimeApiErrorsReported += 1;
}

export function bumpWsReconnectReported(): void {
  counters.wsReconnectsReported += 1;
}

export function bumpActivationSnapshotBuilt(): void {
  counters.activationSnapshotsBuilt += 1;
}

export function productSupportMetricsSnapshot(): Record<string, number> {
  return { ...counters };
}
