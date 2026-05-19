import type { PolicyActionDescriptor, PolicyActorType, PolicyJobContext } from "@botmate/shared";
import {
  BrowserCommandActionDescriptorSchema,
  McpCallActionDescriptorSchema,
  OperatorActionDescriptorSchema,
  PolicyEvaluationContextSchema,
  ReplayExecutionActionDescriptorSchema,
  ToolExecutionActionDescriptorSchema,
  type PolicyEvaluationContext,
} from "@botmate/shared";
import { evaluatePolicyWithRuntimeEnv } from "./policy-runtime.js";
import { enforcePolicyOrThrow, type PolicyAuditContext } from "./enforcement-adapter.js";
import { resolveEffectiveSnapshotFromJobPayload } from "./runtime-policy-bundle.js";
import type { PolicyStructuredLogger } from "./policy-metrics.js";
import { bumpReplayPolicyEvaluation } from "./policy-metrics.js";

function runSurface(input: {
  tenantId: string;
  executionId?: string;
  actorId?: string;
  actorType?: PolicyActorType;
  policyJobContext?: PolicyJobContext;
  action: PolicyActionDescriptor;
  logger?: PolicyStructuredLogger;
  audit?: PolicyAuditContext;
  actionKind: string;
  evaluationContextExtras?: Partial<
    Pick<
      PolicyEvaluationContext,
      | "replayMode"
      | "replayReason"
      | "replayOriginExecutionId"
      | "sessionId"
      | "assistantId"
      | "operatorId"
    >
  >;
}): void {
  const snapshot = resolveEffectiveSnapshotFromJobPayload(input.policyJobContext ?? undefined);
  const actorType =
    input.actorType ?? (input.actorId ? "user" : "system");
  const ctx = PolicyEvaluationContextSchema.parse({
    tenantId: input.tenantId,
    actorId: input.actorId,
    actorType,
    executionId: input.executionId,
    policyJobContext: input.policyJobContext ?? undefined,
    ...input.evaluationContextExtras,
  });
  const result = evaluatePolicyWithRuntimeEnv({
    snapshot,
    context: ctx,
    actionDescriptor: input.action,
  });
  enforcePolicyOrThrow(result, {
    logger: input.logger,
    audit: {
      ...input.audit,
      tenantId: input.tenantId,
      executionId: input.executionId,
      actorId: input.actorId,
      actionKind: input.actionKind,
    },
  });
}

export function enforceToolExecutionPolicyIngress(input: {
  tenantId: string;
  toolId: string;
  executionId?: string;
  actorId?: string;
  logger?: PolicyStructuredLogger;
  audit?: PolicyAuditContext;
}): void {
  const action = ToolExecutionActionDescriptorSchema.parse({
    kind: "TOOL_EXECUTION",
    toolId: input.toolId,
  });
  runSurface({
    tenantId: input.tenantId,
    executionId: input.executionId,
    actorId: input.actorId,
    action,
    logger: input.logger,
    audit: input.audit,
    actionKind: `TOOL_EXECUTION:${input.toolId}`,
  });
}

export function enforceBrowserCommandPolicyIngress(input: {
  tenantId: string;
  policyContext?: PolicyJobContext | null;
  executionId?: string;
  actorId?: string;
  commandType?: string;
  logger?: PolicyStructuredLogger;
  audit?: PolicyAuditContext;
}): void {
  const action = BrowserCommandActionDescriptorSchema.parse({
    kind: "BROWSER_COMMAND",
    commandType: input.commandType ?? "browser_run",
  });
  runSurface({
    tenantId: input.tenantId,
    executionId: input.executionId,
    actorId: input.actorId,
    policyJobContext: input.policyContext ?? undefined,
    action,
    logger: input.logger,
    audit: input.audit,
    actionKind: "BROWSER_COMMAND",
  });
}

export function enforceMcpCallPolicyIngress(input: {
  tenantId: string;
  serverId?: string;
  toolId?: string;
  executionId?: string;
  actorId?: string;
  logger?: PolicyStructuredLogger;
  audit?: PolicyAuditContext;
}): void {
  const action = McpCallActionDescriptorSchema.parse({
    kind: "MCP_CALL",
    serverId: input.serverId,
    toolId: input.toolId,
  });
  runSurface({
    tenantId: input.tenantId,
    executionId: input.executionId,
    actorId: input.actorId,
    action,
    logger: input.logger,
    audit: input.audit,
    actionKind: `MCP_CALL:${input.toolId ?? input.serverId ?? "unknown"}`,
  });
}

export function enforceOperatorActionPolicyIngress(input: {
  tenantId: string;
  userId: string;
  actionType: "observe" | "join" | "takeover";
  executionId?: string;
  logger?: PolicyStructuredLogger;
  audit?: PolicyAuditContext;
}): void {
  const action = OperatorActionDescriptorSchema.parse({
    kind: "OPERATOR_ACTION",
    actionType: input.actionType,
  });
  runSurface({
    tenantId: input.tenantId,
    executionId: input.executionId,
    actorId: input.userId,
    actorType: "operator",
    action,
    logger: input.logger,
    audit: input.audit,
    actionKind: `OPERATOR_ACTION:${input.actionType}`,
  });
}

/** Replay governance ingress — executor wiring remains future (`REPLAY_POLICY_MODEL.md`). */
export function enforceReplayExecutionPolicyIngress(input: {
  tenantId: string;
  replayMode: "observe" | "mutate" | "unknown";
  replayReason?: string;
  replayOriginExecutionId?: string;
  executionId?: string;
  actorId?: string;
  policyJobContext?: PolicyJobContext | null;
  logger?: PolicyStructuredLogger;
  audit?: PolicyAuditContext;
}): void {
  bumpReplayPolicyEvaluation();
  const action = ReplayExecutionActionDescriptorSchema.parse({
    kind: "REPLAY_EXECUTION",
    replayMode: input.replayMode,
    replayReason: input.replayReason,
    replayOriginExecutionId: input.replayOriginExecutionId,
  });
  runSurface({
    tenantId: input.tenantId,
    executionId: input.executionId,
    actorId: input.actorId,
    policyJobContext: input.policyJobContext ?? undefined,
    action,
    logger: input.logger,
    audit: input.audit,
    actionKind: `REPLAY_EXECUTION:${input.replayMode}`,
    evaluationContextExtras: {
      replayMode: input.replayMode,
      replayReason: input.replayReason,
      replayOriginExecutionId: input.replayOriginExecutionId,
    },
  });
}
