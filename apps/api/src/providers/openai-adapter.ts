import { GenerateResponseInput, LlmProviderAdapter } from "./types";

const OPENAI_API_URL = "https://api.openai.com/v1/chat/completions";
const DEFAULT_TIMEOUT_MS = 12000;
const DEFAULT_MAX_TOKENS = 700;

export class OpenAIAdapter implements LlmProviderAdapter {
  private readonly apiKey: string;

  constructor(apiKey: string) {
    if (!apiKey) {
      throw new Error("OPENAI_API_KEY is required");
    }
    this.apiKey = apiKey;
  }

  async generateResponse(input: GenerateResponseInput): Promise<string> {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), input.timeoutMs ?? DEFAULT_TIMEOUT_MS);
    const response = await fetch(OPENAI_API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${this.apiKey}`,
      },
      body: JSON.stringify({
        model: input.model,
        max_tokens: input.maxTokens ?? DEFAULT_MAX_TOKENS,
        messages: [
          ...(input.systemPrompt ? [{ role: "system", content: input.systemPrompt }] : []),
          { role: "user", content: input.userMessage },
        ],
      }),
      signal: controller.signal,
    }).finally(() => {
      clearTimeout(timer);
    });

    if (!response.ok) {
      const text = await response.text();
      throw new Error(`OpenAI generate failed (${response.status}): ${text}`);
    }

    const json = (await response.json()) as {
      choices?: Array<{ message?: { content?: string } }>;
    };
    return json.choices?.[0]?.message?.content?.trim() || "";
  }

  async *streamResponse(input: GenerateResponseInput): AsyncGenerator<string, void, void> {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), input.timeoutMs ?? DEFAULT_TIMEOUT_MS);
    const response = await fetch(OPENAI_API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${this.apiKey}`,
      },
      body: JSON.stringify({
        model: input.model,
        stream: true,
        max_tokens: input.maxTokens ?? DEFAULT_MAX_TOKENS,
        messages: [
          ...(input.systemPrompt ? [{ role: "system", content: input.systemPrompt }] : []),
          { role: "user", content: input.userMessage },
        ],
      }),
      signal: controller.signal,
    }).finally(() => {
      clearTimeout(timer);
    });

    if (!response.ok || !response.body) {
      const text = await response.text();
      throw new Error(`OpenAI stream failed (${response.status}): ${text}`);
    }

    const decoder = new TextDecoder();
    let buffer = "";

    for await (const chunk of response.body as unknown as AsyncIterable<Uint8Array>) {
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
          // Ignore partial JSON lines.
        }
      }
    }
  }
}
