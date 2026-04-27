import { AiRuntimeConfig } from '../config/ai-config'
import {
  AiProvider,
  EmbedTextsInput,
  EmbedTextsResult,
  GenerateTextInput,
  GenerateTextResult,
} from '../../domain/ports/ai-provider.interface'

function buildMockEmbedding(text: string, dimensions = 24): number[] {
  const vector = Array.from({ length: dimensions }, () => 0)
  const normalized = text.trim().toLowerCase()

  for (let index = 0; index < normalized.length; index += 1) {
    const codePoint = normalized.codePointAt(index) ?? 0
    const bucket = (codePoint + index) % dimensions

    vector[bucket] += 1 + (codePoint % 17) / 100
  }

  const magnitude = Math.sqrt(vector.reduce((sum, item) => sum + item * item, 0))

  if (magnitude === 0) {
    return vector
  }

  return vector.map((item) => Number((item / magnitude).toFixed(6)))
}

export class MockAiProvider implements AiProvider {
  constructor(private readonly config: Extract<AiRuntimeConfig, { mode: 'mock' }>) {}

  private getChatModel(): string {
    return this.config.chatModel?.trim() || this.config.model
  }

  private getEmbeddingModel(): string {
    return this.config.embeddingModel?.trim() || this.config.model
  }

  getSummary() {
    const chatModel = this.getChatModel()
    const embeddingModel = this.getEmbeddingModel()

    return {
      provider: this.config.provider,
      model: chatModel,
      mode: this.config.mode,
      chatModel,
      embeddingModel,
    }
  }

  async generateText(input: GenerateTextInput): Promise<GenerateTextResult> {
    const fragments = [
      'Mock AI response',
      input.systemPrompt ? `system=${input.systemPrompt}` : null,
      `prompt=${input.prompt}`,
    ].filter(Boolean)

    return {
      provider: this.config.provider,
      model: this.getChatModel(),
      text: fragments.join(' | '),
      raw: {
        mocked: true,
      },
    }
  }

  async embedTexts(input: EmbedTextsInput): Promise<EmbedTextsResult> {
    return {
      provider: this.config.provider,
      model: this.getEmbeddingModel(),
      embeddings: input.texts.map((item) => buildMockEmbedding(item)),
      raw: {
        mocked: true,
      },
    }
  }
}
