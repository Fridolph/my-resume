import { Logger } from '@nestjs/common'

import type { AiChatLocale } from '../ai-chat.types'
import { createRouterLlm } from './router-llm.factory'
import { EvaluateRetrievalSchema } from './evaluate-retrieval.schema'

const logger = new Logger('EvaluateNode')

/**
 * 构建评估 Prompt。
 *
 * 评估节点判断检索到的简历/补充资料是否足以回答问题。
 * 不够 → fallback_answer；够了 → rag_generate。
 */
function buildEvaluatePrompt(
  question: string,
  citations: any[],
  locale: AiChatLocale,
): string {
  const citationSummary = citations.length === 0
    ? '（无检索结果）'
    : citations
        .map((c, i) => `[${i + 1}] ${c.title} (${c.sourceType}, score=${c.score?.toFixed(2) ?? '?'}): ${c.snippet?.slice(0, 100) ?? ''}`)
        .join('\n')

  return `你是检索质量评估器。判断检索到的简历/资料内容是否足以回答用户问题。

用户问题：${question}
语言：${locale === 'en' ? 'English' : '中文'}

检索结果（共 ${citations.length} 条）：
${citationSummary}

判断标准：
- enough=true：检索结果包含回答问题所需的关键信息
- enough=false：检索结果为空或不相关，无法回答问题
- confidence=high：明确相关且信息完整
- confidence=medium：部分相关但可能不全
- confidence=low：基本不相关或信息严重缺失

只基于上述检索结果判断，不要假设额外信息。`
}

/**
 * evaluate 节点工厂。
 *
 * 在 retrieve 之后、rag_generate 之前插入。
 * LLM 判断检索充分性，不够时走 fallback_answer。
 */
export function createEvaluateNode() {
  const routerLlm = createRouterLlm()
  const evaluator = routerLlm.withStructuredOutput(EvaluateRetrievalSchema, {
    method: 'functionCalling',
    name: 'evaluate_retrieval',
  })

  return async (state: {
    question: string
    locale: AiChatLocale
    citations: any[]
  }) => {
    const prompt = buildEvaluatePrompt(state.question, state.citations, state.locale)
    const result = await evaluator.invoke(prompt)

    logger.log({
      event: 'graph.evaluate.done',
      question: state.question.slice(0, 80),
      enough: result.enough,
      confidence: result.confidence,
      citationCount: state.citations.length,
      missing: result.missing,
    })

    return {
      evaluation: {
        enough: result.enough,
        missing: result.missing,
        confidence: result.confidence,
      },
    }
  }
}
