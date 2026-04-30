import { describe, expect, it } from 'vitest'

import {
  buildLocalRagSearchContext,
  calculateKeywordScore,
  cosineSimilarity,
} from '../rag-search-context-builder'
import { RagIndexedChunk } from '../rag.types'

describe('rag search context builder', () => {
  it('should calculate cosine similarity for aligned vectors', () => {
    expect(cosineSimilarity([1, 0], [1, 0])).toBe(1)
    expect(cosineSimilarity([1, 0], [0, 1])).toBe(0)
  })

  it('should calculate keyword score based on token hit ratio', () => {
    const score = calculateKeywordScore('Milvus 检索', 'Milvus 检索用于 RAG')

    expect(score).toBeGreaterThan(0)
    expect(score).toBeLessThanOrEqual(1)
  })

  it('should score and sort all local chunks by hybrid score without truncation', () => {
    const chunks: RagIndexedChunk[] = [
      {
        id: 'skills-1',
        title: 'AI Agent 开发',
        section: 'skills',
        content: '高频使用 Claude Code、Cursor、Codex 协作开发',
        embedding: [1, 0, 0],
      },
      {
        id: 'project-1',
        title: 'my-resume AI 工作台',
        section: 'projects',
        content: '项目概览：实现 AI 工作台与 SSE 流式输出，支持多 Agent 工作流',
        embedding: [0.98, 0.02, 0],
      },
      {
        id: 'misc-1',
        title: '其他记录',
        section: 'knowledge',
        content: '这是一条和当前问题关联较弱的记录',
        embedding: [0.1, 0.9, 0],
      },
    ]

    const matches = buildLocalRagSearchContext({
      query: '这个候选人有哪些 AI Agent 开发相关经验？',
      queryVector: [1, 0, 0],
      chunks,
    })

    // 返回全部 3 条按混合分数排序，project-1 因关键词匹配"AI Agent 工作流"得分更高
    expect(matches).toHaveLength(3)
    expect(matches[0].score).toBeGreaterThan(0)
    expect(matches[0].id).toBe('project-1')
  })
})
