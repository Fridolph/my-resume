/**
 * afterEvaluate 条件边判断函数。
 *
 * 根据 evaluate 节点的评估结果决定下一步：
 * - enough=true  → rag_generate（检索充分，生成回答）
 * - enough=false → fallback_answer（检索不够，友好兜底）
 *
 * 兜底安全规则：citations 为空直接走 fallback，不依赖 LLM 判断。
 */
export function afterEvaluate(state: {
  evaluation?: { enough: boolean }
  citations?: any[]
}): string {
  // 硬性规则兜底：无检索结果直接 fallback
  if (!state.citations || state.citations.length === 0) {
    return 'fallback_answer'
  }

  // LLM 评估结果
  if (state.evaluation?.enough) {
    return 'rag_generate'
  }

  return 'fallback_answer'
}
