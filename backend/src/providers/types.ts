export interface GenerateResponseInput {
  model: string;
  userMessage: string;
  systemPrompt?: string;
}

export interface LlmProviderAdapter {
  generateResponse(input: GenerateResponseInput): Promise<string>;
  streamResponse(input: GenerateResponseInput): AsyncGenerator<string, void, void>;
}
