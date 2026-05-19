import { randomUUID } from "node:crypto";
import { prisma, Prisma } from "@botmate/database";
import {
  evaluateUnifiedRuntimePolicy,
  mergeHttpAllowHosts,
  parseAssistantRuntimeSettings,
  streamEventToSseLines,
  ToolPermissionLayer,
  type StreamEvent,
  type WorkspaceRole,
} from "@botmate/runtime";
import { BROWSER_TOOL_IDS } from "@botmate/browser-runtime";
import type { Role } from "./types.js";
import {
  ALLOWED_TOOLS,
  parseBrowserToolEnvelope,
  parseCreateLeadIntent,
  permissionCheck,
  validateCreateLeadInput,
} from "./tools/chat-tool-shared.js";
import { workspaceToolEngine } from "./tool-engine.js";
import { browserToolCtxAls } from "./browser/browser-tool-context.js";

interface ToolRuntimeResult {
  used: boolean;
  responseText?: string;
  error?: { code: string; message: string };
  idempotentHit?: boolean;
}

async function writeAudit(input: {
  tenantId: string;
  userId: string;
  sessionId?: string;
  toolName: string;
  toolInput: Prisma.InputJsonValue;
  status: "START" | "SUCCESS" | "FAIL";
  success: boolean;
  output?: Prisma.InputJsonValue;
  error?: string;
}): Promise<void> {
  await prisma.toolInvocation.create({
    data: {
      tenantId: input.tenantId,
      userId: input.userId,
      sessionId: input.sessionId,
      toolName: input.toolName,
      input: input.toolInput,
      output: input.output,
      status: input.status,
      success: input.success,
      error: input.error,
    },
  });
}

async function resolveAssistantToolGate(input: {
  tenantId: string;
  sessionAssistantId?: string | null;
}): Promise<{
  permission: ToolPermissionLayer;
  dangerousEnabled: Set<string>;
  timeoutMs: number;
  maxRetries: number;
  browserAssistantEnabled: boolean;
  browserGateSnapshot: {
    browserAllowedHosts: string[];
    browserMaxStepsPerRun: number;
    browserMaxArtifactsPerRun: number;
  };
}> {
  const fallbackCore = [...ALLOWED_TOOLS];
  let fallbackEnabled = [...fallbackCore];
  let enabledList = fallbackEnabled;
  let dangerousEnabled = new Set<string>();
  let timeoutMs = Number(process.env.TOOL_DEFAULT_TIMEOUT_MS ?? `${30_000}`);
  let maxRetries = Number(process.env.TOOL_DEFAULT_MAX_RETRIES ?? `${2}`);
  let browserAssistantEnabled = false;
  let browserGateSnapshot = {
    browserAllowedHosts: [...mergeHttpAllowHosts(process.env.BROWSER_NAVIGATION_ALLOWLIST, [])],
    browserMaxStepsPerRun: 24,
    browserMaxArtifactsPerRun: 10,
  };

  if (input.sessionAssistantId) {
    const row = await prisma.assistant.findFirst({
      where: { id: input.sessionAssistantId, tenantId: input.tenantId, archivedAt: null },
      select: { settings: true },
    });
    if (row?.settings) {
      const st = parseAssistantRuntimeSettings(row.settings);
      fallbackEnabled = [...fallbackCore];
      if (st.browserEnabled && process.env.BROWSER_RUNTIME_ENABLED === "true") {
        fallbackEnabled = [...fallbackEnabled, ...BROWSER_TOOL_IDS];
      }
      enabledList = st.enabledTools.length ? [...st.enabledTools] : fallbackEnabled;
      dangerousEnabled = new Set(st.dangerousToolsEnabled);
      timeoutMs = st.toolTimeoutMs;
      maxRetries = st.toolMaxRetries;

      browserAssistantEnabled = Boolean(st.browserEnabled && process.env.BROWSER_RUNTIME_ENABLED === "true");
      browserGateSnapshot = {
        browserAllowedHosts: [...mergeHttpAllowHosts(process.env.BROWSER_NAVIGATION_ALLOWLIST, st.browserAllowedHosts)],
        browserMaxStepsPerRun: st.browserMaxStepsPerRun,
        browserMaxArtifactsPerRun: st.browserMaxArtifactsPerRun,
      };
    }
  }

  return {
    permission: ToolPermissionLayer.fromAssistantSettings(enabledList),
    dangerousEnabled,
    timeoutMs,
    maxRetries,
    browserAssistantEnabled,
    browserGateSnapshot,
  };
}

