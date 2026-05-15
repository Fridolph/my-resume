import type { AiChatLocale, AiChatSummaryStage } from '../ai-chat.types'

interface BuildAiChatSummaryPromptInput {
  locale: AiChatLocale
  messages: Array<{
    content: string
    role: 'assistant' | 'system' | 'user'
    turnIndex: number
  }>
  stage: AiChatSummaryStage
}

export const AI_CHAT_SUMMARY_SYSTEM_PROMPT = {
  en: [
    'You summarize a recruiter-facing resume chat session.',
    'Stay grounded in the conversation only.',
    'Extract concise focus keywords and keep the summary factual.',
  ].join(' '),
  zh: [
    '你负责总结一段围绕候选人简历展开的招聘问答会话。',
    '只能基于会话内容总结，不要虚构。',
    '请提炼提问者真正关注的重点，并保持表达简洁、客观。',
  ].join(' '),
} as const

export function buildAiChatSummaryPrompt(input: BuildAiChatSummaryPromptInput): string {
  const header =
    input.locale === 'en'
      ? `Summary stage: ${input.stage}. Return JSON with keys summary and keywords.`
      : `总结阶段：${input.stage}。请返回包含 summary 和 keywords 两个字段的 JSON。`

  const transcript = input.messages
    .map((message) => {
      const role =
        message.role === 'user'
          ? input.locale === 'en'
            ? 'User'
            : '用户'
          : message.role === 'assistant'
            ? input.locale === 'en'
              ? 'Assistant'
              : '助手'
            : input.locale === 'en'
              ? 'System'
              : '系统'

      return `[${message.turnIndex}] ${role}: ${message.content}`
    })
    .join('\n')

  return [header, input.locale === 'en' ? 'Transcript:' : '会话记录：', transcript].join(
    '\n\n',
  )
}
