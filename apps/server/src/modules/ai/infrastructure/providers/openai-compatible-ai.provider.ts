import { ChatOpenAI } from '@langchain/openai'
import { JsonOutputToolsParser } from '@langchain/core/output_parsers/openai_tools'

import { AiRuntimeConfig } from '../config/ai-config'
import {
  AiProvider,
  EmbedTextsInput,
  EmbedTextsResult,
  GenerateStructuredObjectInput,
  GenerateStructuredObjectResult,
  GenerateStructuredObjectStreamInput,
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

interface OpenAiCompatibleRequestBody {
  max_tokens?: number
  messages: Array<{
    content: string
    role: 'system' | 'user'
  }>
  model: string
  reasoning_effort?: 'low' | 'medium' | 'high'
  response_format?: {
    type: 'json_object'
  }
  temperature: number
  thinking?: {
    type: 'enabled'
  }
}

/** 拼接 OpenAI-compatible chat completions endpoint，兼容 baseURL 末尾带 `/` 的配置。 */
function joinChatCompletionsUrl(baseUrl: string): string {
  return `${baseUrl.replace(/\/$/, '')}/chat/completions`
}

/** 拼接 OpenAI-compatible embeddings endpoint，兼容 baseURL 末尾带 `/` 的配置。 */
function joinEmbeddingsUrl(baseUrl: string): string {
  return `${baseUrl.replace(/\/$/, '')}/embeddings`
}

/**
 * 从 Chat Completions 响应中读取模型文本。
 *
 * OpenAI-compatible provider 可能返回 string，也可能返回分段 content array；
 * 这里统一归一为业务层可消费的纯文本。
 */
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

/** 尝试读取 provider 错误响应体，最多保留 500 字，避免异常信息过长污染日志。 */
async function readErrorBody(response: Response): Promise<string | undefined> {
  try {
    const body = await response.text()
    const normalizedBody = body.trim()

    return normalizedBody ? normalizedBody.slice(0, 500) : undefined
  } catch {
    return undefined
  }
}

/** 将 provider HTTP 错误格式化为稳定、可读的异常文案。 */
function formatProviderError(
  providerLabel: string,
  action: string,
  response: Response,
  body?: string,
) {
  const detail = body ? `: ${body}` : ''

  return `${providerLabel} ${action} request failed with status ${response.status}${detail}`
}

/**
 * OpenAI-compatible AI provider 适配器。
 *
 * 该类屏蔽 DeepSeek / OpenAI-compatible 服务的 HTTP 与 LangChain SDK 细节，
 * 对上层只暴露统一的 `AiProvider` port。
 */
export class OpenAiCompatibleAiProvider implements AiProvider {
  constructor(
    private readonly config: Extract<AiRuntimeConfig, { mode: 'openai-compatible' }>,
    private readonly fetchFn: FetchLike,
  ) {}

  /** 读取当前聊天模型，优先使用专用 chatModel，未配置时回退到通用 model。 */
  private getChatModel(): string {
    return this.config.chatModel?.trim() || this.config.model
  }

  /** 读取当前向量模型，优先使用专用 embeddingModel，未配置时回退到通用 model。 */
  private getEmbeddingModel(): string {
    return this.config.embeddingModel?.trim() || this.config.model
  }

  /** 读取 embeddings base URL，允许与 chat base URL 分离配置。 */
  private getEmbeddingBaseUrl(): string {
    return this.config.embeddingBaseUrl?.trim() || this.config.baseUrl
  }

  /** 读取 embeddings API Key，允许与 chat API Key 分离配置。 */
  private getEmbeddingApiKey(): string | undefined {
    const embeddingApiKey = this.config.embeddingApiKey?.trim()

    if (embeddingApiKey) {
      return embeddingApiKey
    }

    const embeddingBaseUrl = this.getEmbeddingBaseUrl()

    if (embeddingBaseUrl !== this.config.baseUrl) {
      return undefined
    }

    return this.config.apiKey
  }

  /**
   * 构造 Chat Completions 请求体。
   *
   * 这里集中处理 DeepSeek thinking、reasoning effort、JSON mode 等 provider 配置，
   * 避免业务服务直接拼接厂商参数。
   */
  private buildChatRequestBody(input: GenerateTextInput): OpenAiCompatibleRequestBody {
    const thinkingEnabled = input.thinkingEnabled ?? this.config.thinkingEnabled
    const reasoningEffort = input.reasoningEffort ?? this.config.reasoningEffort
    const maxTokens = input.maxTokens ?? this.config.maxTokens

    return {
      // 1. 固定模型与采样参数，保持 provider 层可观测。
      model: this.getChatModel(),
      temperature: input.temperature ?? 0.2,
      // 2. 只在显式配置时传递可选能力，避免不兼容 provider 报错。
      ...(typeof maxTokens === 'number' ? { max_tokens: maxTokens } : {}),
      ...(input.responseFormat ? { response_format: input.responseFormat } : {}),
      ...(thinkingEnabled ? { thinking: { type: 'enabled' as const } } : {}),
      ...(reasoningEffort ? { reasoning_effort: reasoningEffort } : {}),
      // 3. system prompt 可选，user prompt 始终作为最后一条消息。
      messages: [
        ...(input.systemPrompt
          ? [
              {
                role: 'system' as const,
                content: input.systemPrompt,
              },
            ]
          : []),
        {
          role: 'user' as const,
          content: input.prompt,
        },
      ],
    }
  }

  /** 返回当前 provider 运行时摘要，用于接口展示、日志与排障。 */
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

  /**
   * 执行普通文本生成。
   *
   * 主要服务分析报告、JSON fallback 等非流式场景；简历导入主链路已改为
   * `generateStructuredObjectStream`，避免长 JSON 文本解析不稳定。
   */
  async generateText(input: GenerateTextInput): Promise<GenerateTextResult> {
    const chatModel = this.getChatModel()
    // 1. 按 OpenAI-compatible 协议直接请求 chat completions endpoint。
    const response = await this.fetchFn(joinChatCompletionsUrl(this.config.baseUrl), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${this.config.apiKey}`,
      },
      body: JSON.stringify(this.buildChatRequestBody(input)),
    })

    // 2. 非 2xx 时保留 provider 响应体片段，方便定位 key/baseURL/model 配置问题。
    if (!response.ok) {
      throw new Error(
        formatProviderError(
          this.config.providerLabel,
          'chat completions',
          response,
          await readErrorBody(response),
        ),
      )
    }

    // 3. 将 provider 原始响应归一为业务层统一的 GenerateTextResult。
    const payload = (await response.json()) as OpenAiCompatibleResponse

    return {
      provider: this.config.provider,
      model: chatModel,
      text: extractMessageContent(payload),
      raw: payload,
    }
  }

  /**
   * 执行一次性结构化对象生成。
   *
   * 适合输出体较小、可以等待完整结果后一次性解析的场景。对于简历导入这类
   * 大对象，优先使用 `generateStructuredObjectStream` 获取更好的可观测性。
   */
  async generateStructuredObject(
    input: GenerateStructuredObjectInput,
  ): Promise<GenerateStructuredObjectResult> {
    const chatModel = this.getChatModel()
    // 1. 用 LangChain ChatOpenAI 复用 OpenAI-compatible baseURL 与模型配置。
    const model = new ChatOpenAI({
      apiKey: this.config.apiKey,
      configuration: {
        baseURL: this.config.baseUrl,
      },
      model: chatModel,
      temperature: input.temperature ?? 0,
    })
    // 2. 绑定 schema，由 LangChain 负责和 provider 协商结构化输出方式。
    const structuredModel = model.withStructuredOutput(
      input.schema as Record<string, unknown>,
      {
        method: input.method,
        name: input.schemaName,
      },
    )
    // 3. 等待完整结构化对象返回；这里不暴露中间态。
    const value = await structuredModel.invoke([
      ...(input.systemPrompt
        ? [
            {
              role: 'system' as const,
              content: input.systemPrompt,
            },
          ]
        : []),
      {
        role: 'user' as const,
        content: input.prompt,
      },
    ])

    return {
      method: input.method,
      model: chatModel,
      provider: this.config.provider,
      value,
    }
  }

  /**
   * 执行 tool-call 结构化流式生成。
   *
   * 该方法用于简历导入等大对象识别：中间 tool args 增量只用于日志和 UI 感知，
   * 最终业务仍以 stream 完成后的完整参数对象为准，避免半截 JSON 进入校验链路。
   */
  async generateStructuredObjectStream(
    input: GenerateStructuredObjectStreamInput,
  ): Promise<GenerateStructuredObjectResult> {
    const chatModel = this.getChatModel()
    // 1. 初始化 LangChain 模型，沿用 OpenAI-compatible baseURL。
    const model = new ChatOpenAI({
      apiKey: this.config.apiKey,
      configuration: {
        baseURL: this.config.baseUrl,
      },
      model: chatModel,
      temperature: input.temperature ?? 0,
    })
    // 2. 将业务 schema 绑定为工具，强制模型通过 tool call 返回结构化参数。
    const modelWithTool = model.bindTools([
      {
        name: input.schemaName,
        description:
          input.schemaDescription ??
          'Return the requested structured object. Do not answer in free text.',
        schema: input.schema as Record<string, unknown>,
      },
    ])
    // 3. JsonOutputToolsParser 会把 tool-call chunk 解析成可读的 args 增量。
    const parser = new JsonOutputToolsParser()
    const chain = modelWithTool.pipe(parser)
    // 4. system prompt 可选；user prompt 承载本次任务输入。
    const messages = [
      ...(input.systemPrompt
        ? [
            {
              role: 'system' as const,
              content: input.systemPrompt,
            },
          ]
        : []),
      {
        role: 'user' as const,
        content: input.prompt,
      },
    ]
    const stream = await chain.stream(messages)
    let value: unknown

    // 5. 持续读取工具参数增量；中间态只回调给日志/进度，不做业务落库。
    for await (const chunk of stream) {
      if (!Array.isArray(chunk) || chunk.length === 0) {
        continue
      }

      const args = chunk[0]?.args

      if (!args || typeof args !== 'object') {
        continue
      }

      value = args
      input.onPartialObject?.(args)
    }

    // 6. 只有完整 stream 结束后仍拿不到 args，才视为 provider 结构化输出失败。
    if (!value) {
      throw new Error('Provider structured stream did not return tool arguments')
    }

    // 7. 返回最终工具参数对象，后续由业务层 repair / normalize / validate。
    return {
      method: input.method,
      model: chatModel,
      provider: this.config.provider,
      value,
    }
  }

  /**
   * 执行批量文本向量化。
   *
   * 主要服务 RAG 检索链路；与 chat 模型分开读取 embeddingModel，避免配置耦合。
   */
  async embedTexts(input: EmbedTextsInput): Promise<EmbedTextsResult> {
    const embeddingModel = this.getEmbeddingModel()
    const embeddingBaseUrl = this.getEmbeddingBaseUrl()
    const embeddingApiKey = this.getEmbeddingApiKey()

    if (!embeddingApiKey) {
      throw new Error(
        `Embeddings API key is required for ${this.config.providerLabel} embeddings. Configure EMBEDDINGS_API_KEY when using a dedicated embeddings backend.`,
      )
    }

    // 1. 按 OpenAI-compatible 协议请求 embeddings endpoint。
    const response = await this.fetchFn(joinEmbeddingsUrl(embeddingBaseUrl), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${embeddingApiKey}`,
      },
      body: JSON.stringify({
        model: embeddingModel,
        input: input.texts,
      }),
    })

    // 2. provider 失败时透出响应体片段，方便定位模型名或权限问题。
    if (!response.ok) {
      throw new Error(
        formatProviderError(
          this.config.providerLabel,
          'embeddings',
          response,
          await readErrorBody(response),
        ),
      )
    }

    // 3. 保留 raw 响应，同时向业务层返回纯 embeddings 数组。
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
