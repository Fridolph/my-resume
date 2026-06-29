import type { AiChatLocale } from '../ai-chat.types'

const FALLBACK_ZH = '我的简历中暂时没有足够的信息来准确回答这个问题。欢迎问我关于项目经历、工作经历、技术技能或学习分享的问题！'

const FALLBACK_EN = "I don't have enough information in my resume to answer this question accurately. Feel free to ask about my projects, work experience, technical skills, or learning journey!"

const LOW_CONFIDENCE_ZH = '抱歉，我对这个问题不太确定。可以换个方式问我关于简历的具体内容——比如项目经历、技术栈或者工作背景？'

const LOW_CONFIDENCE_EN = "Sorry, I'm not confident about this one. Could you try asking about specific parts of my resume — like my projects, tech stack, or work background?"

/**
 * fallback_answer 节点。
 *
 * 当 evaluate 节点判断检索结果不足以回答问题时，返回友好兜底话术。
 * 不上 LLM、不做检索。
 */
export function createFallbackAnswerNode() {
  return async (state: {
    locale: AiChatLocale
    evaluation: { enough: boolean; confidence?: string }
  }) => {
    const locale = state.locale
    const isLowConfidence = state.evaluation?.confidence === 'low'

    const answer = isLowConfidence
      ? (locale === 'en' ? LOW_CONFIDENCE_EN : LOW_CONFIDENCE_ZH)
      : (locale === 'en' ? FALLBACK_EN : FALLBACK_ZH)

    return {
      answer,
      blocks: [{ type: 'text' as const, text: answer }],
    }
  }
}
