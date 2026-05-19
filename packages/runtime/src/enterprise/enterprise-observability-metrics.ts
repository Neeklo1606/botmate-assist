/**
 * Phase 11F — enterprise observability counters (process-local; export via `/health/runtime`).
 */

const SLOW_PRISMA_MS = Number(process.env.RUNTIME_SLOW_PRISMA_MS ?? "750");
const PAYLOAD_WARN_BYTES = Number(process.env.RUNTIME_PAYLOAD_WARN_BYTES ?? "262144");

let slowPrismaQueryCount = 0;
let slowPrismaQueryMaxMs = 0;
const slowPrismaByLabel: Record<string, number> = {};

let payloadOversizeWarnings = 0;
let reconcileHintKindsTotal = 0;
let reconcileDurationMsSum = 0;
let reconcileDurationMsMax = 0;
let reconcileDurationSamples = 0;

let executionProjectionListMsSum = 0;
let executionProjectionListSamples = 0;
let executionProjectionDetailMsSum = 0;
let executionProjectionDetailSamples = 0;

let overlayHydrationDriftObserved = 0;
let orphanUsageRowsObserved = 0;
let queueStaleWaitingSignals = 0;

export function observePrismaQueryTiming(label: string, startedMs: number): void {
  const ms = Date.now() - startedMs;
  if (ms < SLOW_PRISMA_MS) return;
  slowPrismaQueryCount += 1;
  slowPrismaQueryMaxMs = Math.max(slowPrismaQueryMaxMs, ms);
  slowPrismaByLabel[label] = (slowPrismaByLabel[label] ?? 0) + 1;
}

export function observePayloadBytes(bytes: number): void {
  if (bytes >= PAYLOAD_WARN_BYTES) payloadOversizeWarnings += 1;
}

export function recordReconcileJobObservability(input: { hintKinds: number; durationMs: number }): void {
  reconcileHintKindsTotal += Math.max(0, input.hintKinds);
  reconcileDurationMsSum += Math.max(0, input.durationMs);
  reconcileDurationMsMax = Math.max(reconcileDurationMsMax, input.durationMs);
  reconcileDurationSamples += 1;
}

export function recordExecutionListProjectionMs(ms: number): void {
  if (ms < 0) return;
  executionProjectionListMsSum += ms;
  executionProjectionListSamples += 1;
}

export function recordExecutionDetailProjectionMs(ms: number): void {
  if (ms < 0) return;
  executionProjectionDetailMsSum += ms;
  executionProjectionDetailSamples += 1;
}

export function bumpOverlayHydrationDriftObserved(): void {
  overlayHydrationDriftObserved += 1;
}

export function bumpOrphanUsageRowsObserved(count: number): void {
  orphanUsageRowsObserved += Math.max(0, count);
}

export function bumpQueueStaleWaitingSignal(): void {
  queueStaleWaitingSignals += 1;
}

export function enterpriseObservabilityMetricsPartial(): {
  slowPrismaQueryCount: number;
  slowPrismaQueryMaxMs: number;
  slowPrismaByLabel: Record<string, number>;
  payloadOversizeWarnings: number;
  reconcileHintKindsTotal: number;
  reconcileAvgDurationMs: number;
  reconcileMaxDurationMs: number;
  executionProjectionListAvgMs: number;
  executionProjectionDetailAvgMs: number;
  overlayHydrationDriftObserved: number;
  orphanUsageRowsObserved: number;
  queueStaleWaitingSignals: number;
  slowPrismaThresholdMs: number;
  payloadWarnThresholdBytes: number;
} {
  return {
    slowPrismaQueryCount,
    slowPrismaQueryMaxMs,
    slowPrismaByLabel: { ...slowPrismaByLabel },
    payloadOversizeWarnings,
    reconcileHintKindsTotal,
    reconcileAvgDurationMs:
      reconcileDurationSamples ? reconcileDurationMsSum / reconcileDurationSamples : 0,
    reconcileMaxDurationMs: reconcileDurationMsMax,
    executionProjectionListAvgMs:
      executionProjectionListSamples ? executionProjectionListMsSum / executionProjectionListSamples : 0,
    executionProjectionDetailAvgMs:
      executionProjectionDetailSamples ? executionProjectionDetailMsSum / executionProjectionDetailSamples : 0,
    overlayHydrationDriftObserved,
    orphanUsageRowsObserved,
    queueStaleWaitingSignals,
    slowPrismaThresholdMs: SLOW_PRISMA_MS,
    payloadWarnThresholdBytes: PAYLOAD_WARN_BYTES,
  };
}
