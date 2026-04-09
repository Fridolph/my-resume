export interface GenerateTextInput {
  prompt: string
  systemPrompt?: string
  temperature?: number
}

export interface EmbedTextsInput {
  texts: string[]
}

export interface GenerateTextResult {
  provider: string
  model: string
  text: string
  raw?: unknown
}

export interface EmbedTextsResult {
  provider: string
  model: string
  embeddings: number[][]
  raw?: unknown
}

export interface AiProviderSummary {
  provider: string
  model: string
  mode: string
  chatModel?: string
  embeddingModel?: string
}

export interface AiProvider {
  getSummary(): AiProviderSummary
  generateText(input: GenerateTextInput): Promise<GenerateTextResult>
  embedTexts(input: EmbedTextsInput): Promise<EmbedTextsResult>
}
