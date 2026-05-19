import type { StreamEvent } from "./streaming-types.js";

/** Serialize unified stream events into SSE frames (`event:` + `data:` lines). */
export function streamEventToSseLines(ev: StreamEvent): string {
  let eventName = "meta";
  if (ev.type === "token") eventName = "token";
  else if (ev.type === "usage") eventName = "usage";
  else if (ev.type === "done") eventName = "done";
  else if (ev.type === "error") eventName = "error";
  else if (ev.type === "tool_call_started") eventName = "tool_call_started";
  else if (ev.type === "tool_call_delta") eventName = "tool_call_delta";
  else if (ev.type === "tool_call_completed") eventName = "tool_call_completed";
  else if (ev.type === "tool_call_failed") eventName = "tool_call_failed";
  else if (ev.type === "browser_step_started") eventName = "browser_step_started";
  else if (ev.type === "browser_step_completed") eventName = "browser_step_completed";
  else if (ev.type === "browser_snapshot") eventName = "browser_snapshot";
  else if (ev.type === "browser_error") eventName = "browser_error";

  return `event: ${eventName}\ndata: ${JSON.stringify(ev)}\n\n`;
}
