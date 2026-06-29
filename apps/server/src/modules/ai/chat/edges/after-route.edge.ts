/**
 * afterRoute 条件边判断函数。
 *
 * 根据 route_intent 节点的 strategy 输出，决定下一步走向：
 * - chitchat / guide / out_of_scope → direct_answer（无需检索）
 * - resume / supplement / hybrid → retrieve（需要 RAG 检索）
 *
 * 对应 LangGraph addConditionalEdges 的 routing function。
 */
export function afterRoute(state: { strategy: string }): string {
  switch (state.strategy) {
    case 'chitchat':
    case 'guide':
    case 'out_of_scope':
      return 'direct_answer'

    case 'resume':
    case 'supplement':
    case 'hybrid':
      return 'retrieve'

    // 未知 strategy 默认走 retrieve（安全兜底）
    default:
      return 'retrieve'
  }
}
