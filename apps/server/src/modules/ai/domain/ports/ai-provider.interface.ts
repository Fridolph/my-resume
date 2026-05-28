export interface GenerateTextInput {
  prompt: string
  systemPrompt?: string
  maxTokens?: number
  reasoningEffort?: 'low' | 'medium' | 'high'
  responseFormat?: {
    type: 'json_object'
  }
  temperature?: number
  thinkingEnabled?: boolean
}

export interface GenerateTextStreamInput extends GenerateTextInput {
  /** 每次收到 token 时回调，用于 SSE 流式推送。 */
  onToken: (token: string) => void
}

export interface GenerateStructuredObjectInput {
  method: 'functionCalling' | 'jsonMode'
  prompt: string
  schema: unknown
  schemaDescription?: string
  schemaName: string
  systemPrompt?: string
  temperature?: number
}

export interface GenerateStructuredObjectStreamInput
  extends GenerateStructuredObjectInput {
  onPartialObject?: (partialObject: unknown) => void
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

export interface GenerateStructuredObjectResult<T = unknown> {
  method: 'functionCalling' | 'jsonMode'
  model: string
  provider: string
  value: T
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
  generateTextStream?(input: GenerateTextStreamInput): Promise<GenerateTextResult>
  generateStructuredObject?(
    input: GenerateStructuredObjectInput,
  ): Promise<GenerateStructuredObjectResult>
  generateStructuredObjectStream?(
    input: GenerateStructuredObjectStreamInput,
  ): Promise<GenerateStructuredObjectResult>
  embedTexts(input: EmbedTextsInput): Promise<EmbedTextsResult>
}
