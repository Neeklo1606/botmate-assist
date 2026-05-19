import { createHash } from "node:crypto";
import { JOB_NAMES } from "@botmate/jobs";
import {
  EffectivePolicySnapshotSchema,
  PolicyEvaluationContextSchema,
  PolicyActionDescriptorSchema,
  PolicyEvaluationResultSchema,
  type EffectivePolicySnapshot,
  type PolicyEvaluationContext,
  type PolicyActionDescriptor,
  type PolicyEvaluationResult,
  type PolicyReasonCode,
} from "@botmate/shared";
import { stableCanonicalJson } from "./canonical-json.js";
import type { EvaluatePolicyFlags, EvaluatePolicyInput } from "./policy-types.js";

/** Jobs where strict optional `BOTMATE_POLICY_REQUIRE_JOB_CONTEXT=true` demands propagated `policyJobContext`. Hygiene queues intentionally excluded. */
const JOB_CONTEXT_REQUIRED_WHEN_STRICT = new Set<string>([
  JOB_NAMES.ASSISTANT_RUN,
  JOB_NAMES.NOTIFICATIONS_DISPATCH,
  JOB_NAMES.BROWSER_RUN,
  JOB_NAMES.TOOLS_ASYNC_EXECUTE,
  JOB_NAMES.KNOWLEDGE_PROCESS,
  JOB_NAMES.EMBEDDINGS_GENERATE,
  JOB_NAMES.BROWSER_FEED_SNAPSHOT,
]);

function riskyActionKind(kind: PolicyActionDescriptor["kind"]): boolean {
  return (
    kind === "TOOL_EXECUTION" ||
    kind === "BROWSER_COMMAND" ||
    kind === "OPERATOR_ACTION" ||
    kind === "REPLAY_EXECUTION" ||
    kind === "MCP_CALL" ||
    kind === "ARTIFACT_ACCESS"
  );
}

function decisionId(
  snapshot: EffectivePolicySnapshot,
  context: PolicyEvaluationContext,
  action: PolicyActionDescriptor,
  primaryReason: PolicyReasonCode,
  decision: PolicyEvaluationResult["decision"],
): string {
  const basis = stableCanonicalJson({
    snapshotId: snapshot.snapshotId,
    snapshotHash: snapshot.snapshotHash,
    freezeGeneration: snapshot.freezeGeneration,
    policyEngineVersion: snapshot.policyEngineVersion,
    tenantId: context.tenantId,
    actorId: context.actorId ?? null,
    actorType: context.actorType ?? null,
    executionId: context.executionId ?? null,
    replayMode: context.replayMode ?? null,
    replayReason: context.replayReason ?? null,
    replayOriginExecutionId: context.replayOriginExecutionId ?? null,
    policyJobContext: context.policyJobContext ?? null,
    action,
    decision,
    primaryReason,
  });
  return createHash("sha256").update(basis, "utf8").digest("hex").slice(0, 32);
}

function readRuntimeDomain(snapshot: EffectivePolicySnapshot): Record<string, unknown> {
  const raw = snapshot.domains.runtime;
  return raw !== null && typeof raw === "object" && !Array.isArray(raw) ? { ...raw } : {};
}

/**
 * Pure deterministic evaluator — no I/O.
 * Same `(snapshot, context, actionDescriptor, flags)` ⇒ same decision + `policyDecisionId`.
 */
