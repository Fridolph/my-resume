import { Inject, Injectable } from '@nestjs/common'

import { AI_PROVIDER_INSTANCE } from '../../ai.tokens'
import type {
  AiProvider,
  EmbedTextsInput,
  GenerateStructuredObjectInput,
  GenerateStructuredObjectStreamInput,
  GenerateTextInput,
} from '../../domain/ports/ai-provider.interface'

@Injectable()
export class AiService {
  constructor(
    @Inject(AI_PROVIDER_INSTANCE)
    private readonly aiProvider: AiProvider,
  ) {}

  /**
   * 返回当前 AI provider 的运行时摘要
   * @returns provider 摘要
   */
  getProviderSummary() {
    // AiService 作为统一门面，让业务层不直接依赖具体厂商 SDK。
    return this.aiProvider.getSummary()
  }

  /**
   * 执行文本生成
   * @param input 文本生成输入
   * @returns 生成结果
   */
  generateText(input: GenerateTextInput) {
    return this.aiProvider.generateText(input)
  }

  /**
   * 执行结构化对象生成。
   *
   * 只有真实 OpenAI-compatible provider 支持该能力；mock 或旧 provider 不支持时由业务层 fallback。
   */
  generateStructuredObject(input: GenerateStructuredObjectInput) {
    if (!this.aiProvider.generateStructuredObject) {
      throw new Error('Current AI provider does not support structured output')
    }

    return this.aiProvider.generateStructuredObject(input)
  }

  /**
   * 执行结构化对象流式生成。
   *
   * 简历导入这类大对象优先使用 tool-call stream：中间增量只用于可观测性，
   * 最终仍以完整 tool args 进入业务校验，避免半截 JSON 误入主流程。
   */
  generateStructuredObjectStream(input: GenerateStructuredObjectStreamInput) {
    if (!this.aiProvider.generateStructuredObjectStream) {
      throw new Error('Current AI provider does not support structured output stream')
    }

    return this.aiProvider.generateStructuredObjectStream(input)
  }

  /**
   * 执行批量向量化
   * @param input 向量化输入
   * @returns 向量化结果
   */
  embedTexts(input: EmbedTextsInput) {
    return this.aiProvider.embedTexts(input)
  }
}
