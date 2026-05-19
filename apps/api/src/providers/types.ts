export interface GenerateResponseInput {
  model: string;
  userMessage: string;
  systemPrompt?: string;
  timeoutMs?: number;
  maxTokens?: number;
}

export interface LlmProviderAdapter {
  generateResponse(input: GenerateResponseInput): Promise<string>;
  streamResponse(input: GenerateResponseInput): AsyncGenerator<string, void, void>;
}
