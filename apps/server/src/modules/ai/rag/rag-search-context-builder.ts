import { RagIndexedChunk, RagSearchMatch } from './rag.types'
import { cosineSimilarity } from './utils/math'

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
 * 计算关键词命中分数（0~1）。
 *
 * @param query 用户问题
 * @param content 候选内容
 * @returns 关键词命中分
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
 * 基于本地索引构建检索上下文（仅评分 + 排序，不负责重排和截断）。
 *
 * @param input 构建参数
 * @returns 按混合分数降序排列的全部匹配
 */
export function buildLocalRagSearchContext(input: {
  query: string
  queryVector: number[]
  chunks: RagIndexedChunk[]
}): RagSearchMatch[] {
  const scoredMatches = input.chunks
    .map((chunk) => ({
      id: chunk.id,
      title: chunk.title,
      section: chunk.section,
      content: chunk.content,
      sourceType: chunk.sourceType,
      sourcePath: chunk.sourcePath,
      tags: chunk.tags,
      contentType: chunk.contentType,
      knowledgeDomain: chunk.knowledgeDomain,
      sourceCollection: chunk.sourceCollection,
      renderHint: chunk.renderHint,
      score: Number(
        (
          cosineSimilarity(input.queryVector, chunk.embedding) * 0.7 +
          calculateKeywordScore(input.query, chunk.content) * 0.3
        ).toFixed(6),
      ),
    }))
    .sort((left, right) => right.score - left.score)

  return scoredMatches
}
