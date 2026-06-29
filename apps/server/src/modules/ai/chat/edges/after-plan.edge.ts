/**
 * afterPlan 条件边判断函数。
 *
 * plan_next 写入 plannedNext → afterPlan 读取 → 条件边跳转。
 * - 'retrieve' → 🔄 回边到 retrieve（继续循环检索）
 * - 'generate' → evaluate（终止循环，进入评估）
 *
 * 这是 multihop 的核心回边机制。
 * 来自 Agentic RAG L4 multihop 的 afterPlan 设计。
 */
export function afterPlan(state: { plannedNext: string }): string {
  return state.plannedNext === 'retrieve' ? 'retrieve' : 'evaluate'
}
