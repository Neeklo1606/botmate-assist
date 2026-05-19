import { decryptIntegrationApiKey, getActiveOpenAiIntegration } from "./integrations";
import { OpenAIAdapter } from "./providers/openai-adapter";
import { LlmProviderAdapter } from "./providers/types";

const MAX_INPUT_TOKENS_APPROX = 3500;
const REQUEST_TIMEOUT_MS = 12000;
const REQUEST_MAX_TOKENS = 700;
const BREAKER_FAILURE_THRESHOLD = 3;
const BREAKER_COOLDOWN_MS = 30000;

const breakerState = {
  openai: {
    failures: 0,
    openedUntil: 0,
  },
};

function estimateTokens(text: string): number {
  return Math.ceil(text.length / 4);
}

function checkCostProtection(message: string): void {
  if (estimateTokens(message) > MAX_INPUT_TOKENS_APPROX) {
    throw new Error("COST_001");
  }
}

function beforeProviderCall(provider: "openai"): void {
  const now = Date.now();
  const state = breakerState[provider];
  if (state.openedUntil > now) {
    throw new Error("PROVIDER_003");
  }
}

function onProviderSuccess(provider: "openai"): void {
  const state = breakerState[provider];
  state.failures = 0;
  state.openedUntil = 0;
}

function onProviderFailure(provider: "openai"): void {
  const state = breakerState[provider];
  state.failures += 1;
  if (state.failures >= BREAKER_FAILURE_THRESHOLD) {
    state.openedUntil = Date.now() + BREAKER_COOLDOWN_MS;
  }
}

export function routeModel(input: { message: string; toolRequired: boolean }) {
  if (input.toolRequired) {
    return { provider: "openai", model: "gpt-4o-mini" };
  }
  if (input.message.length > 600) {
    return { provider: "openai", model: "gpt-4.1-mini" };
  }
  return { provider: "openai", model: "gpt-4o-mini" };
}

export async function generateWithModel(input: {
  message: string;
  toolRequired: boolean;
  provider: LlmProviderAdapter;
}) {
  const selected = routeModel({ message: input.message, toolRequired: input.toolRequired });
  checkCostProtection(input.message);
  const text = await input.provider.generateResponse({
    model: selected.model,
    userMessage: input.message,
    systemPrompt: "You are a concise helpful assistant.",
    timeoutMs: REQUEST_TIMEOUT_MS,
    maxTokens: REQUEST_MAX_TOKENS,
  });
  return { selected, text };
}

export async function generateWithUserIntegration(input: {
  userId: string;
  message: string;
  toolRequired: boolean;
}) {
  const selected = routeModel({ message: input.message, toolRequired: input.toolRequired });
  const integration = await getActiveOpenAiIntegration(input.userId);
  if (!integration) {
    return {
      selected,
      text: "",
      integrationMissing: true as const,
    };
  }

  const apiKey = decryptIntegrationApiKey(integration);
  const provider = new OpenAIAdapter(apiKey);
  checkCostProtection(input.message);
  beforeProviderCall("openai");
  let text = "";
  try {
    text = await provider.generateResponse({
      model: selected.model,
      userMessage: input.message,
      systemPrompt: "You are a concise helpful assistant.",
      timeoutMs: REQUEST_TIMEOUT_MS,
      maxTokens: REQUEST_MAX_TOKENS,
    });
    onProviderSuccess("openai");
  } catch (error) {
    onProviderFailure("openai");
    throw error;
  }
  return { selected, text, integrationMissing: false as const };
}

export async function* streamWithUserIntegration(input: {
  userId: string;
  message: string;
  toolRequired: boolean;
}): AsyncGenerator<{ chunk: string; model: string }, void, void> {
  const selected = routeModel({ message: input.message, toolRequired: input.toolRequired });
  const integration = await getActiveOpenAiIntegration(input.userId);
  if (!integration) {
    throw new Error("INTEGRATION_001");
  }

  const apiKey = decryptIntegrationApiKey(integration);
  const provider = new OpenAIAdapter(apiKey);
  checkCostProtection(input.message);
  beforeProviderCall("openai");
  try {
    for await (const chunk of provider.streamResponse({
      model: selected.model,
      userMessage: input.message,
      systemPrompt: "You are a concise helpful assistant.",
      timeoutMs: REQUEST_TIMEOUT_MS,
      maxTokens: REQUEST_MAX_TOKENS,
    })) {
      yield { chunk, model: selected.model };
    }
    onProviderSuccess("openai");
  } catch (error) {
    onProviderFailure("openai");
    throw error;
  }
}
