import { Logger } from '@nestjs/common'

import { createRouterLlm } from './router-llm.factory'

const logger = new Logger('PlanNextNode')

/**
 * plan_next 节点工厂。
 *
 * 多跳检索的循环控制中枢：
 * - LLM 判断是否还需要继续检索
 * - 硬性规则兜底：超上限/子问题全检完 → 强制终止
 * - 写入 plannedNext 字段供 afterPlan 条件边读取
 *
 * 来自 Agentic RAG L4 multihop 的 plan_next_step 设计。
 *
 * 双重保险（LLM 判断 + 硬性规则兜底）：
 * ```
 * let finalNext = nextAction;                    // LLM 建议
 * if (retrievalCount >= maxRetrievals)           // 超上限
 *     finalNext = "generate";
 * if (remaining <= 0)                            // 子问题全检索完
 *     finalNext = "generate";
 * ```
 */
export function createPlanNextNode() {
  const routerLlm = createRouterLlm()

  return async (state: {
    question: string
    subQuestions?: string[]
    nextSubIdx?: number
    retrievalCount?: number
    maxRetrievals?: number
    citations?: any[]
  }) => {
    const subQuestions = state.subQuestions ?? []
    const idx = state.nextSubIdx ?? 0
    const remaining = subQuestions.length - idx
    const retrievalCount = state.retrievalCount ?? 0
    const maxRetrievals = state.maxRetrievals ?? 5

    // 硬性兜底 1：所有子问题已检索完
    if (remaining <= 0) {
      logger.log({
        event: 'graph.plan_next.hard_stop',
        reason: 'all_sub_questions_retrieved',
        retrievalCount,
        remaining,
      })
      return { plannedNext: 'generate' as const }
    }

    // 硬性兜底 2：超过最大检索轮数
    if (retrievalCount >= maxRetrievals) {
      logger.log({
        event: 'graph.plan_next.hard_stop',
        reason: 'max_retrievals_exceeded',
        retrievalCount,
        maxRetrievals,
      })
      return { plannedNext: 'generate' as const }
    }

    // 单子问题 or 非多跳模式：跳过 LLM，直接进入 evaluate
    if (subQuestions.length <= 1) {
      return { plannedNext: 'generate' as const }
    }

    // LLM 决策
    const prompt = `你是检索规划器。判断是否还需要继续检索子问题才能回答用户的问题。

原始问题：${state.question}
已检索子问题数：${idx} / ${subQuestions.length}
已检索轮次：${retrievalCount} / ${maxRetrievals}
剩余子问题：${remaining > 0 ? subQuestions.slice(idx, idx + 3).map((q, i) => `${idx + i + 1}. ${q}`).join('\n') : '（无）'}
已召回文档数：${state.citations?.length ?? 0}

判断标准：
- 如果已检索的内容已经足以回答原始问题 → 输出 generate
- 如果还需要更多子问题的检索结果 → 输出 retrieve

只输出一个词：retrieve 或 generate`

    try {
      const result = await routerLlm.invoke(prompt)
      const response = typeof result.content === 'string'
        ? result.content.trim().toLowerCase()
        : 'generate'
      const nextAction = response.includes('retrieve') ? 'retrieve' : 'generate'

      logger.log({
        event: 'graph.plan_next.decision',
        retrievalCount,
        remaining,
        nextAction,
      })

      return { plannedNext: nextAction as 'retrieve' | 'generate' }
    } catch {
      // LLM 调用失败 → 安全兜底：还有剩余子问题就继续
      return { plannedNext: remaining > 0 ? 'retrieve' as const : 'generate' as const }
    }
  }
}