function mapWorkspaceRole(role?: Role): WorkspaceRole | undefined {
  return role as WorkspaceRole | undefined;
}

function extractLeadPayload(resultData: unknown): { responseText?: string; idempotentHit?: boolean } {
  if (!resultData || typeof resultData !== "object") return {};
  const d = resultData as Record<string, unknown>;
  const responseText = typeof d.responseText === "string" ? d.responseText : undefined;
  const idempotentHit = typeof d.idempotentHit === "boolean" ? d.idempotentHit : undefined;
  return { responseText, idempotentHit };
}

export async function runTool(input: {
  tenantId: string;
  userId: string;
  assistantId?: string;
  sessionAssistantId?: string | null;
  sessionTenantId: string;
  sessionUserId?: string | null;
  sessionId: string;
  message: string;
  traceId: string;
  role?: Role;
  log: (payload: Record<string, unknown>, message: string) => void;
  emitToolStream?: (sseChunk: string) => void;
}): Promise<ToolRuntimeResult> {
  const unifiedGate = evaluateUnifiedRuntimePolicy({
    tenantId: input.tenantId,
    subsystem: "tool",
  });
  if (!unifiedGate.ok) {
    return {
      used: false,
      error: { code: unifiedGate.code, message: unifiedGate.message },
    };
  }

  const browserEnv = parseBrowserToolEnvelope(input.message);
  if (browserEnv) {
    const toolName = browserEnv.toolId;

    const gate = await resolveAssistantToolGate({
      tenantId: input.tenantId,
      sessionAssistantId: input.sessionAssistantId,
    });

    if (!gate.browserAssistantEnabled) {
      return {
        used: true,
        error: { code: "TOOL_001", message: "Browser automation disabled for this assistant" },
      };
    }

    try {
      gate.permission.assertAllowed(toolName);
    } catch {
      return {
        used: true,
        error: { code: "TOOL_001", message: "Tool is not allowed for this assistant" },
      };
    }

    const permissionError = permissionCheck({
      authTenantId: input.tenantId,
      authUserId: input.userId,
      authAssistantId: input.assistantId,
      sessionTenantId: input.sessionTenantId,
      sessionUserId: input.sessionUserId,
      sessionAssistantId: input.sessionAssistantId,
    });
    if (permissionError) {
      return { used: true, error: permissionError };
    }

    const ctx = {
      tenantId: input.tenantId,
      assistantId: input.sessionAssistantId ?? input.assistantId ?? "__workspace__",
      sessionId: input.sessionId,
      traceId: input.traceId,
      userId: input.userId,
      sessionAssistantId: input.sessionAssistantId ?? null,
      operatorAssistantId: input.assistantId ?? null,
    };

    await writeAudit({
      tenantId: input.tenantId,
      userId: input.userId,
      sessionId: input.sessionId,
      toolName,
      toolInput: browserEnv.args as Prisma.InputJsonValue,
      status: "START",
      success: false,
    });
    input.log({ tool: toolName, status: "start", traceId: input.traceId }, "tool execution start");

    const toolCallId = randomUUID();

    const runner = async () =>
      browserToolCtxAls.run({ gate: gate.browserGateSnapshot, emit: input.emitToolStream }, async () =>
        workspaceToolEngine.run({
          toolId: toolName,
          ctx,
          args: browserEnv.args,
          permission: gate.permission,
          risk: {
            userRole: mapWorkspaceRole(input.role),
            dangerousEnabled: gate.dangerousEnabled,
          },
          options: {
            timeoutMs: gate.timeoutMs,
            maxRetries: gate.maxRetries,
          },
        }),
      );

    try {
      if (input.emitToolStream) {
        const started: StreamEvent = {
          type: "tool_call_started",
          toolCallId,
          toolId: toolName,
          kind: "internal",
        };
        input.emitToolStream(streamEventToSseLines(started));
      }

      const execOutcome = await runner();

      if (input.emitToolStream) {
        const completed: StreamEvent = {
          type: "tool_call_completed",
          toolCallId,
          toolId: toolName,
          ok: Boolean(execOutcome.result.ok),
          latencyMs: execOutcome.latencyMs,
          retries: execOutcome.retries,
        };
        input.emitToolStream(streamEventToSseLines(completed));
      }

      if (!execOutcome.result.ok) {
        await writeAudit({
          tenantId: input.tenantId,
          userId: input.userId,
          sessionId: input.sessionId,
          toolName,
          toolInput: browserEnv.args as Prisma.InputJsonValue,
          status: "FAIL",
          success: false,
          error: execOutcome.result.error?.message ?? "Tool execution failed",
        });
        input.log({ tool: toolName, status: "fail", traceId: input.traceId }, "tool execution failed");
        return {
          used: true,
          error: { code: "TOOL_003", message: execOutcome.result.error?.message ?? "Tool execution failed" },
        };
      }

      await writeAudit({
        tenantId: input.tenantId,
        userId: input.userId,
        sessionId: input.sessionId,
        toolName,
        toolInput: browserEnv.args as Prisma.InputJsonValue,
        status: "SUCCESS",
        success: true,
        output: {
          result: execOutcome.result.data,
          toolLatencyMs: execOutcome.latencyMs,
          toolRetries: execOutcome.retries,
        } satisfies Record<string, unknown> as Prisma.InputJsonValue,
      });
      input.log({ tool: toolName, status: "success", traceId: input.traceId }, "tool execution success");
      return {
        used: true,
        responseText: JSON.stringify(execOutcome.result.data ?? {}),
      };
    } catch (err) {
      if (input.emitToolStream) {
        const failed: StreamEvent = {
          type: "tool_call_failed",
          toolCallId,
          toolId: toolName,
          code: "TOOL_003",
          message: err instanceof Error ? err.message.slice(0, 512) : String(err),
        };
        input.emitToolStream(streamEventToSseLines(failed));
      }

      await writeAudit({
        tenantId: input.tenantId,
        userId: input.userId,
        sessionId: input.sessionId,
        toolName,
        toolInput: browserEnv.args as Prisma.InputJsonValue,
        status: "FAIL",
        success: false,
        error: "Tool execution failed",
      });
      input.log({ tool: toolName, status: "fail", traceId: input.traceId }, "tool execution failed");
      return {
        used: true,
        error: { code: "TOOL_003", message: "Tool execution failed" },
      };
    }
  }

  const parsed = parseCreateLeadIntent(input.message);
  if (!parsed) {
    return { used: false };
  }

  const toolName = "create_lead";
  if (!ALLOWED_TOOLS.has(toolName)) {
    return {
      used: true,
      error: { code: "TOOL_001", message: "Tool is not allowed" },
    };
  }

  const validationError = validateCreateLeadInput(parsed);
  if (validationError) {
    await writeAudit({
      tenantId: input.tenantId,
      userId: input.userId,
      sessionId: input.sessionId,
      toolName,
      toolInput: parsed,
      status: "FAIL",
      success: false,
      error: validationError.message,
    });
    input.log({ tool: toolName, status: "fail", traceId: input.traceId }, "tool execution failed");
    return { used: true, error: validationError };
  }

  const permissionError = permissionCheck({
    authTenantId: input.tenantId,
    authUserId: input.userId,
    authAssistantId: input.assistantId,
    sessionTenantId: input.sessionTenantId,
    sessionUserId: input.sessionUserId,
    sessionAssistantId: input.sessionAssistantId,
  });
  if (permissionError) {
    await writeAudit({
      tenantId: input.tenantId,
      userId: input.userId,
      sessionId: input.sessionId,
      toolName,
      toolInput: parsed,
      status: "FAIL",
      success: false,
      error: permissionError.message,
    });
    input.log({ tool: toolName, status: "fail", traceId: input.traceId }, "tool execution failed");
    return { used: true, error: permissionError };
  }

  const gate = await resolveAssistantToolGate({
    tenantId: input.tenantId,
    sessionAssistantId: input.sessionAssistantId,
  });

  try {
    gate.permission.assertAllowed(toolName);
  } catch {
    await writeAudit({
      tenantId: input.tenantId,
      userId: input.userId,
      sessionId: input.sessionId,
      toolName,
      toolInput: parsed,
      status: "FAIL",
      success: false,
      error: "assistant_tool_scope_denied",
    });
    input.log({ tool: toolName, status: "fail", traceId: input.traceId }, "tool execution failed");
    return {
      used: true,
      error: { code: "TOOL_001", message: "Tool is not allowed for this assistant" },
    };
  }

  const ctx = {
    tenantId: input.tenantId,
    assistantId: input.sessionAssistantId ?? input.assistantId ?? "__workspace__",
    sessionId: input.sessionId,
    traceId: input.traceId,
    userId: input.userId,
    sessionAssistantId: input.sessionAssistantId ?? null,
    operatorAssistantId: input.assistantId ?? null,
  };

  await writeAudit({
    tenantId: input.tenantId,
    userId: input.userId,
    sessionId: input.sessionId,
    toolName,
    toolInput: parsed,
    status: "START",
    success: false,
  });
  input.log({ tool: toolName, status: "start", traceId: input.traceId }, "tool execution start");

  const toolCallId = randomUUID();

  const runner = () =>
    workspaceToolEngine.run({
      toolId: toolName,
      ctx,
      args: parsed,
      permission: gate.permission,
      risk: {
        userRole: mapWorkspaceRole(input.role),
        dangerousEnabled: gate.dangerousEnabled,
      },
      options: {
        timeoutMs: gate.timeoutMs,
        maxRetries: gate.maxRetries,
      },
    });

  try {
    if (input.emitToolStream) {
      const started: StreamEvent = {
        type: "tool_call_started",
        toolCallId,
        toolId: toolName,
        kind: "internal",
      };
      input.emitToolStream(streamEventToSseLines(started));
    }

    const execOutcome = await runner();

    if (input.emitToolStream) {
      const completed: StreamEvent = {
        type: "tool_call_completed",
        toolCallId,
        toolId: toolName,
        ok: Boolean(execOutcome.result.ok),
        latencyMs: execOutcome.latencyMs,
        retries: execOutcome.retries,
      };
      input.emitToolStream(streamEventToSseLines(completed));
    }

    if (!execOutcome.result.ok) {
      await writeAudit({
        tenantId: input.tenantId,
        userId: input.userId,
        sessionId: input.sessionId,
        toolName,
        toolInput: parsed,
        status: "FAIL",
        success: false,
        error: execOutcome.result.error?.message ?? "Tool execution failed",
      });
      input.log({ tool: toolName, status: "fail", traceId: input.traceId }, "tool execution failed");
      return {
        used: true,
        error: { code: "TOOL_003", message: execOutcome.result.error?.message ?? "Tool execution failed" },
      };
    }

    const extracted = extractLeadPayload(execOutcome.result.data);
    await writeAudit({
      tenantId: input.tenantId,
      userId: input.userId,
      sessionId: input.sessionId,
      toolName,
      toolInput: parsed,
      status: "SUCCESS",
      success: true,
      output: {
        responseText: extracted.responseText,
        idempotentHit: extracted.idempotentHit ?? false,
        toolLatencyMs: execOutcome.latencyMs,
        toolRetries: execOutcome.retries,
      } satisfies Record<string, unknown> as Prisma.InputJsonValue,
    });
    input.log({ tool: toolName, status: "success", traceId: input.traceId }, "tool execution success");
    return {
      used: true,
      responseText: extracted.responseText,
      idempotentHit: extracted.idempotentHit ?? false,
    };
  } catch (err) {
    if (input.emitToolStream) {
      const failed: StreamEvent = {
        type: "tool_call_failed",
        toolCallId,
        toolId: toolName,
        code: "TOOL_003",
        message: err instanceof Error ? err.message.slice(0, 512) : String(err),
      };
      input.emitToolStream(streamEventToSseLines(failed));
    }

    await writeAudit({
      tenantId: input.tenantId,
      userId: input.userId,
      sessionId: input.sessionId,
      toolName,
      toolInput: parsed,
      status: "FAIL",
      success: false,
      error: "Tool execution failed",
    });
    input.log({ tool: toolName, status: "fail", traceId: input.traceId }, "tool execution failed");
    return {
      used: true,
      error: { code: "TOOL_003", message: "Tool execution failed" },
    };
  }
}
