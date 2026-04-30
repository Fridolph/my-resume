import { describe, expect, it } from 'vitest'

import {
  applyRagSearchRerank,
  detectRagSearchQuestionStrategy,
  rerankRagSearchMatches,
} from '../rag-search-rerank'
import { DEFAULT_RAG_SEARCH_RERANK_CONFIG } from '../config/rag-search-rerank.config'
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

  it('should allow tuning behavior via externalized rerank config', () => {
    const noBoostConfig = {
      ...DEFAULT_RAG_SEARCH_RERANK_CONFIG,
      sectionBoost: {
        ...DEFAULT_RAG_SEARCH_RERANK_CONFIG.sectionBoost,
        experience: {
          projects: {
            default: 0,
            summary: 0,
          },
          work_experience: {
            default: 0,
            summary: 0,
          },
          core_strengths: {
            default: 0,
          },
          skills: {
            default: 0,
          },
        },
      },
      thresholds: {
        ...DEFAULT_RAG_SEARCH_RERANK_CONFIG.thresholds,
        keywordBoostPerHit: 0,
        keywordBoostMax: 0,
      },
    }

    const topMatches = applyRagSearchRerank(
      baseMatches,
      '这个候选人有哪些 AI Agent 开发相关经验？',
      2,
      'experience',
      noBoostConfig,
    )

    expect(topMatches.map((item) => item.id)).toEqual(['skills-1', 'project-1'])
  })

  it('should attenuate section boost when experience query has no topic hit on projects chunk', () => {
    // 经验类问题下，projects chunk 不含 AI/Agent 关键词时，section boost 应衰减
    const mismatchedProject: RagSearchMatch = {
      id: 'project-no-ai',
      title: '某内部工具项目',
      section: 'projects',
      content: '主导公司内部 CRM 系统的前端重构与性能优化',
      score: 0.6,
    }

    const skillChunk: RagSearchMatch = {
      id: 'skills-ai',
      title: 'AI 全栈技能',
      section: 'skills',
      content: '具备 AI Agent 开发经验，熟悉多 Agent 工作流编排与流式 SSE 推送',
      score: 0.6,
    }

    const reranked = rerankRagSearchMatches(
      [mismatchedProject, skillChunk],
      '这个候选人有哪些 AI Agent 开发相关经验？',
    )

    const projectResult = reranked.find((item) => item.match.id === 'project-no-ai')
    const skillsResult = reranked.find((item) => item.match.id === 'skills-ai')

    expect(projectResult?.topicHit).toBe(false)
    expect(skillsResult?.topicHit).toBe(true)
    // project boost 衰减后应低于 0.1（原值 0.1 × 0.35 = 0.035）
    expect(projectResult!.sectionBoost).toBeLessThan(0.1)
    expect(projectResult!.sectionBoost).toBeGreaterThan(0)
    expect(projectResult?.noiseReasons).toContain('与问题主题缺少直接文本关联')
    // skills 虽被 section 惩罚(-0.02)但命中主题 + keyword hit，最终排名靠前
    expect(reranked[0]?.match.id).toBe('skills-ai')
  })
})
