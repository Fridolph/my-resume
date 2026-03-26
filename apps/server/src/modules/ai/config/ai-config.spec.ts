import { describe, expect, it } from 'vitest';

import {
  resolveAiRuntimeConfig,
  type EnvironmentVariables,
} from './ai-config';

describe('resolveAiRuntimeConfig', () => {
  it('should fall back to mock provider when AI_PROVIDER is missing', () => {
    expect(resolveAiRuntimeConfig({})).toEqual({
      provider: 'mock',
      mode: 'mock',
      model: 'mock-resume-advisor',
    });
  });

  it('should resolve qiniu as an openai-compatible provider profile', () => {
    const env: EnvironmentVariables = {
      AI_PROVIDER: 'qiniu',
      QINIU_AI_API_KEY: 'sk-qiniu-demo',
      QINIU_AI_BASE_URL: 'https://api.qnaigc.com/v1',
      QINIU_AI_MODEL: 'deepseek-v3',
    };

    expect(resolveAiRuntimeConfig(env)).toEqual({
      provider: 'qiniu',
      mode: 'openai-compatible',
      apiKey: 'sk-qiniu-demo',
      baseUrl: 'https://api.qnaigc.com/v1',
      model: 'deepseek-v3',
      providerLabel: 'Qiniu AI',
    });
  });

  it('should resolve deepseek with default openai-compatible base url', () => {
    const env: EnvironmentVariables = {
      AI_PROVIDER: 'deepseek',
      DEEPSEEK_API_KEY: 'sk-deepseek-demo',
    };

    expect(resolveAiRuntimeConfig(env)).toEqual({
      provider: 'deepseek',
      mode: 'openai-compatible',
      apiKey: 'sk-deepseek-demo',
      baseUrl: 'https://api.deepseek.com/v1',
      model: 'deepseek-chat',
      providerLabel: 'DeepSeek',
    });
  });

  it('should require provider credentials when a real provider is selected', () => {
    expect(() =>
      resolveAiRuntimeConfig({
        AI_PROVIDER: 'qiniu',
      }),
    ).toThrow('QINIU_AI_API_KEY is required');
  });
});
