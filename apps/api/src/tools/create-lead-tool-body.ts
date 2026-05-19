import type { ToolExecutionContext } from "@botmate/runtime";
import { normalizeToolResult, type ToolNormalizedResult } from "@botmate/runtime";
import { createLeadFromTool } from "../leads/lead-service.js";
import {
  buildIdempotencyKey,
  executeWithTimeout,
  TOOL_TIMEOUT_MS,
  validateCreateLeadInput,
} from "./chat-tool-shared.js";

export async function executeCreateLeadToolBody(
  ctx: ToolExecutionContext,
  parsed: { name: string; contact: string },
): Promise<ToolNormalizedResult> {
  const validationError = validateCreateLeadInput(parsed);
  if (validationError) {
    return { ok: false, error: { code: validationError.code, message: validationError.message } };
  }

  const userId = ctx.userId ?? "";
  if (!userId) {
    return { ok: false, error: { code: "TOOL_002", message: "User context missing for tool execution" } };
  }

  try {
    const idempotencyKey = buildIdempotencyKey({
      tenantId: ctx.tenantId,
      userId,
      sessionId: ctx.sessionId,
      toolName: "create_lead",
      payload: parsed,
    });
    const result = await executeWithTimeout(async () => {
      const outcome = await createLeadFromTool({
        tenantId: ctx.tenantId,
        sessionId: ctx.sessionId,
        assistantId: ctx.sessionAssistantId ?? undefined,
        name: parsed.name,
        contact: parsed.contact,
        idempotencyKey,
      });
      if (outcome.idempotentHit) {
        return {
          response: `Lead already exists: ${outcome.leadId} (${parsed.name}, ${parsed.contact})`,
          idempotentHit: true,
        };
      }
      return {
        response: `Lead created: ${outcome.leadId} (${parsed.name}, ${parsed.contact})`,
        idempotentHit: false,
      };
    }, TOOL_TIMEOUT_MS);

    void ctx.traceId;
    return normalizeToolResult({
      ok: true,
      data: { responseText: result.response, idempotentHit: result.idempotentHit },
    });
  } catch {
    return { ok: false, error: { code: "TOOL_003", message: "Tool execution failed" } };
  }
}
