import type { PolicyEvaluationResult } from "@botmate/shared";
import { JOB_NAMES } from "@botmate/jobs";
import type { PolicyStructuredLogger } from "./policy-metrics.js";
import {
  bumpGovernanceReplayDrift,
  bumpPolicyDeny,
  bumpPolicyEvaluation,
  bumpPolicyFreezeOrQuarantine,
  bumpPolicyWarn,
  bumpQueuePolicyIngressDeny,
  bumpReplayLineageReject,
  bumpStaleAsyncSnapshot,
  bumpStalePolicyReject,
  logPolicyStructured,
} from "./policy-metrics.js";

const ASYNC_STALE_QUEUE_TELEMETRY = new Set<string>([
  JOB_NAMES.TOOLS_ASYNC_EXECUTE,
  JOB_NAMES.KNOWLEDGE_PROCESS,
  JOB_NAMES.EMBEDDINGS_GENERATE,
  JOB_NAMES.BROWSER_FEED_SNAPSHOT,
  JOB_NAMES.NOTIFICATIONS_DISPATCH,
  JOB_NAMES.ASSISTANT_RUN,
]);

function queueJobSuffix(actionKind?: string): string | undefined {
  if (!actionKind?.startsWith("QUEUE_JOB:")) return undefined;
  return actionKind.slice("QUEUE_JOB:".length);
}

export class PolicyEnforcementError extends Error {
  readonly code = "POLICY_ENFORCEMENT";

  constructor(
    message: string,
    readonly result: PolicyEvaluationResult,
  ) {
    super(message);
    this.name = "PolicyEnforcementError";
  }
}

export interface EnforcePolicyOptions {
  logger?: PolicyStructuredLogger;
  /** Phase 8E structured audit dimensions (`POLICY_RUNTIME_OBSERVABILITY.md`). */
  audit?: PolicyAuditContext;
}

export interface PolicyAuditContext {
  tenantId?: string;
  executionId?: string;
  actorId?: string;
  actionKind?: string;
}

/** Fail-closed gate — throws on non-ALLOW except WARN (logged + counted). */
export function enforcePolicyOrThrow(result: PolicyEvaluationResult, opts?: EnforcePolicyOptions): void {
  bumpPolicyEvaluation({ decision: result.decision, reason: result.primaryReason });

  const logger = opts?.logger;
  const audit = opts?.audit ?? {};
  const payloadBase = {
    ...audit,
    snapshotId: result.snapshotId,
    policyDecisionId: result.policyDecisionId,
    reasonCode: result.primaryReason,
    decision: result.decision,
  };

  if (result.decision === "ALLOW") {
    logPolicyStructured(logger, "info", {
      ...payloadBase,
      event: "policy_enforced",
    }, "policy_enforced");
    return;
  }

  if (result.decision === "WARN") {
    bumpPolicyWarn({ reason: result.primaryReason });
    logPolicyStructured(logger, "warn", {
      ...payloadBase,
      event: "policy_warn",
    }, "policy_warn");
    return;
  }

  if (result.decision === "FREEZE" || result.decision === "QUARANTINE") {
    bumpPolicyFreezeOrQuarantine({ decision: result.decision, reason: result.primaryReason });
    logPolicyStructured(logger, "warn", {
      ...payloadBase,
      event: "policy_freeze",
    }, "policy_freeze");
  } else {
    bumpPolicyDeny({ decision: result.decision, reason: result.primaryReason });
    if (audit.actionKind?.startsWith("QUEUE_JOB:")) {
      bumpQueuePolicyIngressDeny();
    }
    if (result.primaryReason === "POLICY_SNAPSHOT_STALE" || result.primaryReason === "POLICY_STALE") {
      bumpStalePolicyReject();
      const qn = queueJobSuffix(audit.actionKind);
      if (qn && ASYNC_STALE_QUEUE_TELEMETRY.has(qn)) bumpStaleAsyncSnapshot();
    }
    if (result.primaryReason === "POLICY_REPLAY_DENIED") {
      bumpReplayLineageReject();
      bumpGovernanceReplayDrift();
      logPolicyStructured(logger, "warn", {
        ...payloadBase,
        event: "replay_lineage_rejected",
        governanceReasonCode: "GOVERNANCE_REPLAY_DRIFT",
        replayClass: "high",
        executionSurfaceType: "replay_eval",
      }, "replay_lineage_rejected");
    }
    logPolicyStructured(logger, "warn", {
      ...payloadBase,
      event: "policy_denied",
    }, "policy_denied");
  }

  throw new PolicyEnforcementError(`policy_${result.decision.toLowerCase()}:${result.primaryReason}`, result);
}
