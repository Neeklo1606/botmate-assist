import { snapshotPolicyCounters } from "./policy/policy-metrics.js";
import { repairGovernanceMetricsPartial } from "./repair/repair-governance-metrics.js";
import { executionSafetyMetricsPartial } from "./safety/execution-safety-metrics.js";
import { incidentGovernanceMetricsPartial } from "./incident-governance/incident-governance-metrics.js";
import { governanceProjectionMetricsPartial } from "./governance-projection/governance-projection-metrics.js";
import { assistantRunMetricsPartial } from "./assistant-run/assistant-run-metrics.js";
import { enterpriseOpsMetricsPartial } from "./enterprise/enterprise-ops-metrics.js";
import { enterpriseObservabilityMetricsPartial } from "./enterprise/enterprise-observability-metrics.js";
import { enterpriseSecurityMetricsPartial } from "./enterprise/enterprise-security-metrics.js";
import { productionStrictMetricsPartial } from "./production/production-metrics.js";

let providerAttempts = 0;
let streamChunks = 0;

/** Embedding worker batches — duration ms totals & chunk counters for observability snapshots. */
let embeddingBatchCount = 0;
let embeddingBatchDurationSumMs = 0;
let embeddingChunkSum = 0;

/** RAG retrieval/query embedding aggregates (assistant runtime path). */
let ragPackCount = 0;
let ragRetrievalLatencySumMs = 0;
let ragEmbedLatencySumMs = 0;
let ragHitsSum = 0;
let ragChunksSelectedSum = 0;

/** Tool execution aggregates — Phase 5A deterministic executor surface. */
let toolInvocationCount = 0;
let toolFailureCount = 0;
let toolRetrySum = 0;
let toolLatencySumMs = 0;

/** Browser automation aggregates — Phase 5C skeleton worker metrics. */
let browserJobsOk = 0;
let browserJobsFail = 0;
let browserStepsSum = 0;
let browserArtifactsSum = 0;
let browserLatencySumMs = 0;

/** Phase 5D — operator browser feed + tenant-safe observe lease collisions. */
let operatorFeedSnapshotsOk = 0;
let operatorFeedSnapshotsFail = 0;
let operatorFeedSnapshotsSkippedThrottle = 0;
let operatorFeedSnapshotsSkippedNoLease = 0;
let operatorFeedSnapshotsSkippedNoRoom = 0;
let operatorFeedSnapshotsSkippedDisabled = 0;
let operatorFeedSnapshotsDegraded = 0;
let operatorFeedSnapshotBytesSum = 0;
let operatorFeedSnapshotLatencySumMs = 0;
let browserRunsBlockedOperatorExclusive = 0;
let operatorLeaseRowsExpiredCleanup = 0;

/** Phase 6A — governance kill-switch denials (tenant denylist / emergency disable / drain). */
let runtimeGovernanceDenied = 0;

export function observeBrowserTelemetry(metrics: {
  ok: boolean;
  latencyMs: number;
  steps: number;
  artifacts: number;
}): void {
  if (metrics.ok) browserJobsOk += 1;
  else browserJobsFail += 1;
  browserStepsSum += metrics.steps;
  browserArtifactsSum += metrics.artifacts;
  browserLatencySumMs += metrics.latencyMs;
}

export function bumpBrowserOperatorExclusiveBlockedRun(): void {
  browserRunsBlockedOperatorExclusive += 1;
}

export function bumpOperatorLeaseExpiredCleanup(rows: number): void {
  operatorLeaseRowsExpiredCleanup += Math.max(0, rows);
}

export function bumpRuntimeGovernanceDenied(): void {
  runtimeGovernanceDenied += 1;
}

