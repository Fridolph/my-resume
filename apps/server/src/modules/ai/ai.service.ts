import { Inject, Injectable } from '@nestjs/common';

import { AI_PROVIDER_INSTANCE } from './ai.tokens';
import type {
  AiProvider,
  GenerateTextInput,
} from './interfaces/ai-provider.interface';

@Injectable()
export class AiService {
  constructor(
    @Inject(AI_PROVIDER_INSTANCE)
    private readonly aiProvider: AiProvider,
  ) {}

  getProviderSummary() {
    return this.aiProvider.getSummary();
  }

  generateText(input: GenerateTextInput) {
    return this.aiProvider.generateText(input);
  }
}
