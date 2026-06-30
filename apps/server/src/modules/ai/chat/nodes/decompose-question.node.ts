import { Logger } from '@nestjs/common'

import type { AiChatLocale } from '../ai-chat.types'
import { createRouterLlm } from './router-llm.factory'
import { DecomposeQuestionSchema } from './decompose-question.schema'

const logger = new Logger('DecomposeQuestionNode')

function buildDecomposePrompt(question: string, locale: AiChatLocale): string {
  const langHint = locale === 'en'
    ? 'Output sub-questions in English.'
    : '输出中文子问题。'

  return `将以下简历相关问题拆成有序子问题列表。

要求：
1. 链式推理必须拆成多条；单跳的可以只 1 条
2. 每条必须是完整问句，禁止使用"他/她/此人/它"等指代
3. 顺序必须符合推理链（先查 A 才能查 B → A 排前面）
4. 每条子问题必须独立可检索

${langHint}

用户问题：${question}`
}

/**
 * decompose_question 节点工厂。
 *
 * LLM 将复杂简历问题拆为有序子问题列表。
 * 每条子问题独立可检索，形成推理链。
 *
 * 来自 Agentic RAG L4 multihop 的 decompose_question 设计。
 */
export function createDecomposeQuestionNode() {
  const routerLlm = createRouterLlm()
  const decomposer = routerLlm.withStructuredOutput(DecomposeQuestionSchema, {
    method: 'functionCalling',
    name: 'decompose_question',
  })

  return async (state: { question: string; locale: AiChatLocale }) => {
    const prompt = buildDecomposePrompt(state.question, state.locale)
    const result = await decomposer.invoke(prompt)

    const subQuestions = result.subQuestions ?? [state.question]

    logger.log({
      event: 'graph.decompose.done',
      question: state.question.slice(0, 80),
      subQuestionCount: subQuestions.length,
      subQuestions: subQuestions.map((q) => q.slice(0, 60)),
    })

    return {
      subQuestions,
      nextSubIdx: 0,
    }
  }
}
