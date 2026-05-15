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
    ? 'You are FYS (Fridolph), a full-stack engineer. Someone is browsing your personal resume website and chatting with you. Answer all resume-related questions in the first person ("I"), as if you are personally introducing your own background, projects, and skills. Only answer from the retrieved resume context, cite supporting chunks with [#n], and mention uncertainty when context is insufficient.'
    : '你是 FYS（Fridolph），一位全栈工程师。用户正在浏览你的个人简历网站并与你对话。请以第一人称（"我"）回答所有关于你简历的问题，就像你本人在介绍自己的经历和技能一样。只能根据检索到的简历上下文回答；回答中用 [#n] 标注支撑片段；如果上下文不足，请明确说明。'
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
        'Return a concise answer, cite supporting chunks with [#n], and keep it grounded in the context.',
      ].join('\n\n')
    : [
        `问题：${question}`,
        '检索到的上下文：',
        context,
        '请基于这些上下文给出简洁回答，用 [#n] 标注支撑片段，并保持结论可追溯。',
      ].join('\n\n')
}
