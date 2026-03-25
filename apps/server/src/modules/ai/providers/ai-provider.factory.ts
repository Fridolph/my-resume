import { AiRuntimeConfig } from '../config/ai-config';
import { AiProvider } from '../interfaces/ai-provider.interface';
import { MockAiProvider } from './mock-ai.provider';
import { OpenAiCompatibleAiProvider } from './openai-compatible-ai.provider';

type FetchLike = typeof fetch;

export function createAiProvider(
  config: AiRuntimeConfig,
  fetchFn: FetchLike,
): AiProvider {
  if (config.mode === 'mock') {
    return new MockAiProvider(config);
  }

  return new OpenAiCompatibleAiProvider(config, fetchFn);
}
