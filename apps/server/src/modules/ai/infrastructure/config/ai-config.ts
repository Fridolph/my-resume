export type EnvironmentVariables = Partial<Record<string, string | undefined>>

export type AiRuntimeConfig =
  | {
      provider: 'mock'
      mode: 'mock'
      model: string
      chatModel?: string
      embeddingModel?: string
    }
  | {
      provider: 'qiniu' | 'deepseek' | 'openai-compatible'
      mode: 'openai-compatible'
      apiKey: string
      baseUrl: string
      model: string
      chatModel?: string
      embeddingModel?: string
      maxTokens?: number
      providerLabel: string
      reasoningEffort?: 'low' | 'medium' | 'high'
      thinkingEnabled?: boolean
    }

function readRequiredValue(
  env: EnvironmentVariables,
  key: string,
  errorMessage: string,
): string {
  const value = env[key]?.trim()

  if (!value) {
    throw new Error(errorMessage)
  }

  return value
}

function readRequiredSecret(
  env: EnvironmentVariables,
  key: string,
  errorMessage: string,
): string {
  const value = readRequiredValue(env, key, errorMessage)

  if (value === 'replace-with-your-own-key') {
    throw new Error(
      `${key} is still a placeholder; set a real API key or use AI_PROVIDER=mock`,
    )
  }

  return value
}

function readOptionalValue(env: EnvironmentVariables, key: string): string | undefined {
  const value = env[key]?.trim()

  return value ? value : undefined
}

function readOptionalBoolean(
  env: EnvironmentVariables,
  key: string,
): boolean | undefined {
  const value = readOptionalValue(env, key)?.toLowerCase()

  if (!value) {
    return undefined
  }

  return ['1', 'true', 'yes', 'on'].includes(value)
}

function readOptionalPositiveInteger(
  env: EnvironmentVariables,
  key: string,
): number | undefined {
  const value = readOptionalValue(env, key)

  if (!value) {
    return undefined
  }

  const parsedValue = Number.parseInt(value, 10)

  return Number.isInteger(parsedValue) && parsedValue > 0 ? parsedValue : undefined
}

function readOptionalReasoningEffort(
  env: EnvironmentVariables,
  key: string,
): 'low' | 'medium' | 'high' | undefined {
  const value = readOptionalValue(env, key)?.toLowerCase()

  return value === 'low' || value === 'medium' || value === 'high' ? value : undefined
}

export function resolveAiRuntimeConfig(env: EnvironmentVariables): AiRuntimeConfig {
  const provider = env.AI_PROVIDER?.trim().toLowerCase()

  if (!provider || provider === 'mock') {
    return {
      provider: 'mock',
      mode: 'mock',
      model: 'mock-resume-advisor',
      chatModel: 'mock-resume-advisor',
      embeddingModel: 'mock-resume-advisor-embedding',
    }
  }

  if (provider === 'qiniu') {
    const chatModel =
      readOptionalValue(env, 'QINIU_AI_CHAT_MODEL') ??
      readOptionalValue(env, 'QINIU_AI_MODEL') ??
      'deepseek-v3'
    const embeddingModel = readOptionalValue(env, 'QINIU_AI_EMBEDDING_MODEL') ?? chatModel

    return {
      provider: 'qiniu',
      mode: 'openai-compatible',
      apiKey: readRequiredSecret(env, 'QINIU_AI_API_KEY', 'QINIU_AI_API_KEY is required'),
      baseUrl: env.QINIU_AI_BASE_URL?.trim() || 'https://api.qnaigc.com/v1',
      model: chatModel,
      chatModel,
      embeddingModel,
      providerLabel: 'Qiniu AI',
    }
  }

  if (provider === 'deepseek') {
    const chatModel =
      readOptionalValue(env, 'DEEPSEEK_CHAT_MODEL') ??
      readOptionalValue(env, 'DEEPSEEK_MODEL') ??
      'deepseek-v4-flash'
    const embeddingModel = readOptionalValue(env, 'DEEPSEEK_EMBEDDING_MODEL') ?? chatModel

    return {
      provider: 'deepseek',
      mode: 'openai-compatible',
      apiKey: readRequiredSecret(env, 'DEEPSEEK_API_KEY', 'DEEPSEEK_API_KEY is required'),
      baseUrl: env.DEEPSEEK_BASE_URL?.trim() || 'https://api.deepseek.com',
      maxTokens: readOptionalPositiveInteger(env, 'DEEPSEEK_MAX_TOKENS'),
      model: chatModel,
      chatModel,
      embeddingModel,
      providerLabel: 'DeepSeek',
      reasoningEffort: readOptionalReasoningEffort(env, 'DEEPSEEK_REASONING_EFFORT'),
      thinkingEnabled: readOptionalBoolean(env, 'DEEPSEEK_THINKING_ENABLED'),
    }
  }

  if (provider === 'openai-compatible') {
    const chatModel =
      readOptionalValue(env, 'OPENAI_COMPATIBLE_CHAT_MODEL') ??
      readRequiredValue(
        env,
        'OPENAI_COMPATIBLE_MODEL',
        'OPENAI_COMPATIBLE_MODEL is required',
      )
    const embeddingModel =
      readOptionalValue(env, 'OPENAI_COMPATIBLE_EMBEDDING_MODEL') ?? chatModel

    return {
      provider: 'openai-compatible',
      mode: 'openai-compatible',
      apiKey: readRequiredSecret(
        env,
        'OPENAI_COMPATIBLE_API_KEY',
        'OPENAI_COMPATIBLE_API_KEY is required',
      ),
      baseUrl: readRequiredValue(
        env,
        'OPENAI_COMPATIBLE_BASE_URL',
        'OPENAI_COMPATIBLE_BASE_URL is required',
      ),
      model: chatModel,
      chatModel,
      embeddingModel,
      providerLabel: 'OpenAI Compatible',
    }
  }

  throw new Error(`Unsupported AI_PROVIDER: ${provider}`)
}
