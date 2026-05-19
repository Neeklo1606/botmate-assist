import type { PolicyDecision } from "@botmate/shared";

export interface PolicyStructuredLogger {
  info(meta: Record<string, unknown>, msg: string): void;
  warn(meta: Record<string, unknown>, msg: string): void;
  error(meta: Record<string, unknown>, msg: string): void;
}

export interface PolicyMetricLabels {
  decision: PolicyDecision;
  reason?: string;
}

let policyEvaluations = 0;
let policyDenies = 0;
let policyFreezes = 0;
let policyWarnings = 0;
let queuePolicyDenies = 0;
let stalePolicyRejects = 0;
let policyContextMissing = 0;
let replayPolicyEvaluations = 0;
let asyncSurfacePolicyEvaluations = 0;
/** Phase 8G — lineage / realtime governance (`POLICY_SURFACE_AUDIT.md`). */
let executionLineageBreaks = 0;
let policyBypassWarnings = 0;
let asyncLineageRejects = 0;
let replayLineageRejects = 0;
let staleAsyncSnapshots = 0;
let orphanAsyncExecutions = 0;
/** Phase 8H — unified governance consolidation (`GOVERNANCE_CONSOLIDATION.md`). */
let governanceRealtimeMismatches = 0;
let governanceLineageDrifts = 0;
let governanceUnifiedObservations = 0;
let governanceSurfaceMissing = 0;
let governanceReplayDrifts = 0;

export function bumpPolicyEvaluation(labels: Pick<PolicyMetricLabels, "decision" | "reason">): void {
  void labels;
  policyEvaluations += 1;
}

export function bumpPolicyDeny(labels: Pick<PolicyMetricLabels, "decision" | "reason">): void {
  void labels;
  policyDenies += 1;
}

export function bumpPolicyFreezeOrQuarantine(labels: Pick<PolicyMetricLabels, "decision" | "reason">): void {
  void labels;
  policyFreezes += 1;
}

export function bumpPolicyWarn(labels: Pick<PolicyMetricLabels, "reason">): void {
  void labels;
  policyWarnings += 1;
}

export function bumpQueuePolicyIngressDeny(): void {
  queuePolicyDenies += 1;
}

export function bumpStalePolicyReject(): void {
  stalePolicyRejects += 1;
}

export function bumpPolicyContextMissing(): void {
  policyContextMissing += 1;
}

export function bumpReplayPolicyEvaluation(): void {
  replayPolicyEvaluations += 1;
}

export function bumpAsyncSurfacePolicyEvaluation(): void {
  asyncSurfacePolicyEvaluations += 1;
}

export function bumpExecutionLineageBreak(): void {
  executionLineageBreaks += 1;
}

export function bumpPolicyBypassWarning(): void {
  policyBypassWarnings += 1;
}

export function bumpAsyncLineageReject(): void {
  asyncLineageRejects += 1;
}

export function bumpReplayLineageReject(): void {
  replayLineageRejects += 1;
}

export function bumpStaleAsyncSnapshot(): void {
  staleAsyncSnapshots += 1;
}

export function bumpOrphanAsyncExecution(): void {
  orphanAsyncExecutions += 1;
}

export function bumpGovernanceRealtimeMismatch(): void {
  governanceRealtimeMismatches += 1;
}

export function bumpGovernanceLineageDrift(): void {
  governanceLineageDrifts += 1;
}

export function bumpGovernanceUnifiedObservation(): void {
  governanceUnifiedObservations += 1;
}

export function bumpGovernanceSurfaceMissing(): void {
  governanceSurfaceMissing += 1;
}

export function bumpGovernanceReplayDrift(): void {
  governanceReplayDrifts += 1;
}

export function snapshotPolicyCounters(): {
  policyEvaluations: number;
  policyDenies: number;
  policyFreezes: number;
  policyWarnings: number;
  queuePolicyDenies: number;
  stalePolicyRejects: number;
  policyContextMissing: number;
  replayPolicyEvaluations: number;
  asyncSurfacePolicyEvaluations: number;
  executionLineageBreaks: number;
  policyBypassWarnings: number;
  asyncLineageRejects: number;
  replayLineageRejects: number;
  staleAsyncSnapshots: number;
  orphanAsyncExecutions: number;
  governanceRealtimeMismatches: number;
  governanceLineageDrifts: number;
  governanceUnifiedObservations: number;
  governanceSurfaceMissing: number;
  governanceReplayDrifts: number;
} {
  return {
    policyEvaluations,
    policyDenies,
    policyFreezes,
    policyWarnings,
    queuePolicyDenies,
    stalePolicyRejects,
    policyContextMissing,
    replayPolicyEvaluations,
    asyncSurfacePolicyEvaluations,
    executionLineageBreaks,
    policyBypassWarnings,
    asyncLineageRejects,
    replayLineageRejects,
    staleAsyncSnapshots,
    orphanAsyncExecutions,
    governanceRealtimeMismatches,
    governanceLineageDrifts,
    governanceUnifiedObservations,
    governanceSurfaceMissing,
    governanceReplayDrifts,
  };
}

/** Reset counters — intended for tests only. */
export function resetPolicyCounters(): void {
  policyEvaluations = 0;
  policyDenies = 0;
  policyFreezes = 0;
  policyWarnings = 0;
  queuePolicyDenies = 0;
  stalePolicyRejects = 0;
  policyContextMissing = 0;
  replayPolicyEvaluations = 0;
  asyncSurfacePolicyEvaluations = 0;
  executionLineageBreaks = 0;
  policyBypassWarnings = 0;
  asyncLineageRejects = 0;
  replayLineageRejects = 0;
  staleAsyncSnapshots = 0;
  orphanAsyncExecutions = 0;
  governanceRealtimeMismatches = 0;
  governanceLineageDrifts = 0;
  governanceUnifiedObservations = 0;
  governanceSurfaceMissing = 0;
  governanceReplayDrifts = 0;
}

export function logPolicyStructured(
  logger: PolicyStructuredLogger | undefined,
  level: "info" | "warn" | "error",
  payload: Record<string, unknown>,
  msg: string,
): void {
  if (!logger) return;
  logger[level](payload, msg);
}
