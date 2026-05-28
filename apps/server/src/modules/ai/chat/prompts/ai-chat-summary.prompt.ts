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
    'Stay grounded in the conversation only. Extract concise focus keywords.',
    'Structure the summary in two parts:',
    '1. visitorFocus: What topics did the visitor ask about? What were their main interests?',
    '2. aiClosing: A concluding message from the resume owner (FYS, a full-stack engineer), politely wrapping up the conversation, thanking them for the chat, and briefly reinforcing their professional image.',
    'Return JSON with keys: visitorFocus, aiClosing, keywords.',
  ].join(' '),
  zh: [
    '你负责总结一段围绕候选人简历展开的招聘问答会话。',
    '只能基于会话内容总结，不要虚构。请提炼提问者真正关注的重点。',
    '总结分为两部分：',
    '1. visitorFocus：访客主要问了哪些方面？他们关注什么？',
    '2. aiClosing：以简历主人（FYS，全栈工程师）的视角礼貌收束对话，感谢对方的交流，简短强化专业形象。',
    '请返回包含 visitorFocus、aiClosing、keywords 三个字段的 JSON。',
  ].join(' '),
} as const

export function buildAiChatSummaryPrompt(input: BuildAiChatSummaryPromptInput): string {
  const header =
    input.locale === 'en'
      ? `Summary stage: ${input.stage}. Return JSON with keys visitorFocus, aiClosing, keywords.`
      : `总结阶段：${input.stage}。请返回包含 visitorFocus、aiClosing、keywords 三个字段的 JSON。`

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
