/** Unified streaming vocabulary — SSE bridge maps these to named events (`STREAMING_RUNTIME.md`). */

export type StreamEvent =
  | { type: "token"; delta: string }
  | {
      type: "usage";
      promptTokens?: number;
      completionTokens?: number;
      totalTokens?: number;
    }
  | { type: "provider_attempt"; provider: string; model: string }
  | { type: "provider_failed"; provider: string; code: string; message: string }
  | { type: "done"; finishReason: string }
  | { type: "error"; code: string; message: string }
  | {
      type: "tool_call_started";
      toolCallId: string;
      toolId: string;
      kind: "internal" | "http" | "mcp" | "async";
    }
  | { type: "tool_call_delta"; toolCallId: string; delta: string }
  | {
      type: "tool_call_completed";
      toolCallId: string;
      toolId: string;
      ok: boolean;
      latencyMs: number;
      retries: number;
    }
  | {
      type: "tool_call_failed";
      toolCallId: string;
      toolId: string;
      code: string;
      message: string;
      attempt?: number;
    }
  | {
      type: "browser_step_started";
      browserSessionId: string;
      browserRunId: string;
      stepIndex: number;
      kind: string;
    }
  | {
      type: "browser_step_completed";
      browserSessionId: string;
      browserRunId: string;
      stepIndex: number;
      kind: string;
    }
  | {
      type: "browser_snapshot";
      browserSessionId: string;
      browserRunId: string;
      artifactId: string;
      kind: string;
    }
  | {
      type: "browser_error";
      browserSessionId: string;
      browserRunId: string;
      code: string;
      message: string;
    };

export type ChatRole = "system" | "user" | "assistant";

export interface ChatMessage {
  role: ChatRole;
  content: string;
}

export interface ChatStreamParams {
  model: string;
  messages: ChatMessage[];
  maxTokens: number;
  timeoutMs: number;
  signal?: AbortSignal;
  temperature?: number;
}
