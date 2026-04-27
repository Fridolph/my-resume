import { RagIndexedChunk, RagSearchMatch } from './rag.types'
import { applyRagSearchRerank } from './rag-search-rerank'

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
 * 计算两个向量的余弦相似度。
 *
 * @param vectorA 向量 A
 * @param vectorB 向量 B
 * @returns 余弦相似度
 */
export function cosineSimilarity(vectorA: number[], vectorB: number[]): number {
  if (vectorA.length === 0 || vectorB.length === 0) {
    return 0
  }

  const length = Math.min(vectorA.length, vectorB.length)
  let dot = 0
  let magnitudeA = 0
  let magnitudeB = 0

  for (let index = 0; index < length; index += 1) {
    dot += vectorA[index] * vectorB[index]
    magnitudeA += vectorA[index] * vectorA[index]
    magnitudeB += vectorB[index] * vectorB[index]
  }

  if (magnitudeA === 0 || magnitudeB === 0) {
    return 0
  }

  return dot / (Math.sqrt(magnitudeA) * Math.sqrt(magnitudeB))
}

/**
 * 基于本地索引构建检索上下文（评分 + 排序 + rerank）。
 *
 * @param input 构建参数
 * @returns 本地检索命中列表
 */
export function buildLocalRagSearchContext(input: {
  query: string
  queryVector: number[]
  chunks: RagIndexedChunk[]
  limit: number
}): RagSearchMatch[] {
  const scoredMatches = input.chunks
    .map((chunk) => ({
      id: chunk.id,
      title: chunk.title,
      section: chunk.section,
      content: chunk.content,
      sourceType: chunk.sourceType,
      sourcePath: chunk.sourcePath,
      score: Number(
        (
          cosineSimilarity(input.queryVector, chunk.embedding) * 0.7 +
          calculateKeywordScore(input.query, chunk.content) * 0.3
        ).toFixed(6),
      ),
    }))
    .sort((left, right) => right.score - left.score)

  return applyRagSearchRerank(scoredMatches, input.query, input.limit)
}
