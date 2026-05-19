import type { ChatStreamParams, StreamEvent } from "./streaming-types.js";
import { iterateOpenAiCompatibleChatStream, openAiCompatibleChatStreamRequest } from "./openai-compat-stream.js";

export type ProviderId = "openai" | "openrouter" | "ollama" | "anthropic" | "gemini";

export interface ProviderCredentialBundle {
  openAiApiKey?: string | null;
  openRouterApiKey?: string | null;
  ollamaBaseUrl?: string | null;
  anthropicApiKey?: string | null;
  geminiApiKey?: string | null;
}

async function* streamOpenAiCompatible(params: {
  label: ProviderId;
  url: string;
  apiKey?: string | null;
  headers?: Record<string, string>;
  chat: ChatStreamParams;
}): AsyncGenerator<StreamEvent, void, void> {
  yield { type: "provider_attempt", provider: params.label, model: params.chat.model };

  const response = await openAiCompatibleChatStreamRequest({
    url: params.url,
    apiKey: params.apiKey ?? undefined,
    extraHeaders: params.headers,
    params: params.chat,
  });

  if (!response.ok) {
    const text = await response.text();
    yield {
      type: "provider_failed",
      provider: params.label,
      code: `HTTP_${response.status}`,
      message: text.slice(0, 2048),
    };
    return;
  }

  let chars = 0;
  for await (const delta of iterateOpenAiCompatibleChatStream(response.body)) {
    chars += delta.length;
    yield { type: "token", delta };
  }

  yield { type: "usage", totalTokens: Math.ceil(chars / 4) };
  yield { type: "done", finishReason: "stop" };
}

async function* deferredPlaceholder(provider: ProviderId, reason: string): AsyncGenerator<StreamEvent, void, void> {
  yield {
    type: "provider_failed",
    provider,
    code: "NOT_CONFIGURED",
    message: reason,
  };
}

async function* routeSingleProvider(
  id: ProviderId,
  chat: ChatStreamParams,
  creds: ProviderCredentialBundle,
): AsyncGenerator<StreamEvent, void, void> {
  if (id === "openai") {
    if (!creds.openAiApiKey) {
      yield {
        type: "provider_failed",
        provider: "openai",
        code: "MISSING_CREDENTIALS",
        message: "Missing decrypted OpenAI integration for assistant owner.",
      };
      return;
    }
    yield* streamOpenAiCompatible({
      label: "openai",
      url: "https://api.openai.com/v1/chat/completions",
      apiKey: creds.openAiApiKey,
      chat,
    });
    return;
  }

  if (id === "openrouter") {
    const key = creds.openRouterApiKey ?? process.env.OPENROUTER_API_KEY?.trim();
    if (!key) {
      yield {
        type: "provider_failed",
        provider: "openrouter",
        code: "MISSING_CREDENTIALS",
        message: "OPENROUTER_API_KEY missing.",
      };
      return;
    }
    yield* streamOpenAiCompatible({
      label: "openrouter",
      url: "https://openrouter.ai/api/v1/chat/completions",
      apiKey: key,
      headers: {
        "HTTP-Referer": process.env.OPENROUTER_HTTP_REFERER?.trim() || "https://botmate.local",
        "X-Title": process.env.OPENROUTER_APP_TITLE?.trim() || "Botmate Assist",
      },
      chat,
    });
    return;
  }

  if (id === "ollama") {
    const base = creds.ollamaBaseUrl?.trim() || process.env.OLLAMA_BASE_URL?.trim() || "http://127.0.0.1:11434";
    const url = `${base.replace(/\/$/, "")}/v1/chat/completions`;
    yield* streamOpenAiCompatible({ label: "ollama", url, chat });
    return;
  }

  if (id === "anthropic") {
    const key = creds.anthropicApiKey ?? process.env.ANTHROPIC_API_KEY?.trim();
    if (!key) {
      yield* deferredPlaceholder(
        "anthropic",
        "Anthropic Messages API streaming not enabled in this build (credential absent).",
      );
      return;
    }
    yield* deferredPlaceholder("anthropic", "Anthropic adapter stub until explicit Phase 4B wiring.");
    return;
  }

  if (id === "gemini") {
    const key = creds.geminiApiKey ?? process.env.GEMINI_API_KEY?.trim();
    if (!key) {
      yield* deferredPlaceholder("gemini", "Gemini streaming not enabled (credential absent).");
      return;
    }
    yield* deferredPlaceholder("gemini", "Gemini adapter stub until explicit Phase 4B wiring.");
  }
}

export async function* streamWithProviderFallback(input: {
  chain: ProviderId[];
  chat: ChatStreamParams;
  creds: ProviderCredentialBundle;
}): AsyncIterable<StreamEvent> {
  for (const providerId of input.chain) {
    let finished = false;
    for await (const ev of routeSingleProvider(providerId, input.chat, input.creds)) {
      yield ev;
      if (ev.type === "done") {
        finished = true;
        break;
      }
    }
    if (finished) return;
  }

  yield {
    type: "error",
    code: "MODEL_ROUTER_EXHAUSTED",
    message: "All providers in fallback chain failed or returned no completion.",
  };
}

export function parseFallbackChainEnv(): ProviderId[] {
  const parts =
    process.env.MODEL_FALLBACK_CHAIN?.split(",")
      .map((s) => s.trim())
      .filter(Boolean)
      .map((s) => s.toLowerCase()) ?? [];

  const out: ProviderId[] = [];
  const seen = new Set<string>();
  for (const p of parts) {
    if (!["openai", "openrouter", "ollama", "anthropic", "gemini"].includes(p)) continue;
    if (seen.has(p)) continue;
    seen.add(p);
    out.push(p as ProviderId);
  }
  return out.length ? out : (["openai", "openrouter", "ollama"] as ProviderId[]);
}

export function normalizeProviderHint(raw?: string): ProviderId {
  const p = raw?.trim().toLowerCase();
  if (p === "openrouter" || p === "ollama" || p === "anthropic" || p === "gemini" || p === "openai") {
    return p;
  }
  return "openai";
}
