export type { RuntimeLogger } from "./tracing.js";
export { createSpan, createTraceId } from "./tracing.js";
export { streamEventToSseLines } from "./sse-format.js";
export type { ChatMessage, ChatStreamParams, StreamEvent } from "./streaming-types.js";
export {
  iterateOpenAiCompatibleChatStream,
  openAiCompatibleChatStreamRequest,
} from "./openai-compat-stream.js";
export {
  normalizeProviderHint,
  parseFallbackChainEnv,
  streamWithProviderFallback,
  type ProviderCredentialBundle,
  type ProviderId,
} from "./model-router.js";
export type {
  RegisteredToolDefinition,
  RegisteredToolHandler,
  ToolExecutionContext,
  ToolNormalizedResult,
  ToolRiskTier,
} from "./tool-runtime.js";
export {
  normalizeToolResult,
  ToolPermissionDeniedError,
  ToolPermissionLayer,
  ToolRegistry,
} from "./tool-runtime.js";
export { estimateUsdCost, persistAiUsageLedger } from "./usage-ledger.js";
export type { UsageLedgerInput } from "./usage-ledger.js";
export { parseAssistantRuntimeSettings } from "./settings-parse.js";
export type { ParsedAssistantRuntimeSettings } from "./settings-parse.js";
export { AssistantRuntime } from "./assistant-runtime.js";
export {
  executeAssistantRunJob,
  type ExecuteAssistantRunJobInput,
  type NotificationEnqueuePayload,
} from "./assistant-run-job.js";
export {
  bumpProviderAttempt,
  bumpStreamChunk,
  runtimeMetricsSnapshot,
  observeEmbeddingJobBatch,
  observeRagPack,
  observeToolExecution,
  observeBrowserTelemetry,
  bumpBrowserOperatorExclusiveBlockedRun,
  bumpOperatorLeaseExpiredCleanup,
  bumpRuntimeGovernanceDenied,
  observeOperatorFeedTelemetry,
} from "./runtime-metrics.js";
export {
  KNOWLEDGE_VECTOR_DIMENSION,
  KNOWLEDGE_MAX_UPLOAD_BYTES,
  KNOWLEDGE_MAX_CHUNKS_PER_DOCUMENT,
} from "./knowledge/constants.js";
export { executeKnowledgeProcessJob } from "./knowledge/process-knowledge-job.js";
export { executeEmbeddingsGenerateJob } from "./embeddings/process-embeddings-job.js";
export { executeNotificationsDispatchJob } from "./notifications/process-notifications-dispatch-job.js";
export {
  buildRuntimeRagPack,
  resolveEffectiveKnowledgeBaseIds,
  type RuntimeRagPack,
  type RagCitation,
} from "./rag/runtime-rag.js";
export {
  ToolExecutionEngine,
  ToolRetryableError,
  type ToolRunMetrics,
} from "./tools/tool-execution-engine.js";
export { streamToolExecutionLifecycle } from "./tools/tool-stream-events.js";
export { executeToolAsyncJob } from "./tools/process-tool-async-job.js";
export type { WorkspaceRole } from "./tools/dangerous-guard.js";
export { assertToolRiskTierAllowed } from "./tools/dangerous-guard.js";
export { mergeHttpAllowHosts, assertSafeHttpUrl } from "./tools/ssrf.js";
export { executeConfiguredHttpTool } from "./tools/http-tool-executor.js";
export type { McpToolDescriptor, McpJsonRpcRequest, McpJsonRpcResponse } from "./mcp/mcp-types.js";
export type { McpTransport } from "./mcp/mcp-transport.js";
export { McpHttpTransport } from "./mcp/mcp-http-transport.js";
export { McpSession } from "./mcp/mcp-session.js";
export { McpCapabilityRegistry, qualifyMcpToolId } from "./mcp/mcp-capability-registry.js";

