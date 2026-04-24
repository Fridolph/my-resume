import { describe, expect, it } from 'vitest'

import {
  applyRagSearchRerank,
  detectRagSearchQuestionStrategy,
  rerankRagSearchMatches,
} from '../rag-search-rerank'
import { RagSearchMatch } from '../rag.types'

const baseMatches: RagSearchMatch[] = [
  {
    id: 'skills-1',
    title: 'AI Agent 开发',
    section: 'skills',
    content: '高频使用 Claude Code、Cursor、Codex 协作开发',
    score: 0.66,
  },
  {
    id: 'project-1',
    title: 'my-resume AI 工作台',
    section: 'projects',
    content: '项目概览：实现 AI 工作台与 SSE 流式输出，支持多 Agent 工作流',
    score: 0.62,
  },
  {
    id: 'misc-1',
    title: '其他记录',
    section: 'knowledge',
    content: '这是一条和当前问题关联较弱的记录',
    score: 0.43,
  },
]

describe('rag search rerank', () => {
  it('should detect question strategy from query text', () => {
    expect(detectRagSearchQuestionStrategy('这个候选人有哪些 AI Agent 开发相关经验？')).toBe(
      'experience',
    )
    expect(detectRagSearchQuestionStrategy('这个候选人擅长哪些技能？')).toBe('skill')
  })

  it('should rerank experience query to prioritize project evidence', () => {
    const reranked = rerankRagSearchMatches(
      baseMatches,
      '这个候选人有哪些 AI Agent 开发相关经验？',
    )

    expect(reranked[0]?.match.id).toBe('project-1')
    expect(reranked[0]?.rerankScore).toBeGreaterThan(reranked[0]?.baseScore ?? 0)
    expect(reranked[0]?.matchedHints.length).toBeGreaterThan(0)
  })

  it('should provide noise reasons for low relevance tail records', () => {
    const reranked = rerankRagSearchMatches(
      baseMatches,
      '这个候选人有哪些 AI Agent 开发相关经验？',
    )
    const tail = reranked.find((item) => item.match.id === 'misc-1')

    expect(tail).toBeDefined()
    expect(tail?.noiseReasons.length).toBeGreaterThan(0)
    expect(tail?.noiseReasons).toContain('原始分数偏低')
  })

  it('should return API-ready matches after rerank and limit', () => {
    const topMatches = applyRagSearchRerank(
      baseMatches,
      '这个候选人有哪些 AI Agent 开发相关经验？',
      2,
    )

    expect(topMatches.map((item) => item.id)).toEqual(['project-1', 'skills-1'])
  })
})
