import { AiRuntimeConfig } from '../config/ai-config';
import {
  AiProvider,
  GenerateTextInput,
  GenerateTextResult,
} from '../interfaces/ai-provider.interface';

export class MockAiProvider implements AiProvider {
  constructor(
    private readonly config: Extract<AiRuntimeConfig, { mode: 'mock' }>,
  ) {}

  getSummary() {
    return {
      provider: this.config.provider,
      model: this.config.model,
      mode: this.config.mode,
    };
  }

  async generateText(input: GenerateTextInput): Promise<GenerateTextResult> {
    const fragments = [
      'Mock AI response',
      input.systemPrompt ? `system=${input.systemPrompt}` : null,
      `prompt=${input.prompt}`,
    ].filter(Boolean);

    return {
      provider: this.config.provider,
      model: this.config.model,
      text: fragments.join(' | '),
      raw: {
        mocked: true,
      },
    };
  }
}
