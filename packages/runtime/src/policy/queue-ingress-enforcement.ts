import {
  PolicyEvaluationContextSchema,
  QueueJobActionDescriptorSchema,
  SafeSystemActionDescriptorSchema,
  type PolicyJobContext,
} from "@botmate/shared";
import { evaluatePolicyWithRuntimeEnv } from "./policy-runtime.js";
import { enforcePolicyOrThrow, type PolicyAuditContext } from "./enforcement-adapter.js";
import {
  POLICY_SYSTEM_SCOPE_TENANT_ID,
  resolveEffectiveSnapshotFromJobPayload,
} from "./runtime-policy-bundle.js";
import {
  bumpAsyncSurfacePolicyEvaluation,
  type PolicyStructuredLogger,
} from "./policy-metrics.js";
import { validateAsyncExecution } from "../governance/index.js";

export function enforceQueueWorkerIngress(input: {
  jobName: string;
  tenantId: string;
  policyContext?: PolicyJobContext | null;
  executionId?: string;
  actorId?: string;
  logger?: PolicyStructuredLogger;
  audit?: PolicyAuditContext;
  /** Phase 8F — dequeue symmetry telemetry for async BullMQ surfaces (`POLICY_OBSERVABILITY_EXPANSION.md`). */
  asyncSurfaceTelemetry?: boolean;
  /** Phase 8G — parsed job row for lineage observation (`EXECUTION_LINEAGE_ARCHITECTURE.md`). */
  dequeuePayloadRecord?: Record<string, unknown>;
}): void {
  if (input.dequeuePayloadRecord) {
    validateAsyncExecution({
      jobName: input.jobName,
      payload: input.dequeuePayloadRecord,
      logger: input.logger,
    });
  }
  if (input.asyncSurfaceTelemetry) bumpAsyncSurfacePolicyEvaluation();
  const snapshot = resolveEffectiveSnapshotFromJobPayload(input.policyContext ?? undefined);
  const ctx = PolicyEvaluationContextSchema.parse({
    tenantId: input.tenantId,
    actorId: input.actorId,
    actorType: "system",
    executionId: input.executionId,
    policyJobContext: input.policyContext ?? undefined,
  });
  const action = QueueJobActionDescriptorSchema.parse({
    kind: "QUEUE_JOB",
    jobName: input.jobName,
  });
  const result = evaluatePolicyWithRuntimeEnv({
    snapshot,
    context: ctx,
    actionDescriptor: action,
  });
  enforcePolicyOrThrow(result, {
    logger: input.logger,
    audit: {
      ...input.audit,
      tenantId: input.tenantId,
      executionId: input.executionId,
      actorId: input.actorId,
      actionKind: `QUEUE_JOB:${input.jobName}`,
    },
  });
}

/** Hygiene / reclaim queues — **`SAFE_SYSTEM_ACTION`** bypasses tenant freeze (`evaluate-policy.ts`). */
export function enforceSafeSystemQueueIngress(input: {
  jobName: string;
  tenantId?: string | null;
  policyContext?: PolicyJobContext | null;
  surface: "browser.cleanup" | "artifact.cleanup";
  executionId?: string;
  actorId?: string;
  logger?: PolicyStructuredLogger;
  audit?: PolicyAuditContext;
}): void {
  bumpAsyncSurfacePolicyEvaluation();
  const tenantId = input.tenantId?.trim() ? input.tenantId.trim() : POLICY_SYSTEM_SCOPE_TENANT_ID;
  const snapshot = resolveEffectiveSnapshotFromJobPayload(input.policyContext ?? undefined);
  const ctx = PolicyEvaluationContextSchema.parse({
    tenantId,
    actorId: input.actorId,
    actorType: "system",
    executionId: input.executionId,
    policyJobContext: input.policyContext ?? undefined,
  });
  const action = SafeSystemActionDescriptorSchema.parse({
    kind: "SAFE_SYSTEM_ACTION",
    surface: input.surface,
  });
  const result = evaluatePolicyWithRuntimeEnv({
    snapshot,
    context: ctx,
    actionDescriptor: action,
  });
  enforcePolicyOrThrow(result, {
    logger: input.logger,
    audit: {
      ...input.audit,
      tenantId,
      executionId: input.executionId,
      actorId: input.actorId,
      actionKind: `SAFE_SYSTEM_ACTION:${input.surface}:${input.jobName}`,
    },
  });
}
