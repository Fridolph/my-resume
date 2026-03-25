export type EnvironmentVariables = Partial<Record<string, string | undefined>>;

export type AiRuntimeConfig =
  | {
      provider: 'mock';
      mode: 'mock';
      model: string;
    }
  | {
      provider: 'qiniu' | 'deepseek' | 'openai-compatible';
      mode: 'openai-compatible';
      apiKey: string;
      baseUrl: string;
      model: string;
      providerLabel: string;
    };

function readRequiredValue(
  env: EnvironmentVariables,
  key: string,
  errorMessage: string,
): string {
  const value = env[key]?.trim();

  if (!value) {
    throw new Error(errorMessage);
  }

  return value;
}

export function resolveAiRuntimeConfig(
  env: EnvironmentVariables,
): AiRuntimeConfig {
  const provider = env.AI_PROVIDER?.trim().toLowerCase();

  if (!provider || provider === 'mock') {
    return {
      provider: 'mock',
      mode: 'mock',
      model: 'mock-resume-advisor',
    };
  }

  if (provider === 'qiniu') {
    return {
      provider: 'qiniu',
      mode: 'openai-compatible',
      apiKey: readRequiredValue(env, 'QINIU_AI_API_KEY', 'QINIU_AI_API_KEY is required'),
      baseUrl:
        env.QINIU_AI_BASE_URL?.trim() || 'https://api.qnaigc.com/v1',
      model: env.QINIU_AI_MODEL?.trim() || 'deepseek-v3',
      providerLabel: 'Qiniu AI',
    };
  }

  if (provider === 'deepseek') {
    return {
      provider: 'deepseek',
      mode: 'openai-compatible',
      apiKey: readRequiredValue(env, 'DEEPSEEK_API_KEY', 'DEEPSEEK_API_KEY is required'),
      baseUrl:
        env.DEEPSEEK_BASE_URL?.trim() || 'https://api.deepseek.com/v1',
      model: env.DEEPSEEK_MODEL?.trim() || 'deepseek-chat',
      providerLabel: 'DeepSeek',
    };
  }

  if (provider === 'openai-compatible') {
    return {
      provider: 'openai-compatible',
      mode: 'openai-compatible',
      apiKey: readRequiredValue(
        env,
        'OPENAI_COMPATIBLE_API_KEY',
        'OPENAI_COMPATIBLE_API_KEY is required',
      ),
      baseUrl: readRequiredValue(
        env,
        'OPENAI_COMPATIBLE_BASE_URL',
        'OPENAI_COMPATIBLE_BASE_URL is required',
      ),
      model: readRequiredValue(
        env,
        'OPENAI_COMPATIBLE_MODEL',
        'OPENAI_COMPATIBLE_MODEL is required',
      ),
      providerLabel: 'OpenAI Compatible',
    };
  }

  throw new Error(`Unsupported AI_PROVIDER: ${provider}`);
}
