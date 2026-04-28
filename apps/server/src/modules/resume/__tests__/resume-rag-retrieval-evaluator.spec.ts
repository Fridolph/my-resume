import { describe, expect, it } from 'vitest'

import {
  evaluateResumeRagRetrieval,
  rankResumeSemanticChunksByKeywordQuery,
} from '../application/services/resume-rag-retrieval-evaluator'
import type { ResumeRagSemanticChunk } from '../application/services/resume-rag-semantic-chunking'

function createChunk(
  input: Pick<
    ResumeRagSemanticChunk,
    'chunkIndex' | 'section' | 'entityType' | 'title' | 'subsectionTitle' | 'content'
  >,
): ResumeRagSemanticChunk {
  return {
    stableKey: `chunk:${input.chunkIndex}`,
    subsectionKey: input.subsectionTitle,
    tags: [input.section],
    chunkCount: 3,
    contentHash: `hash-${input.chunkIndex}`,
    ...input,
  }
}

describe('resume rag retrieval evaluator', () => {
  it('should rank semantic chunks by keyword query', () => {
    const chunks = [
      createChunk({
        chunkIndex: 0,
        section: 'skills',
        entityType: 'skill_group',
        title: 'Frontend Core',
        subsectionTitle: 'Frontend Core',
        content: 'TypeScript Vue React 工程化',
      }),
      createChunk({
        chunkIndex: 1,
        section: 'projects',
        entityType: 'project_summary',
        title: 'Quotation System',
        subsectionTitle: 'Quotation System',
        content: '项目 使用 TypeScript 处理复杂权限、报价计算和多方案对比',
      }),
      createChunk({
        chunkIndex: 2,
        section: 'profile',
        entityType: 'profile_summary',
        title: 'Profile',
        subsectionTitle: 'Profile',
        content: 'JavaScript full-stack engineer',
      }),
    ]

    const matches = rankResumeSemanticChunksByKeywordQuery(chunks, 'TypeScript 复杂权限 项目')

    expect(matches[0]).toMatchObject({
      section: 'projects',
      entityType: 'project_summary',
      title: 'Quotation System',
    })
    expect(matches[0]?.score).toBeGreaterThan(matches[1]?.score ?? 0)
  })

  it('should compare full text score with semantic chunk visibility', () => {
    const chunks = [
      createChunk({
        chunkIndex: 0,
        section: 'skills',
        entityType: 'skill_group',
        title: 'Skills',
        subsectionTitle: 'Skills',
        content: 'Vue TypeScript',
      }),
      createChunk({
        chunkIndex: 1,
        section: 'work_experience',
        entityType: 'experience_summary',
        title: 'Aosheng / Frontend Engineer',
        subsectionTitle: 'Aosheng',
        content: '负责项目创建、设计、报价与展示链路',
      }),
    ]

    const result = evaluateResumeRagRetrieval({
      query: '报价 项目',
      semanticChunks: chunks,
      fullText: chunks.map((chunk) => chunk.content).join('\n'),
      limit: 2,
    })

    expect(result.fullTextScore).toBeGreaterThan(0)
    expect(result.hitChunkCount).toBe(1)
    expect(result.hitSections).toMatchObject({
      work_experience: 1,
    })
    expect(result.topMatches[0]?.section).toBe('work_experience')
  })
})