export function observeOperatorFeedTelemetry(metrics: {
  ok: boolean;
  latencyMs: number;
  degraded?: boolean;
  snapshotBytes?: number;
  skippedThrottle?: boolean;
  skippedNoLease?: boolean;
  skippedNoRoom?: boolean;
  skippedDisabled?: boolean;
}): void {
  if (metrics.skippedThrottle) {
    operatorFeedSnapshotsSkippedThrottle += 1;
    return;
  }
  if (metrics.skippedNoLease) {
    operatorFeedSnapshotsSkippedNoLease += 1;
    return;
  }
  if (metrics.skippedNoRoom) {
    operatorFeedSnapshotsSkippedNoRoom += 1;
    return;
  }
  if (metrics.skippedDisabled) {
    operatorFeedSnapshotsSkippedDisabled += 1;
    return;
  }
  operatorFeedSnapshotLatencySumMs += metrics.latencyMs;
  if (metrics.ok) {
    operatorFeedSnapshotsOk += 1;
    if (metrics.degraded) operatorFeedSnapshotsDegraded += 1;
    operatorFeedSnapshotBytesSum += metrics.snapshotBytes ?? 0;
  } else {
    operatorFeedSnapshotsFail += 1;
  }
}

export function bumpProviderAttempt(): void {
  providerAttempts++;
}

export function bumpStreamChunk(): void {
  streamChunks++;
}

export function observeEmbeddingJobBatch(durationMs: number, chunkCount: number): void {
  embeddingBatchCount += 1;
  embeddingBatchDurationSumMs += durationMs;
  embeddingChunkSum += chunkCount;
}

export function observeRagPack(metrics: {
  retrievalMs: number;
  embedMs: number;
  hitsConsidered: number;
  chunksInPrompt: number;
}): void {
  ragPackCount += 1;
  ragRetrievalLatencySumMs += metrics.retrievalMs;
  ragEmbedLatencySumMs += metrics.embedMs;
  ragHitsSum += metrics.hitsConsidered;
  ragChunksSelectedSum += metrics.chunksInPrompt;
}

export function observeToolExecution(metrics: {
  ok: boolean;
  latencyMs: number;
  retries: number;
  toolId: string;
}): void {
  toolInvocationCount += 1;
  toolLatencySumMs += metrics.latencyMs;
  toolRetrySum += metrics.retries;
  if (!metrics.ok) toolFailureCount += 1;
}

