/**
 * AI provider 连通性检查 Prompt。
 *
 * 该 Prompt 只用于健康检查，不承载业务推理，要求模型返回极短确认文本。
 */
export const AI_CONNECTIVITY_SYSTEM_PROMPT =
  'You are a production health-check endpoint. Reply with a very short confirmation.'

/**
 * AI provider 连通性检查用户 Prompt。
 */
export const AI_CONNECTIVITY_USER_PROMPT =
  'Reply with OK only if this AI model is reachable.'
