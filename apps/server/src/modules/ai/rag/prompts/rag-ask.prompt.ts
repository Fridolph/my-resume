export interface BuildRagAskPromptInput {
  /** 用户问题。 */
  question: string
  /** 已拼接好的检索上下文。 */
  context: string
  /** 回答语言。 */
  locale: 'zh' | 'en'
}

/**
 * 构建 RAG 问答系统 Prompt。
 */
export function buildRagAskSystemPrompt(locale: 'zh' | 'en'): string {
  return locale === 'en'
    ? 'You are a resume knowledge assistant. Answer only from the retrieved resume context and mention uncertainty when context is insufficient.'
    : '你是一个简历知识库助手。只能根据检索到的简历上下文回答；如果上下文不足，请明确说明。'
}

/**
 * 构建 RAG 问答用户 Prompt。
 */
export function buildRagAskPrompt({
  question,
  context,
  locale,
}: BuildRagAskPromptInput): string {
  return locale === 'en'
    ? [
        `Question: ${question}`,
        'Retrieved context:',
        context,
        'Return a concise answer and keep it grounded in the context.',
      ].join('\n\n')
    : [
        `问题：${question}`,
        '检索到的上下文：',
        context,
        '请基于这些上下文给出简洁回答，并保持结论可追溯。',
      ].join('\n\n')
}
