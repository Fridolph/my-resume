import type { AiService } from '../../application/services/ai.service'
import type { AiChatLocale } from '../ai-chat.types'

const GREETING_ZH = '你好！我是 FYS（Fridolph），一位全栈工程师。这里是我的个人简历站，你可以问我关于项目经历、工作经历、技术技能或职业发展的问题，我很乐意分享！'

const GREETING_EN = "Hi there! I'm FYS (Fridolph), a full-stack engineer. This is my personal resume site — feel free to ask me about my projects, work experience, technical skills, or career journey. I'd love to share!"

const GUIDE_ZH = '可以问我任何简历相关的问题——项目经历、技能、工作经历都可以，我很乐意分享！'

const GUIDE_EN = "Ask me anything about my resume — my projects, skills, or work experience. I'm happy to share!"

const OUT_OF_SCOPE_ZH = '我只能回答关于我的背景、项目经历、工作经历、技术技能和相关兴趣的问题。欢迎问我这些方面！'

const OUT_OF_SCOPE_EN = "I can only answer questions about my background, projects, work experience, technical skills, and related interests. Feel free to ask about those!"

/**
 * direct_answer 节点工厂。
 *
 * 处理不需要检索的意图：chitchat / guide / out_of_scope。
 * 直接返回预置话术，不调用 LLM（降低延迟和成本）。
 */
export function createDirectAnswerNode(
  _aiService: AiService,
) {
  return async (state: {
    strategy: string
    locale: AiChatLocale
    question: string
  }) => {
    const locale = state.locale
    let answer: string

    switch (state.strategy) {
      case 'chitchat':
        answer = locale === 'en' ? GREETING_EN : GREETING_ZH
        break
      case 'guide':
        answer = locale === 'en' ? GUIDE_EN : GUIDE_ZH
        break
      case 'out_of_scope':
        answer = locale === 'en' ? OUT_OF_SCOPE_EN : OUT_OF_SCOPE_ZH
        break
      default:
        answer = locale === 'en' ? GREETING_EN : GREETING_ZH
    }

    return {
      answer,
      blocks: [
        {
          type: 'text' as const,
          text: answer,
        },
      ],
    }
  }
}
