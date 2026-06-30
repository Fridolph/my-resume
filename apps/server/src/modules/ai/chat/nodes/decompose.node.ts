/**
 * decompose 节点。
 *
 * 纯逻辑判断：是否需要将复杂问题拆为子问题逐轮检索。
 * 不做 LLM 调用，只做规则判断。
 *
 * 判断依据：
 * - 问题包含"哪些/分别/各自/多个/比较/对比/区别"等多目标信号
 * - strategy=resume 或 hybrid（补充资料类问题通常不需要拆解）
 *
 * 来自 Agentic RAG L4 multihop 设计。
 */
export function createDecomposeNode() {
  return async (state: {
    strategy: string
    question: string
  }) => {
    const needsDecomposition = shouldDecompose(state.question, state.strategy)

    return {
      decompositionNeeded: needsDecomposition,
    }
  }
}

/**
 * 判断问题是否需要拆解为子问题。
 */
function shouldDecompose(question: string, strategy: string): boolean {
  // 只有简历/混合类问题才考虑拆解
  if (strategy !== 'resume' && strategy !== 'hybrid') {
    return false
  }

  const multiTargetSignals = [
    /哪些/,
    /分别/,
    /各自/,
    /几个/,
    /多个/,
    /比较/,
    /对比/,
    /区别/,
    /不同/,
    /各(自|个)?的/,
    /都(有|做过)?哪些/,
  ]

  // 多目标信号
  if (multiTargetSignals.some((pattern) => pattern.test(question))) {
    return true
  }

  // 并列结构："A和B分别"、"A与B的区别"
  if (/和|与|以及/.test(question) && /分别|区别|不同/.test(question)) {
    return true
  }

  return false
}
