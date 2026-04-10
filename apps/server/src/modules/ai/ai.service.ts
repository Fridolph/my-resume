import { Inject, Injectable } from '@nestjs/common'

import { AI_PROVIDER_INSTANCE } from './ai.tokens'
import type {
  AiProvider,
  EmbedTextsInput,
  GenerateTextInput,
} from './interfaces/ai-provider.interface'

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
   * 执行批量向量化
   * @param input 向量化输入
   * @returns 向量化结果
   */
  embedTexts(input: EmbedTextsInput) {
    return this.aiProvider.embedTexts(input)
  }
}
