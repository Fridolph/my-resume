import { calculateKeywordScore } from '../../../ai/rag/user-doc-retrieval-evaluator'
import type {
  ResumeRagSemanticChunk,
  ResumeRagSemanticSection,
} from './resume-rag-semantic-chunking'

export interface ResumeRagKeywordChunkMatch {
  chunkIndex: number
  section: ResumeRagSemanticSection
  entityType: ResumeRagSemanticChunk['entityType']
  title: string
  subsectionTitle: string
  score: number
  content: string
}

export interface ResumeRagRetrievalEvaluation {
  query: string
  fullTextScore: number
  semanticChunkCount: number
  hitChunkCount: number
  hitSections: Partial<Record<ResumeRagSemanticSection, number>>
  topMatches: ResumeRagKeywordChunkMatch[]
}

export interface EvaluateResumeRagRetrievalInput {
  query: string
  semanticChunks: readonly ResumeRagSemanticChunk[]
  fullText: string
  limit?: number
}

/**
 * 对 resume_core 语义块做关键词检索排序。
 *
 * 这是低成本学习实验工具，不替代线上 embedding 检索。
 */
export function rankResumeSemanticChunksByKeywordQuery(
  chunks: readonly ResumeRagSemanticChunk[],
  query: string,
  limit = 5,
): ResumeRagKeywordChunkMatch[] {
  return chunks
    .map((chunk) => ({
      chunkIndex: chunk.chunkIndex,
      section: chunk.section,
      entityType: chunk.entityType,
      title: chunk.title,
      subsectionTitle: chunk.subsectionTitle,
      score: Number(calculateKeywordScore(query, chunk.content).toFixed(6)),
      content: chunk.content,
    }))
    .sort((left, right) => right.score - left.score)
    .slice(0, Math.max(Math.floor(limit), 0))
}

/**
 * 比较“全文块”和“语义块”的关键词检索可见性。
 *
 * 重点观察：
 * - 语义块是否能把 projects / work_experience 等证据推到 top matches；
 * - 全文块只给一个整体分数，无法解释具体证据来自哪里。
 */
export function evaluateResumeRagRetrieval(
  input: EvaluateResumeRagRetrievalInput,
): ResumeRagRetrievalEvaluation {
  const topMatches = rankResumeSemanticChunksByKeywordQuery(
    input.semanticChunks,
    input.query,
    input.limit,
  )
  const hitSections: Partial<Record<ResumeRagSemanticSection, number>> = {}

  for (const chunk of input.semanticChunks) {
    const score = calculateKeywordScore(input.query, chunk.content)

    if (score <= 0) {
      continue
    }

    hitSections[chunk.section] = (hitSections[chunk.section] ?? 0) + 1
  }

  return {
    query: input.query,
    fullTextScore: Number(calculateKeywordScore(input.query, input.fullText).toFixed(6)),
    semanticChunkCount: input.semanticChunks.length,
    hitChunkCount: input.semanticChunks.filter(
      (chunk) => calculateKeywordScore(input.query, chunk.content) > 0,
    ).length,
    hitSections,
    topMatches,
  }
}