export function runtimeMetricsSnapshot(): {
  providerAttempts: number;
  streamChunks: number;
  embeddingBatches: number;
  embeddingAvgBatchMs: number;
  embeddingChunksTotal: number;
  ragPacks: number;
  ragAvgRetrievalMs: number;
  ragAvgEmbedMs: number;
  ragAvgHits: number;
  ragAvgChunksSelected: number;
  toolInvocations: number;
  toolFailures: number;
  toolAvgRetries: number;
  toolAvgLatencyMs: number;
  browserJobsOk: number;
  browserJobsFail: number;
  browserStepsTotal: number;
  browserArtifactsTotal: number;
  browserAvgLatencyMs: number;
  browserRunsBlockedOperatorExclusive: number;
  operatorLeaseRowsExpiredCleanup: number;
  operatorFeedSnapshotsOk: number;
  operatorFeedSnapshotsFail: number;
  operatorFeedSnapshotsSkippedThrottle: number;
  operatorFeedSnapshotsSkippedNoLease: number;
  operatorFeedSnapshotsSkippedNoRoom: number;
  operatorFeedSnapshotsSkippedDisabled: number;
  operatorFeedSnapshotsDegraded: number;
  operatorFeedAvgSnapshotBytes: number;
  operatorFeedAvgSnapshotLatencyMs: number;
  runtimeGovernanceDenied: number;
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
  repairTenantScopeViolations: number;
  reconcileEnqueueCooldownSuppressions: number;
  incidentAckUpserts: number;
  consistencyIncidentAckUpserts: number;
  operationalMarkMutations: number;
  incidentMutedUntilPolicyRejections: number;
  governanceIncidentsProjectionBuilds: number;
  governanceExecutionVisibilityHydrations: number;
  governanceDominantOverlayCounts: Record<string, number>;
  governanceExecutionListProjections: number;
  retentionActivityFactsPurgedTotal: number;
  retentionGovernanceAuditPurgedTotal: number;
  controlPlaneGovernanceBypassObserved: number;
  controlPlaneGovernanceBypassBlocked: number;
  legacyPolicySnapshotMints: number;
  realtimeTenantMismatchBlocked: number;
  mcpPolicyContextRejected: number;
  assistantRunEnqueueAccepted: number;
  assistantRunEnqueueDeduped: number;
  assistantRunEnqueueRejected: number;
  assistantRunEnqueueDisabled: number;
  retentionExecutionFactsPurgedTotal: number;
  runtimeReconcileJobsCompleted: number;
  tenantScopeAssertionFailures: number;
  assistantRunJobsCompleted: number;
  assistantRunJobsFailed: number;
  slowPrismaQueryCount: number;
  slowPrismaQueryMaxMs: number;
  payloadOversizeWarnings: number;
  reconcileAvgDurationMs: number;
  executionProjectionListAvgMs: number;
  executionProjectionDetailAvgMs: number;
  overlayHydrationDriftObserved: number;
  orphanUsageRowsObserved: number;
  queueStaleWaitingSignals: number;
  assistantRunEnqueueForbidden: number;
} {
  const pc = snapshotPolicyCounters();
  const rg = repairGovernanceMetricsPartial();
  const es = executionSafetyMetricsPartial();
  const ig = incidentGovernanceMetricsPartial();
  const gp = governanceProjectionMetricsPartial();
  const ps = productionStrictMetricsPartial();
  const ar = assistantRunMetricsPartial();
  const eo = enterpriseOpsMetricsPartial();
  const obs = enterpriseObservabilityMetricsPartial();
  const sec = enterpriseSecurityMetricsPartial();
  const browserJobsTotal = browserJobsOk + browserJobsFail;
  const feedAttempts = operatorFeedSnapshotsOk + operatorFeedSnapshotsFail;
  return {
    providerAttempts,
    streamChunks,
    embeddingBatches: embeddingBatchCount,
    embeddingAvgBatchMs: embeddingBatchCount ? embeddingBatchDurationSumMs / embeddingBatchCount : 0,
    embeddingChunksTotal: embeddingChunkSum,
    ragPacks: ragPackCount,
    ragAvgRetrievalMs: ragPackCount ? ragRetrievalLatencySumMs / ragPackCount : 0,
    ragAvgEmbedMs: ragPackCount ? ragEmbedLatencySumMs / ragPackCount : 0,
    ragAvgHits: ragPackCount ? ragHitsSum / ragPackCount : 0,
    ragAvgChunksSelected: ragPackCount ? ragChunksSelectedSum / ragPackCount : 0,
    toolInvocations: toolInvocationCount,
    toolFailures: toolFailureCount,
    toolAvgRetries: toolInvocationCount ? toolRetrySum / toolInvocationCount : 0,
    toolAvgLatencyMs: toolInvocationCount ? toolLatencySumMs / toolInvocationCount : 0,
    browserJobsOk,
    browserJobsFail,
    browserStepsTotal: browserStepsSum,
    browserArtifactsTotal: browserArtifactsSum,
    browserAvgLatencyMs: browserJobsTotal ? browserLatencySumMs / browserJobsTotal : 0,
    browserRunsBlockedOperatorExclusive,
    operatorLeaseRowsExpiredCleanup,
    operatorFeedSnapshotsOk,
    operatorFeedSnapshotsFail,
    operatorFeedSnapshotsSkippedThrottle,
    operatorFeedSnapshotsSkippedNoLease,
    operatorFeedSnapshotsSkippedNoRoom,
    operatorFeedSnapshotsSkippedDisabled,
    operatorFeedSnapshotsDegraded,
    operatorFeedAvgSnapshotBytes: feedAttempts ? operatorFeedSnapshotBytesSum / feedAttempts : 0,
    operatorFeedAvgSnapshotLatencyMs: feedAttempts ? operatorFeedSnapshotLatencySumMs / feedAttempts : 0,
    runtimeGovernanceDenied,
    policyEvaluations: pc.policyEvaluations,
    policyDenies: pc.policyDenies,
    policyFreezes: pc.policyFreezes,
    policyWarnings: pc.policyWarnings,
    queuePolicyDenies: pc.queuePolicyDenies,
    stalePolicyRejects: pc.stalePolicyRejects,
    policyContextMissing: pc.policyContextMissing,
    replayPolicyEvaluations: pc.replayPolicyEvaluations,
    asyncSurfacePolicyEvaluations: pc.asyncSurfacePolicyEvaluations,
    executionLineageBreaks: pc.executionLineageBreaks,
    policyBypassWarnings: pc.policyBypassWarnings,
    asyncLineageRejects: pc.asyncLineageRejects,
    replayLineageRejects: pc.replayLineageRejects,
    staleAsyncSnapshots: pc.staleAsyncSnapshots,
    orphanAsyncExecutions: pc.orphanAsyncExecutions,
    governanceRealtimeMismatches: pc.governanceRealtimeMismatches,
    governanceLineageDrifts: pc.governanceLineageDrifts,
    governanceUnifiedObservations: pc.governanceUnifiedObservations,
    governanceSurfaceMissing: pc.governanceSurfaceMissing,
    governanceReplayDrifts: pc.governanceReplayDrifts,
    repairTenantScopeViolations: rg.repairTenantScopeViolations,
    reconcileEnqueueCooldownSuppressions: es.reconcileEnqueueCooldownSuppressions,
    incidentAckUpserts: ig.incidentAckUpserts,
    consistencyIncidentAckUpserts: ig.consistencyIncidentAckUpserts,
    operationalMarkMutations: ig.operationalMarkMutations,
    incidentMutedUntilPolicyRejections: ig.incidentMutedUntilPolicyRejections,
    governanceIncidentsProjectionBuilds: gp.governanceIncidentsProjectionBuilds,
    governanceExecutionVisibilityHydrations: gp.governanceExecutionVisibilityHydrations,
    governanceDominantOverlayCounts: gp.governanceDominantOverlayCounts,
    governanceExecutionListProjections: gp.governanceExecutionListProjections,
    retentionActivityFactsPurgedTotal: gp.retentionActivityFactsPurgedTotal,
    retentionGovernanceAuditPurgedTotal: gp.retentionGovernanceAuditPurgedTotal,
    controlPlaneGovernanceBypassObserved: ps.controlPlaneGovernanceBypassObserved,
    controlPlaneGovernanceBypassBlocked: ps.controlPlaneGovernanceBypassBlocked,
    legacyPolicySnapshotMints: ps.legacyPolicySnapshotMints,
    realtimeTenantMismatchBlocked: ps.realtimeTenantMismatchBlocked,
    mcpPolicyContextRejected: ps.mcpPolicyContextRejected,
    assistantRunEnqueueAccepted: ar.assistantRunEnqueueAccepted,
    assistantRunEnqueueDeduped: ar.assistantRunEnqueueDeduped,
    assistantRunEnqueueRejected: ar.assistantRunEnqueueRejected,
    assistantRunEnqueueDisabled: ar.assistantRunEnqueueDisabled,
    retentionExecutionFactsPurgedTotal: gp.retentionExecutionFactsPurgedTotal,
    runtimeReconcileJobsCompleted: eo.runtimeReconcileJobsCompleted,
    tenantScopeAssertionFailures: eo.tenantScopeAssertionFailures,
    assistantRunJobsCompleted: eo.assistantRunJobsCompleted,
    assistantRunJobsFailed: eo.assistantRunJobsFailed,
    slowPrismaQueryCount: obs.slowPrismaQueryCount,
    slowPrismaQueryMaxMs: obs.slowPrismaQueryMaxMs,
    payloadOversizeWarnings: obs.payloadOversizeWarnings,
    reconcileAvgDurationMs: obs.reconcileAvgDurationMs,
    executionProjectionListAvgMs: obs.executionProjectionListAvgMs,
    executionProjectionDetailAvgMs: obs.executionProjectionDetailAvgMs,
    overlayHydrationDriftObserved: obs.overlayHydrationDriftObserved,
    orphanUsageRowsObserved: obs.orphanUsageRowsObserved,
    queueStaleWaitingSignals: obs.queueStaleWaitingSignals,
    assistantRunEnqueueForbidden: sec.assistantRunEnqueueForbidden,
  };
}
