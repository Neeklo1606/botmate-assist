import { decryptIntegrationApiKey, getActiveOpenAiIntegration } from "./integrations";
import { OpenAIAdapter } from "./providers/openai-adapter";
import { LlmProviderAdapter } from "./providers/types";

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
  const text = await input.provider.generateResponse({
    model: selected.model,
    userMessage: input.message,
    systemPrompt: "You are a concise helpful assistant.",
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
  const text = await provider.generateResponse({
    model: selected.model,
    userMessage: input.message,
    systemPrompt: "You are a concise helpful assistant.",
  });
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
  for await (const chunk of provider.streamResponse({
    model: selected.model,
    userMessage: input.message,
    systemPrompt: "You are a concise helpful assistant.",
  })) {
    yield { chunk, model: selected.model };
  }
}