export function evaluatePolicy(input: EvaluatePolicyInput): PolicyEvaluationResult {
  const snapshot = EffectivePolicySnapshotSchema.parse(input.snapshot);
  const context = PolicyEvaluationContextSchema.parse(input.context);
  const actionDescriptor = PolicyActionDescriptorSchema.parse(input.actionDescriptor);
  const flags: EvaluatePolicyFlags = input.flags ?? {};

  const finish = (
    decision: PolicyEvaluationResult["decision"],
    primaryReason: PolicyReasonCode,
    secondaryReasons?: PolicyReasonCode[],
  ): PolicyEvaluationResult =>
    PolicyEvaluationResultSchema.parse({
      decision,
      primaryReason,
      secondaryReasons,
      snapshotId: snapshot.snapshotId,
      snapshotHash: snapshot.snapshotHash,
      evaluationMs: 0,
      policyDecisionId: decisionId(snapshot, context, actionDescriptor, primaryReason, decision),
    });

  if (flags.policyRuntimeDisabled) {
    return finish("HARD_DENY", "POLICY_RUNTIME_DISABLED");
  }

  if (context.policyJobContext) {
    const pj = context.policyJobContext;
    if (pj.snapshotId !== snapshot.snapshotId || pj.snapshotHash !== snapshot.snapshotHash) {
      return finish("HARD_DENY", "POLICY_SNAPSHOT_STALE");
    }
    if (pj.freezeGeneration !== snapshot.freezeGeneration) {
      return finish("HARD_DENY", "POLICY_SNAPSHOT_STALE");
    }
  }

  if (
    flags.requireJobPolicyContext &&
    actionDescriptor.kind === "QUEUE_JOB" &&
    JOB_CONTEXT_REQUIRED_WHEN_STRICT.has(actionDescriptor.jobName) &&
    !context.policyJobContext
  ) {
    return finish("HARD_DENY", "POLICY_CONTEXT_MISSING");
  }

  if (actionDescriptor.kind === "SAFE_SYSTEM_ACTION") {
    const rtEarly = readRuntimeDomain(snapshot);
    if (rtEarly.systemCleanupDenied === true) {
      return finish("HARD_DENY", "RESOURCE_LIMIT");
    }
    return finish("ALLOW", "POLICY_OK");
  }

  const rt = readRuntimeDomain(snapshot);
  const tenantFrozen = rt.tenantFrozen === true;
  const tenantQuarantined = rt.tenantQuarantined === true;
  const resourceBlocked = rt.resourceBlocked === true;

  if (tenantFrozen) {
    return finish("FREEZE", "TENANT_FROZEN");
  }
  if (tenantQuarantined) {
    return finish("QUARANTINE", "TENANT_QUARANTINED");
  }
  if (resourceBlocked) {
    return finish("SOFT_DENY", "RESOURCE_LIMIT");
  }

  const domainKeys = Object.keys(snapshot.domains ?? {});
  if (
    flags.strictUnknownDomains &&
    domainKeys.length === 0 &&
    riskyActionKind(actionDescriptor.kind)
  ) {
    return finish("HARD_DENY", "UNKNOWN_POLICY");
  }

  if (actionDescriptor.kind === "TOOL_EXECUTION" && rt.toolDenied === true) {
    return finish("HARD_DENY", "TOOL_DENIED");
  }
  if (actionDescriptor.kind === "BROWSER_COMMAND" && rt.browserDenied === true) {
    return finish("HARD_DENY", "BROWSER_DENIED");
  }
  if (actionDescriptor.kind === "OPERATOR_ACTION" && rt.operatorDenied === true) {
    return finish("HARD_DENY", "OPERATOR_DENIED");
  }
  if (actionDescriptor.kind === "REPLAY_EXECUTION") {
    if (rt.replayDenied === true) {
      return finish("HARD_DENY", "POLICY_REPLAY_DENIED");
    }
    if (actionDescriptor.replayMode === "mutate" && rt.replayMutationsDenied === true) {
      return finish("HARD_DENY", "POLICY_REPLAY_DENIED");
    }
  }
  if (actionDescriptor.kind === "MCP_CALL" && rt.mcpDenied === true) {
    return finish("HARD_DENY", "TOOL_DENIED");
  }

  if (actionDescriptor.kind === "QUEUE_JOB") {
    const softWarn = rt.queueWarn === true;
    if (softWarn) {
      return finish("WARN", "POLICY_OK");
    }
  }

  return finish("ALLOW", "POLICY_OK");
}
