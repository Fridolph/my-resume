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

  getProviderSummary() {
    /**
     * AiService 保持很薄，只做统一门面。
     * 这样业务层永远面对的是 generateText / embedTexts，
     * 而不是具体厂商 SDK。
     */
    return this.aiProvider.getSummary()
  }

  generateText(input: GenerateTextInput) {
    return this.aiProvider.generateText(input)
  }

  embedTexts(input: EmbedTextsInput) {
    return this.aiProvider.embedTexts(input)
  }
}
