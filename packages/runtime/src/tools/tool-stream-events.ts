import { randomUUID } from "node:crypto";
import type { StreamEvent } from "../streaming-types.js";
import type { ToolNormalizedResult } from "../tool-runtime.js";
import type { ToolRunMetrics } from "./tool-execution-engine.js";

export async function* streamToolExecutionLifecycle(params: {
  toolCallId?: string;
  toolId: string;
  kind: "internal" | "http" | "mcp" | "async";
  runner: () => Promise<{ result: ToolNormalizedResult } & ToolRunMetrics>;
}): AsyncGenerator<StreamEvent, void, undefined> {
  const toolCallId = params.toolCallId ?? randomUUID();
  yield {
    type: "tool_call_started",
    toolCallId,
    toolId: params.toolId,
    kind: params.kind,
  } satisfies StreamEvent;
  try {
    const out = await params.runner();
    yield {
      type: "tool_call_completed",
      toolCallId,
      toolId: params.toolId,
      ok: Boolean(out.result.ok),
      latencyMs: out.latencyMs,
      retries: out.retries,
    } satisfies StreamEvent;
  } catch (err) {
    yield {
      type: "tool_call_failed",
      toolCallId,
      toolId: params.toolId,
      code: "TOOL_STREAM_FAILED",
      message: err instanceof Error ? err.message.slice(0, 512) : String(err),
    } satisfies StreamEvent;
  }
}
