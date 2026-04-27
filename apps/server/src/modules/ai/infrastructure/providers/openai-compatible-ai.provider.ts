import { AiRuntimeConfig } from '../config/ai-config'
import {
  AiProvider,
  EmbedTextsInput,
  EmbedTextsResult,
  GenerateTextInput,
  GenerateTextResult,
} from '../../domain/ports/ai-provider.interface'

type FetchLike = typeof fetch

interface OpenAiCompatibleResponse {
  id?: string
  choices?: Array<{
    message?: {
      content?: string | Array<{ type: string; text?: string }>
    }
  }>
}

interface OpenAiCompatibleEmbeddingResponse {
  data?: Array<{
    embedding?: number[]
    index?: number
  }>
}

function joinChatCompletionsUrl(baseUrl: string): string {
  return `${baseUrl.replace(/\/$/, '')}/chat/completions`
}

function joinEmbeddingsUrl(baseUrl: string): string {
  return `${baseUrl.replace(/\/$/, '')}/embeddings`
}

function extractMessageContent(response: OpenAiCompatibleResponse): string {
  const content = response.choices?.[0]?.message?.content

  if (typeof content === 'string') {
    return content
  }

  if (Array.isArray(content)) {
    return content
      .filter((item) => item.type === 'text' && item.text)
      .map((item) => item.text)
      .join('\n')
  }

  throw new Error('Provider response does not include message content')
}

export class OpenAiCompatibleAiProvider implements AiProvider {
  constructor(
    private readonly config: Extract<AiRuntimeConfig, { mode: 'openai-compatible' }>,
    private readonly fetchFn: FetchLike,
  ) {}

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
    const chatModel = this.getChatModel()
    const response = await this.fetchFn(joinChatCompletionsUrl(this.config.baseUrl), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${this.config.apiKey}`,
      },
      body: JSON.stringify({
        model: chatModel,
        temperature: input.temperature ?? 0.2,
        messages: [
          ...(input.systemPrompt
            ? [
                {
                  role: 'system',
                  content: input.systemPrompt,
                },
              ]
            : []),
          {
            role: 'user',
            content: input.prompt,
          },
        ],
      }),
    })

    if (!response.ok) {
      throw new Error(
        `${this.config.providerLabel} request failed with status ${response.status}`,
      )
    }

    const payload = (await response.json()) as OpenAiCompatibleResponse

    return {
      provider: this.config.provider,
      model: chatModel,
      text: extractMessageContent(payload),
      raw: payload,
    }
  }

  async embedTexts(input: EmbedTextsInput): Promise<EmbedTextsResult> {
    const embeddingModel = this.getEmbeddingModel()
    const response = await this.fetchFn(joinEmbeddingsUrl(this.config.baseUrl), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${this.config.apiKey}`,
      },
      body: JSON.stringify({
        model: embeddingModel,
        input: input.texts,
      }),
    })

    if (!response.ok) {
      throw new Error(
        `${this.config.providerLabel} embeddings request failed with status ${response.status}`,
      )
    }

    const payload = (await response.json()) as OpenAiCompatibleEmbeddingResponse
    const embeddings = payload.data?.map((item) => item.embedding ?? []) ?? []

    return {
      provider: this.config.provider,
      model: embeddingModel,
      embeddings,
      raw: payload,
    }
  }
}
