import { createHash } from "crypto";

export const ALLOWED_TOOLS = new Set(["create_lead"]);

/** Structured browser tool invocation envelope (Phase 5C). Example:
 * {"browserTool":"browser.open","browserArgs":{"url":"https://example.com"}} */
export function parseBrowserToolEnvelope(message: string): { toolId: string; args: unknown } | null {
  const trimmed = message.trim();
  if (!trimmed.startsWith("{")) return null;
  try {
    const o = JSON.parse(trimmed) as Record<string, unknown>;
    const toolId = typeof o.browserTool === "string" ? o.browserTool.trim() : "";
    if (!toolId.startsWith("browser.")) return null;
    return { toolId, args: "browserArgs" in o ? o.browserArgs : {} };
  } catch {
    return null;
  }
}

export const TOOL_TIMEOUT_MS = Number(process.env.TOOL_SYNC_TIMEOUT_MS ?? "8000");

export function parseCreateLeadIntent(message: string): { name: string; contact: string } | null {
  const createLeadMatch = message.match(/^tool:create_lead\s+([^,]+),\s*(.+)$/i);
  if (!createLeadMatch) {
    return null;
  }
  return {
    name: createLeadMatch[1]!.trim(),
    contact: createLeadMatch[2]!.trim(),
  };
}

export function buildIdempotencyKey(input: {
  tenantId: string;
  userId: string;
  sessionId: string;
  toolName: string;
  payload: { name: string; contact: string };
}): string {
  const normalized = JSON.stringify({
    tenantId: input.tenantId,
    userId: input.userId,
    sessionId: input.sessionId,
    toolName: input.toolName,
    payload: {
      name: input.payload.name.trim().toLowerCase(),
      contact: input.payload.contact.trim().toLowerCase(),
    },
  });
  return createHash("sha256").update(normalized).digest("hex");
}

export type ToolValidationError = { code: "TOOL_001" | "TOOL_002" | "TOOL_003"; message: string };

export function validateCreateLeadInput(input: { name: string; contact: string }): ToolValidationError | null {
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

export function permissionCheck(input: {
  authTenantId: string;
  authUserId: string;
  authAssistantId?: string;
  sessionTenantId: string;
  sessionUserId?: string | null;
  sessionAssistantId?: string | null;
}): ToolValidationError | null {
  if (input.authTenantId !== input.sessionTenantId) {
    return { code: "TOOL_002", message: "Cross-tenant tool call is forbidden" };
  }
  if (input.sessionUserId && input.authUserId !== input.sessionUserId) {
    return { code: "TOOL_002", message: "Cross-tenant tool call is forbidden" };
  }
  if (
    input.authAssistantId &&
    input.sessionAssistantId &&
    input.authAssistantId !== input.sessionAssistantId
  ) {
    return { code: "TOOL_002", message: "Assistant scope mismatch" };
  }
  return null;
}

export async function executeWithTimeout<T>(factory: () => Promise<T>, timeoutMs: number): Promise<T> {
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
