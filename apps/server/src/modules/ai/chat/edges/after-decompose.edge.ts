/**
 * afterDecompose 条件边判断函数。
 *
 * 根据 decompose 节点的 decompositionNeeded 决定下一步：
 * - true  → decompose_question（LLM 拆子问题）
 * - false → retrieve（直接检索，跳过拆解）
 */
export function afterDecompose(state: { decompositionNeeded: boolean }): string {
  return state.decompositionNeeded ? 'decompose_question' : 'retrieve'
}