/** Phase 6A unified runtime control plane (additive governance + observability helpers). */
export {
  evaluateRuntimeSubsystemGate,
  evaluateUnifiedRuntimePolicy,
  createExecutionIdentity,
  collectExecutionSignals,
  buildRuntimeRegistrySnapshot,
  normalizeExecutionLineageAttachment,
  extractEffectiveExecutionLineage,
  hasMinimalExecutionLineage,
  inheritExecutionIdentity,
  mergeExecutionContextSafe,
  ensureExecutionLineage,
  type GovernanceGateResult,
  type RuntimeRegistrySnapshot,
} from "./control-plane/index.js";
export { observeRealtimeEnvelopeGovernance } from "./realtime/envelope-governance.js";
export {
  publishGovernedRealtimeToRooms,
  type GovernedRealtimePublishPort,
  type GovernedRealtimeWireMode,
} from "./realtime/governed-realtime-publish.js";
/** Phase 8H execution governance facade (`GOVERNANCE_CONSOLIDATION.md`). */
export {
  EXECUTION_GOVERNANCE_REGISTRY,
  governanceSurfaceIdForJobName,
  resolveGovernanceSurface,
  evaluateExecutionGovernance,
  observeExecutionGovernance,
  validateExecutionLineage,
  validateRealtimeEnvelope,
  validateAsyncExecution,
  normalizeGovernanceSnapshotFields,
  type ExecutionGovernanceSurfaceDescriptor,
  type ExecutionGovernanceEvaluationResult,
  type ExecutionMutationClass,
  type GovernanceSensitivity,
} from "./governance/index.js";
export {
  evaluatePolicy,
  evaluatePolicyWithRuntimeEnv,
  enforcePolicyOrThrow,
  PolicyEnforcementError,
  bumpPolicyEvaluation,
  bumpPolicyDeny,
  bumpPolicyFreezeOrQuarantine,
  bumpPolicyWarn,
  bumpPolicyContextMissing,
  bumpReplayPolicyEvaluation,
  bumpAsyncSurfacePolicyEvaluation,
  bumpExecutionLineageBreak,
  bumpPolicyBypassWarning,
  bumpAsyncLineageReject,
  bumpReplayLineageReject,
  bumpStaleAsyncSnapshot,
  bumpOrphanAsyncExecution,
  bumpGovernanceRealtimeMismatch,
  bumpGovernanceLineageDrift,
  bumpGovernanceUnifiedObservation,
  bumpGovernanceSurfaceMissing,
  bumpGovernanceReplayDrift,
  bumpQueuePolicyIngressDeny,
  bumpStalePolicyReject,
  observeQueueJobLineageOnDequeue,
  snapshotPolicyCounters,
  resetPolicyCounters,
  logPolicyStructured,
  readRuntimePolicyEpoch,
  createRuntimePolicyJobContext,
  mergePolicyContext,
  mergePolicyContextSafe,
  inheritPolicyContext,
  normalizePolicySnapshot,
  POLICY_SYSTEM_SCOPE_TENANT_ID,
  resolveEffectiveSnapshotFromJobPayload,
  enforceQueueWorkerIngress,
  enforceSafeSystemQueueIngress,
  enforceToolExecutionPolicyIngress,
  enforceBrowserCommandPolicyIngress,
  enforceMcpCallPolicyIngress,
  enforceOperatorActionPolicyIngress,
  enforceReplayExecutionPolicyIngress,
  type EvaluatePolicyInput,
  type EvaluatePolicyFlags,
  type EnforcePolicyOptions,
  type PolicyAuditContext,
} from "./policy/index.js";

