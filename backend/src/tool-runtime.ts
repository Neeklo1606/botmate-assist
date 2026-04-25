import { state } from "./state";
import { prisma } from "./prisma";
import { Prisma } from "@prisma/client";

type ToolErrorCode = "TOOL_001" | "TOOL_002" | "TOOL_003";

interface ToolRuntimeError {
  code: ToolErrorCode;
  message: string;
}

interface ToolRuntimeResult {
  used: boolean;
  responseText?: string;
  error?: ToolRuntimeError;
  idempotentHit?: boolean;
}

const ALLOWED_TOOLS = new Set(["create_lead"]);
const TOOL_TIMEOUT_MS = 5000;

function parseCreateLeadIntent(message: string): { name: string; contact: string } | null {
  // Explicit intent only: "tool:create_lead Name, Contact"
  const createLeadMatch = message.match(/^tool:create_lead\s+([^,]+),\s*(.+)$/i);
  if (!createLeadMatch) {
    return null;
  }
  return {
    name: createLeadMatch[1].trim(),
    contact: createLeadMatch[2].trim(),
  };
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

function validateCreateLeadInput(input: { name: string; contact: string }): ToolRuntimeError | null {
  if (!input.name || !input.contact) {
    return { code: "TOOL_001", message: "Tool input is invalid" };
  }
  if (input.name.length < 2 || input.name.length > 120) {
    return { code: "TOOL_001", message: "Tool input is invalid" };
  }
  if (input.contact.length < 3 || input.contact.length > 200) {
    return { code: "TOOL_001", message: "Tool input is invalid" };
  }
  return null;
}

function permissionCheck(input: {
  authTenantId: string;
  authUserId: string;
  authAssistantId?: string;
  sessionTenantId: string;
  sessionUserId?: string;
  assistantId?: string;
}): ToolRuntimeError | null {
  if (input.authTenantId !== input.sessionTenantId) {
    return { code: "TOOL_002", message: "Cross-tenant tool call is forbidden" };
  }
  if (input.sessionUserId && input.authUserId !== input.sessionUserId) {
    return { code: "TOOL_002", message: "Cross-tenant tool call is forbidden" };
  }
  if (
    input.authAssistantId &&
    input.assistantId &&
    input.authAssistantId !== input.assistantId
  ) {
    return { code: "TOOL_002", message: "Cross-tenant tool call is forbidden" };
  }
  return null;
}

async function executeWithTimeout<T>(factory: () => Promise<T>, timeoutMs: number): Promise<T> {
  let timer: NodeJS.Timeout | undefined;
  return await Promise.race([
    factory(),
    new Promise<T>((_, reject) => {
      timer = setTimeout(() => {
        reject(new Error("TOOL_TIMEOUT"));
      }, timeoutMs);
    }),
  ]).finally(() => {
    if (timer) {
      clearTimeout(timer);
    }
  });
}

export async function runTool(input: {
  tenantId: string;
  userId: string;
  assistantId?: string;
  sessionTenantId: string;
  sessionUserId?: string;
  sessionId: string;
  message: string;
  traceId: string;
  log: (payload: Record<string, unknown>, message: string) => void;
}): Promise<ToolRuntimeResult> {
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
    assistantId: input.assistantId,
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
  try {
    const result = await executeWithTimeout(async () => {
      const existing = state.leads.find(
        (lead) =>
          lead.tenantId === input.tenantId &&
          lead.sessionId === input.sessionId &&
          lead.name.toLowerCase() === parsed.name.toLowerCase() &&
          lead.contact.toLowerCase() === parsed.contact.toLowerCase(),
      );
      if (existing) {
        return {
          response: `Lead already exists: ${existing.id} (${existing.name}, ${existing.contact})`,
          idempotentHit: true,
        };
      }
      const leadId = `lead_${Date.now()}`;
      state.leads.push({
        id: leadId,
        tenantId: input.tenantId,
        sessionId: input.sessionId,
        name: parsed.name,
        contact: parsed.contact,
        createdAt: new Date().toISOString(),
      });
      return {
        response: `Lead created: ${leadId} (${parsed.name}, ${parsed.contact})`,
        idempotentHit: false,
      };
    }, TOOL_TIMEOUT_MS);
    await writeAudit({
      tenantId: input.tenantId,
      userId: input.userId,
      sessionId: input.sessionId,
      toolName,
      toolInput: parsed,
      status: "SUCCESS",
      success: true,
      output: { responseText: result.response, idempotentHit: result.idempotentHit },
    });
    input.log({ tool: toolName, status: "success", traceId: input.traceId }, "tool execution success");
    return {
      used: true,
      responseText: result.response,
      idempotentHit: result.idempotentHit,
    };
  } catch {
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
