import { ensureExecutionLineage } from "../control-plane/execution-lineage-helpers.js";
import { observeRealtimeEnvelopeGovernance } from "../realtime/envelope-governance.js";
import {
  bumpGovernanceSurfaceMissing,
  bumpGovernanceUnifiedObservation,
  logPolicyStructured,
  type PolicyStructuredLogger,
} from "../policy/policy-metrics.js";
import { observeQueueJobLineageOnDequeue } from "../policy/queue-lineage-observation.js";
import { governanceSurfaceIdForJobName, resolveGovernanceSurface } from "./execution-governance-registry.js";
import type { ExecutionGovernanceSurfaceDescriptor } from "./execution-governance-registry.js";

export interface ExecutionGovernanceEvaluationResult {
  surface?: ExecutionGovernanceSurfaceDescriptor;
  lineage?: ReturnType<typeof ensureExecutionLineage>;
  governanceSurfaceMissing: boolean;
}

/**
 * Lightweight evaluation — registry lookup + optional lineage extraction (`GOVERNANCE_CONSOLIDATION.md`).
 * Intended for incremental adoption at hot paths; does not enforce policy decisions.
 */
export function evaluateExecutionGovernance(input: {
  governanceSurfaceId?: string;
  payload?: Record<string, unknown>;
  logger?: PolicyStructuredLogger;
}): ExecutionGovernanceEvaluationResult {
  let governanceSurfaceMissing = false;
  let surface: ExecutionGovernanceSurfaceDescriptor | undefined;

  if (input.governanceSurfaceId) {
    surface = resolveGovernanceSurface(input.governanceSurfaceId);
    if (!surface) {
      governanceSurfaceMissing = true;
      bumpGovernanceSurfaceMissing();
      logPolicyStructured(input.logger, "warn", {
        event: "governance_surface_missing",
        governanceSurfaceId: input.governanceSurfaceId,
        governanceReasonCode: "GOVERNANCE_SURFACE_MISSING",
      }, "governance_surface_missing");
    }
  }

  const lineage = input.payload ? ensureExecutionLineage(input.payload) : undefined;

  return { surface, lineage, governanceSurfaceMissing };
}

/** Unified governance observation envelope — opt-in sparse callers (`EXECUTION_OBSERVABILITY_NORMALIZATION.md`). */
export function observeExecutionGovernance(
  logger: PolicyStructuredLogger | undefined,
  meta: Record<string, unknown>,
): void {
  bumpGovernanceUnifiedObservation();
  logPolicyStructured(logger, "info", { event: "governance_observation", ...meta }, "governance_observation");
}

export function validateExecutionLineage(payload: Record<string, unknown>): ReturnType<typeof ensureExecutionLineage> {
  return ensureExecutionLineage(payload);
}

export function validateRealtimeEnvelope(
  input: Parameters<typeof observeRealtimeEnvelopeGovernance>[0],
): boolean {
  observeRealtimeEnvelopeGovernance(input);
  return input.envelopeTenantId.trim() === input.publishTenantId.trim();
}

/** Delegates to dequeue lineage observer with **`governanceSurfaceId`** derived from **`job.name`**. */
export function validateAsyncExecution(input: {
  jobName: string;
  payload: Record<string, unknown>;
  logger?: PolicyStructuredLogger;
}): void {
  observeQueueJobLineageOnDequeue({
    jobName: input.jobName,
    payload: input.payload,
    logger: input.logger,
    governanceSurfaceId: governanceSurfaceIdForJobName(input.jobName),
  });
}