/** Phase 9F — tenant inbox lifecycle + bounded reconcile projections (`PHASE9F_REPORT.md`). */
export {
  executionLifecyclePayload,
  publishTenantInboxEnvelope,
  tenantInboxRoom,
} from "./realtime/tenant-inbox-publish.js";
export { getRuntimeConsistencyDiagnostics } from "./consistency/runtime-consistency-diagnostics.js";
export { executeRuntimeReconcileJob } from "./jobs/runtime-reconcile-job.js";
/** Phase 10C — repair taxonomy literals + scoped tenant assertions (`PHASE10C_REPORT.md`). */
export {
  RUNTIME_REPAIR_TAXONOMY,
  type RuntimeRepairTaxonomyKind,
  type RepairClassificationTier,
} from "./repair/repair-taxonomy.js";
export { assertRepairRowTenantScoped } from "./repair/repair-tenant-scope.js";
/** Phase 10D — bounded reconcile enqueue cooldown + suppression metrics (`PHASE10D_REPORT.md`). */
export {
  runtimeReconcileEnqueueCooldownMs,
  reconcileEnqueueCooldownRemainingMs,
  recordSuccessfulReconcileEnqueue,
  recordReconcileEnqueueCooldownSuppressed,
} from "./safety/reconcile-enqueue-guard.js";
/** Phase 10E — incident lifecycle taxonomy + bounded mute policy + ops API metrics (`PHASE10E_REPORT.md`). */
export {
  INCIDENT_OPERATIONAL_PHASES,
  type IncidentOperationalPhase,
} from "./incident-governance/incident-operational-phase-taxonomy.js";
export {
  bumpIncidentAckUpsert,
  bumpConsistencyIncidentAckUpsert,
  bumpOperationalMarkMutation,
  bumpIncidentMutedUntilPolicyRejection,
} from "./incident-governance/incident-governance-metrics.js";
export { runtimeIncidentMuteMaxMs, validateIncidentMutedUntilWindow } from "./incident-governance/incident-muted-until-policy.js";
/** Phase 10F — deterministic governance overlays + projection telemetry (`PHASE10F_REPORT.md`). */
export {
  GOVERNANCE_OVERLAY_KINDS,
  type GovernanceOverlayKind,
} from "./governance-projection/governance-overlay-taxonomy.js";
export {
  governanceOverlayPrecedence,
  dominantGovernanceOverlay,
  sortGovernanceOverlaysDescending,
} from "./governance-projection/governance-overlay-order.js";
export {
  governanceOverlaysFromOperationalMarkFlags,
  governanceOverlaySummaryFromOperationalMarkFlags,
  type ExecutionOperationalMarkFlags,
} from "./governance-projection/operational-mark-overlays.js";
export { bumpGovernanceIncidentsProjectionBuild, recordExecutionGovernanceVisibilityHydration } from "./governance-projection/governance-projection-metrics.js";
export {
  hydrateExecutionGovernanceVisibility,
  type GovernanceVisibilityOptionalSignals,
  type HydrateExecutionGovernanceVisibilityInput,
} from "./governance-projection/governance-visibility-hydration.js";
export {
  dominantOverlayByExecutionIdFromMarks,
  dominantOverlayFromOperationalMarkFlags,
  type OperationalMarkRow,
} from "./governance-projection/governance-list-projection.js";
/** Phase 11B — production strict mode + retention helpers (`PHASE11B_REPORT.md`). */
export {
  isProductionStrictMode,
  shouldRejectWorkerStubCompletions,
  preferredGovernedRealtimeWireMode,
  shouldBlockRealtimeTenantMismatch,
  requireMcpPolicyContext,
  forbidControlPlaneGovernanceBypass,
} from "./production/production-strict.js";
export {
  purgeExpiredRuntimeActivityFacts,
  purgeStaleGovernanceAuditEvents,
  purgeStaleExecutionFacts,
  RUNTIME_ACTIVITY_FACT_DEFAULT_TTL_MS,
  RUNTIME_GOVERNANCE_AUDIT_RETENTION_DAYS,
} from "./retention/runtime-retention-policy.js";
export {
  type RuntimeExecutionPhase,
  normalizeBrowserRunStatus,
  normalizeLifecycleEventPhase,
  normalizeMessageDeliveryStatus,
  normalizeQueueJobState,
  normalizeToolInvocationStatus,
  runtimeExecutionPhaseToRowStatus,
} from "./execution/execution-state-normalization.js";
export {
  assertTenantScopeMatch,
  assertTenantScopeOrThrow,
  TenantScopeViolationError,
} from "./tenant/tenant-scope-guard.js";
export {
  collectStorageRetentionSignals,
} from "./retention/storage-retention-signals.js";
export { collectExecutionReliabilitySignals } from "./reliability/execution-reliability-signals.js";
export { collectTenantUsageSignals } from "./commercial/tenant-usage-signals.js";
export {
  resolvePlanEntitlements,
  resolveTenantPlanTier,
} from "./commercial/plan-entitlements.js";
export { buildTenantUsageSummary } from "./commercial/tenant-usage-summary.js";
export { buildTenantSupportDiagnostics } from "./commercial/tenant-support-diagnostics.js";
export {
  deriveCustomerLifecycleStage,
  recommendedNextStepsForLifecycle,
  type CustomerLifecycleStage,
} from "./commercial/tenant-lifecycle.js";
export {
  PlanLimitError,
  TenantOperationalError,
  assertCanCreateAssistant,
  assertCanCreateKnowledgeDocument,
  assertCanAddWorkspaceMember,
  assertCanEnqueueAssistantRun,
  assertBrowserAutomationAllowed,
  assertRuntimeWorkspaceUiAllowed,
  assertTenantOperationalForMutation,
} from "./commercial/plan-enforcement.js";
export {
  syncTenantWorkspaceState,
  getTenantWorkspaceState,
  type OnboardingStepsPersisted,
} from "./commercial/tenant-workspace-state.js";
export {
  observePrismaQueryTiming,
  observePayloadBytes,
  recordExecutionDetailProjectionMs,
  recordExecutionListProjectionMs,
  bumpQueueStaleWaitingSignal,
  enterpriseObservabilityMetricsPartial,
} from "./enterprise/enterprise-observability-metrics.js";
export {
  bumpAssistantRunEnqueueForbidden,
  bumpArtifactAccessDenied,
  enterpriseSecurityMetricsPartial,
} from "./enterprise/enterprise-security-metrics.js";
export {
  executionHasActiveIncidentSuppression,
  governanceMarkIncidentKey,
} from "./governance-projection/incident-suppression-signals.js";
export {
  AssistantRunEnqueueError,
  assertAssistantRunSessionAvailable,
  assistantRunSessionLockJobId,
  enqueueAssistantRunBounded,
  isAssistantRunEnqueueEnabled,
  assertAssistantRunElevatedRole,
  type AssistantRunEnqueueRole,
} from "./assistant-run/assistant-run-enqueue.js";
export {
  bumpAssistantRunEnqueueAccepted,
  bumpAssistantRunEnqueueDeduped,
  bumpAssistantRunEnqueueRejected,
  bumpAssistantRunEnqueueDisabled,
} from "./assistant-run/assistant-run-metrics.js";
export {
  upsertRuntimeActivityFact,
  type RuntimeActivitySeverityWire,
} from "./runtime-activity/runtime-activity-fact-service.js";
export {
  isProductAnalyticsEnabled,
  recordProductEvent,
  recordProductEventFireAndForget,
} from "./product-analytics/record-product-event.js";
export { buildTenantActivationSnapshot, MILESTONE_DEDUPE } from "./product-analytics/tenant-activation-snapshot.js";
export { buildFleetProductAnalyticsSnapshot } from "./product-analytics/fleet-activation-summary.js";
export {
  productSupportMetricsSnapshot,
  bumpRuntimeApiErrorReported,
  bumpWsReconnectReported,
  bumpProductFeedbackSubmitted,
} from "./product-analytics/product-support-metrics.js";
