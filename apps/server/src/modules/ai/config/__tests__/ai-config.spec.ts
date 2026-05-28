import { describe, expect, it } from 'vitest'

import { resolveAiRuntimeConfig, type EnvironmentVariables } from '../ai-config'

describe('resolveAiRuntimeConfig', () => {
  it('should fall back to mock provider when AI_PROVIDER is missing', () => {
    expect(resolveAiRuntimeConfig({})).toEqual({
      provider: 'mock',
      mode: 'mock',
      model: 'mock-resume-advisor',
      chatModel: 'mock-resume-advisor',
      embeddingModel: 'mock-resume-advisor-embedding',
    })
  })

  it('should resolve qiniu as an openai-compatible provider profile', () => {
    const env: EnvironmentVariables = {
      AI_PROVIDER: 'qiniu',
      QINIU_AI_API_KEY: 'sk-qiniu-demo',
      QINIU_AI_BASE_URL: 'https://api.qnaigc.com/v1',
      QINIU_AI_MODEL: 'deepseek-v3',
    }

    expect(resolveAiRuntimeConfig(env)).toEqual({
      provider: 'qiniu',
      mode: 'openai-compatible',
      apiKey: 'sk-qiniu-demo',
      baseUrl: 'https://api.qnaigc.com/v1',
      model: 'deepseek-v3',
      chatModel: 'deepseek-v3',
      embeddingModel: 'deepseek-v3',
      providerLabel: 'Qiniu AI',
    })
  })

  it('should resolve deepseek with default openai-compatible base url', () => {
    const env: EnvironmentVariables = {
      AI_PROVIDER: 'deepseek',
      DEEPSEEK_API_KEY: 'sk-deepseek-demo',
    }

    expect(resolveAiRuntimeConfig(env)).toEqual({
      provider: 'deepseek',
      mode: 'openai-compatible',
      apiKey: 'sk-deepseek-demo',
      baseUrl: 'https://api.deepseek.com',
      model: 'deepseek-v4-flash',
      chatModel: 'deepseek-v4-flash',
      embeddingBaseUrl: 'https://dashscope.aliyuncs.com/compatible-mode/v1',
      embeddingModel: 'text-embedding-v3',
      providerLabel: 'DeepSeek',
    })
  })

  it('should resolve deepseek v4 reasoning options from environment variables', () => {
    const env: EnvironmentVariables = {
      AI_PROVIDER: 'deepseek',
      DEEPSEEK_API_KEY: 'sk-deepseek-demo',
      DEEPSEEK_MODEL: 'deepseek-v4-pro',
      DEEPSEEK_THINKING_ENABLED: 'true',
      DEEPSEEK_REASONING_EFFORT: 'high',
      DEEPSEEK_MAX_TOKENS: '8192',
    }

    expect(resolveAiRuntimeConfig(env)).toEqual(
      expect.objectContaining({
        provider: 'deepseek',
        model: 'deepseek-v4-pro',
        chatModel: 'deepseek-v4-pro',
        thinkingEnabled: true,
        reasoningEffort: 'high',
        maxTokens: 8192,
      }),
    )
  })

  it('should support deepseek model name aliases and shared embedding overrides', () => {
    const env: EnvironmentVariables = {
      AI_PROVIDER: 'deepseek',
      DEEPSEEK_API_KEY: 'sk-deepseek-demo',
      DEEPSEEK_MODEL_NAME: 'deepseek-v4-flash',
      EMBEDDINGS_URL: 'https://dashscope.aliyuncs.com/compatible-mode/v1',
      EMBEDDINGS_MODEL_NAME: 'text-embedding-v3',
      EMBEDDINGS_API_KEY: 'sk-qwen-demo',
    }

    expect(resolveAiRuntimeConfig(env)).toEqual(
      expect.objectContaining({
        provider: 'deepseek',
        baseUrl: 'https://api.deepseek.com',
        model: 'deepseek-v4-flash',
        chatModel: 'deepseek-v4-flash',
        embeddingModel: 'text-embedding-v3',
        embeddingBaseUrl: 'https://dashscope.aliyuncs.com/compatible-mode/v1',
        embeddingApiKey: 'sk-qwen-demo',
      }),
    )
  })

  it('should allow chat and embedding models to be configured separately', () => {
    const env: EnvironmentVariables = {
      AI_PROVIDER: 'openai-compatible',
      OPENAI_COMPATIBLE_API_KEY: 'sk-demo',
      OPENAI_COMPATIBLE_BASE_URL: 'https://api.example.com/v1',
      OPENAI_COMPATIBLE_CHAT_MODEL: 'gpt-4.1-mini',
      OPENAI_COMPATIBLE_EMBEDDING_MODEL: 'text-embedding-3-large',
      OPENAI_COMPATIBLE_MODEL: 'legacy-fallback-model',
    }

    expect(resolveAiRuntimeConfig(env)).toEqual({
      provider: 'openai-compatible',
      mode: 'openai-compatible',
      apiKey: 'sk-demo',
      baseUrl: 'https://api.example.com/v1',
      model: 'gpt-4.1-mini',
      chatModel: 'gpt-4.1-mini',
      embeddingModel: 'text-embedding-3-large',
      providerLabel: 'OpenAI Compatible',
    })
  })

  it('should support generic openai-compatible aliases from external examples', () => {
    const env: EnvironmentVariables = {
      AI_PROVIDER: 'openai-compatible',
      OPENAI_API_KEY: 'sk-openai-demo',
      OPENAI_BASE_URL: 'https://api.deepseek.com',
      MODEL_NAME: 'deepseek-v4-flash',
      EMBEDDINGS_BASE_URL: 'https://dashscope.aliyuncs.com/compatible-mode/v1',
      EMBEDDINGS_MODEL_NAME: 'text-embedding-v3',
      EMBEDDINGS_API_KEY: 'sk-qwen-demo',
    }

    expect(resolveAiRuntimeConfig(env)).toEqual({
      provider: 'openai-compatible',
      mode: 'openai-compatible',
      apiKey: 'sk-openai-demo',
      baseUrl: 'https://api.deepseek.com',
      embeddingApiKey: 'sk-qwen-demo',
      embeddingBaseUrl: 'https://dashscope.aliyuncs.com/compatible-mode/v1',
      model: 'deepseek-v4-flash',
      chatModel: 'deepseek-v4-flash',
      embeddingModel: 'text-embedding-v3',
      providerLabel: 'OpenAI Compatible',
    })
  })

  it('should require provider credentials when a real provider is selected', () => {
    expect(() =>
      resolveAiRuntimeConfig({
        AI_PROVIDER: 'qiniu',
      }),
    ).toThrow('QINIU_AI_API_KEY is required')
  })

  it('should reject placeholder provider credentials before making real requests', () => {
    expect(() =>
      resolveAiRuntimeConfig({
        AI_PROVIDER: 'deepseek',
        DEEPSEEK_API_KEY: 'replace-with-your-own-key',
        EMBEDDINGS_API_KEY: 'sk-qwen-demo',
      }),
    ).toThrow('DEEPSEEK_API_KEY is still a placeholder')
  })
})
