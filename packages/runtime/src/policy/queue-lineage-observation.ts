import { JOB_NAMES } from "@botmate/jobs";
import {
  bumpAsyncLineageReject,
  bumpExecutionLineageBreak,
  bumpGovernanceLineageDrift,
  bumpOrphanAsyncExecution,
  logPolicyStructured,
  type PolicyStructuredLogger,
} from "./policy-metrics.js";
import { ensureExecutionLineage } from "../control-plane/execution-lineage-helpers.js";

function readAsyncLineageReject(): boolean {
  return process.env.BOTMATE_ASYNC_LINEAGE_REJECT?.trim() === "true";
}

/** Tenant-visible async-ish queues — warn when dequeue lacks correlation spine (`ASYNC_EXECUTION_CONSISTENCY.md`). */
const LINEAGE_WARN_JOB_NAMES = new Set<string>([
  JOB_NAMES.KNOWLEDGE_PROCESS,
  JOB_NAMES.EMBEDDINGS_GENERATE,
  JOB_NAMES.NOTIFICATIONS_DISPATCH,
  JOB_NAMES.ASSISTANT_RUN,
  JOB_NAMES.BROWSER_FEED_SNAPSHOT,
]);

export function observeQueueJobLineageOnDequeue(input: {
  jobName: string;
  payload: Record<string, unknown>;
  logger?: PolicyStructuredLogger;
  governanceSurfaceId?: string;
}): void {
  if (!LINEAGE_WARN_JOB_NAMES.has(input.jobName)) return;
  const { ok, missing, effective } = ensureExecutionLineage(input.payload);
  if (ok) return;

  bumpExecutionLineageBreak();
  bumpOrphanAsyncExecution();
  bumpGovernanceLineageDrift();

  logPolicyStructured(input.logger, "warn", {
    event: "execution_lineage_missing",
    jobName: input.jobName,
    governanceSurfaceId: input.governanceSurfaceId,
    executionSurfaceType: "async_queue",
    tenantId: typeof input.payload.tenantId === "string" ? input.payload.tenantId : undefined,
    missing,
    effective,
    reasonCode: "EXECUTION_LINEAGE_MISSING",
    governanceReasonCode: "GOVERNANCE_LINEAGE_DRIFT",
  }, "execution_lineage_missing");

  if (readAsyncLineageReject()) {
    bumpAsyncLineageReject();
    logPolicyStructured(input.logger, "warn", {
      event: "async_execution_rejected",
      jobName: input.jobName,
      governanceSurfaceId: input.governanceSurfaceId,
      executionSurfaceType: "async_queue",
      tenantId: typeof input.payload.tenantId === "string" ? input.payload.tenantId : undefined,
      reasonCode: "ASYNC_EXECUTION_REJECTED",
      governanceReasonCode: "GOVERNANCE_LINEAGE_DRIFT",
      missing,
    }, "async_execution_rejected");
    throw new Error(`ASYNC_EXECUTION_REJECTED:${input.jobName}:${missing.join(",")}`);
  }
}
