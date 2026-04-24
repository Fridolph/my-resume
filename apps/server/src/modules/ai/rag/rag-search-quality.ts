import { RagSearchMatch } from './rag.types'

/**
 * 检索质量门控参数。
 */
export interface RagSearchQualityGate {
  minScore?: number
  minScoreGap?: number
}

function normalizeNonNegativeNumber(value: string | undefined): number | undefined {
  if (!value) {
    return undefined
  }

  const parsed = Number(value)

  if (!Number.isFinite(parsed) || parsed < 0) {
    return undefined
  }

  return parsed
}

/**
 * 从环境变量解析默认检索门控参数。
 *
 * @param env 进程环境变量
 * @returns 可选门控参数
 */
export function resolveRagSearchQualityGate(
  env: NodeJS.ProcessEnv,
): RagSearchQualityGate {
  return {
    minScore: normalizeNonNegativeNumber(env.RAG_SEARCH_MIN_SCORE),
    minScoreGap: normalizeNonNegativeNumber(env.RAG_SEARCH_MIN_SCORE_GAP),
  }
}

/**
 * 对已排序的检索结果执行“阈值 + 断层”门控。
 *
 * @param matches 已按 score 降序排列的结果
 * @param gate 门控参数
 * @returns 过滤后的结果
 */
export function applyRagSearchQualityGate(
  matches: RagSearchMatch[],
  gate: RagSearchQualityGate,
): RagSearchMatch[] {
  let filteredMatches = matches

  if (gate.minScore !== undefined) {
    filteredMatches = filteredMatches.filter((item) => item.score >= gate.minScore!)
  }

  if (
    gate.minScoreGap !== undefined &&
    filteredMatches.length > 1 &&
    filteredMatches[0] &&
    filteredMatches[1]
  ) {
    const topScoreGap = filteredMatches[0].score - filteredMatches[1].score

    if (topScoreGap >= gate.minScoreGap) {
      return [filteredMatches[0]]
    }
  }

  return filteredMatches
}
