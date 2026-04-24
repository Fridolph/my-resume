import {
  resolveUserDocChunkingStrategy,
  splitUserDocTextIntoChunks,
  type UserDocChunkingProfile,
} from './user-doc-chunking'

/**
 * 单个 chunk 的关键词检索评分结果。
 */
export interface UserDocKeywordChunkMatch {
  chunkIndex: number
  content: string
  score: number
}

/**
 * 单个 profile 的检索评估摘要。
 */
export interface UserDocRetrievalProfileSummary {
  profile: UserDocChunkingProfile
  chunkSize: number
  chunkOverlap: number
  chunkCount: number
  hitChunkCount: number
  topScore: number
  avgTopScore: number
  topMatches: UserDocKeywordChunkMatch[]
}

/**
 * 评估输入参数。
 */
export interface EvaluateUserDocRetrievalInput {
  text: string
  query: string
  limit?: number
  profiles?: readonly UserDocChunkingProfile[]
}

function buildSearchTokens(text: string): string[] {
  const normalized = text.trim().toLowerCase()
  const latinTokens = normalized.match(/[a-z0-9.+#-]+/g) ?? []
  const hanSequences = normalized.match(/[\p{Script=Han}]+/gu) ?? []
  const hanBigrams = hanSequences.flatMap((item) => {
    if (item.length === 1) {
      return [item]
    }

    const tokens: string[] = []

    for (let index = 0; index < item.length - 1; index += 1) {
      tokens.push(item.slice(index, index + 2))
    }

    return tokens
  })

  return [...new Set([...latinTokens, ...hanBigrams])]
}

/**
 * 基于关键词命中率计算 chunk 相关性分数。
 *
 * @param query 查询
 * @param content chunk 内容
 * @returns 关键词命中分数（0~1）
 */
export function calculateKeywordScore(query: string, content: string): number {
  const queryTokens = buildSearchTokens(query)

  if (queryTokens.length === 0) {
    return 0
  }

  const normalizedContent = content.toLowerCase()
  const hitCount = queryTokens.filter((token) => normalizedContent.includes(token)).length

  return hitCount / queryTokens.length
}

/**
 * 对切块结果按 query 做关键词检索排序。
 *
 * @param chunks 切块列表
 * @param query 查询
 * @param limit 返回条数
 * @returns top-N 命中列表
 */
export function rankUserDocChunksByKeywordQuery(
  chunks: readonly string[],
  query: string,
  limit = 3,
): UserDocKeywordChunkMatch[] {
  return chunks
    .map((content, chunkIndex) => ({
      chunkIndex,
      content,
      score: Number(calculateKeywordScore(query, content).toFixed(6)),
    }))
    .sort((left, right) => right.score - left.score)
    .slice(0, Math.max(Math.floor(limit), 0))
}

/**
 * 比较同一文本在多种切片 profile 下的关键词检索效果。
 *
 * 说明：
 * - 该评估不依赖 embedding，可用于低成本本地实验；
 * - 指标只用于“策略对比”，不直接替代线上召回质量结论。
 *
 * @param input 评估输入
 * @returns 各 profile 的检索摘要
 */
export function evaluateUserDocRetrievalByProfiles(
  input: EvaluateUserDocRetrievalInput,
): UserDocRetrievalProfileSummary[] {
  const profiles = input.profiles ?? ['balanced', 'contextual']
  const limit = input.limit ?? 3

  return profiles.map((profile) => {
    const strategy = resolveUserDocChunkingStrategy(profile)
    const chunks = splitUserDocTextIntoChunks(
      input.text,
      strategy.chunkSize,
      strategy.chunkOverlap,
    )
    const topMatches = rankUserDocChunksByKeywordQuery(chunks, input.query, limit)
    const hitChunkCount = chunks.filter((chunk) => calculateKeywordScore(input.query, chunk) > 0)
      .length
    const topScore = topMatches[0]?.score ?? 0
    const avgTopScore =
      topMatches.length > 0
        ? Number(
            (
              topMatches.reduce((sum, item) => sum + item.score, 0) / topMatches.length
            ).toFixed(6),
          )
        : 0

    return {
      profile,
      chunkSize: strategy.chunkSize,
      chunkOverlap: strategy.chunkOverlap,
      chunkCount: chunks.length,
      hitChunkCount,
      topScore,
      avgTopScore,
      topMatches,
    }
  })
}
