export interface GenerateTextInput {
  prompt: string;
  systemPrompt?: string;
  temperature?: number;
}

export interface GenerateTextResult {
  provider: string;
  model: string;
  text: string;
  raw?: unknown;
}

export interface AiProvider {
  getSummary(): {
    provider: string;
    model: string;
    mode: string;
  };
  generateText(input: GenerateTextInput): Promise<GenerateTextResult>;
}
