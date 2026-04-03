export interface GenerateTextInput {
  prompt: string;
  systemPrompt?: string;
  temperature?: number;
}

export interface EmbedTextsInput {
  texts: string[];
}

export interface GenerateTextResult {
  provider: string;
  model: string;
  text: string;
  raw?: unknown;
}

export interface EmbedTextsResult {
  provider: string;
  model: string;
  embeddings: number[][];
  raw?: unknown;
}

export interface AiProvider {
  getSummary(): {
    provider: string;
    model: string;
    mode: string;
  };
  generateText(input: GenerateTextInput): Promise<GenerateTextResult>;
  embedTexts(input: EmbedTextsInput): Promise<EmbedTextsResult>;
}
