import type { ChatStreamParams } from "./streaming-types.js";

function mergeSignals(a?: AbortSignal, b?: AbortSignal): AbortSignal | undefined {
  const signals = [a, b].filter(Boolean) as AbortSignal[];
  if (signals.length === 0) return undefined;
  if (signals.length === 1) return signals[0];
  const ctrl = new AbortController();
  const forward = () => ctrl.abort();
  for (const s of signals) {
    if (s.aborted) {
      forward();
      return ctrl.signal;
    }
    s.addEventListener("abort", forward, { once: true });
  }
  return ctrl.signal;
}

export async function openAiCompatibleChatStreamRequest(input: {
  url: string;
  apiKey?: string;
  extraHeaders?: Record<string, string>;
  params: ChatStreamParams;
}): Promise<Response> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), input.params.timeoutMs);

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(input.extraHeaders ?? {}),
  };
  if (input.apiKey) {
    headers.Authorization = `Bearer ${input.apiKey}`;
  }

  const mergedSignal = mergeSignals(input.params.signal, controller.signal);

  try {
    return await fetch(input.url, {
      method: "POST",
      headers,
      body: JSON.stringify({
        model: input.params.model,
        stream: true,
        max_tokens: input.params.maxTokens,
        temperature: input.params.temperature,
        messages: input.params.messages.map((m) => ({ role: m.role, content: m.content })),
      }),
      signal: mergedSignal,
    });
  } finally {
    clearTimeout(timer);
  }
}

export async function* iterateOpenAiCompatibleChatStream(
  responseBody: ReadableStream<Uint8Array> | null,
): AsyncGenerator<string, void, void> {
  if (!responseBody) return;

  const decoder = new TextDecoder();
  let buffer = "";

  for await (const chunk of responseBody as AsyncIterable<Uint8Array>) {
    buffer += decoder.decode(chunk, { stream: true });
    const lines = buffer.split("\n");
    buffer = lines.pop() ?? "";

    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed.startsWith("data:")) continue;
      const payload = trimmed.slice("data:".length).trim();
      if (payload === "[DONE]") return;
      try {
        const parsed = JSON.parse(payload) as {
          choices?: Array<{ delta?: { content?: string } }>;
        };
        const piece = parsed.choices?.[0]?.delta?.content;
        if (piece) yield piece;
      } catch {
        /* ignore partial JSON */
      }
    }
  }
}
