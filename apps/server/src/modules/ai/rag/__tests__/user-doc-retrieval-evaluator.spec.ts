import { describe, expect, it } from 'vitest'

import {
  calculateKeywordScore,
  evaluateUserDocRetrievalByProfiles,
  rankUserDocChunksByKeywordQuery,
} from '../user-doc-retrieval-evaluator'

describe('user doc retrieval evaluator', () => {
  it('should rank keyword-matched chunks first', () => {
    const matches = rankUserDocChunksByKeywordQuery(
      [
        '这段只讲简历项目经验。',
        'Milvus 向量检索用于 RAG 召回。',
        '这段是其它无关内容。',
      ],
      'Milvus 检索',
      2,
    )

    expect(matches).toHaveLength(2)
    expect(matches[0]?.content).toContain('Milvus')
    expect(matches[0]?.score).toBeGreaterThan(0)
  })

  it('should compare balanced and contextual profiles', () => {
    const text =
      `${'A'.repeat(1200)}\n\nMilvus 向量检索实验记录。\n\n${'B'.repeat(1200)}`
    const [balanced, contextual] = evaluateUserDocRetrievalByProfiles({
      text,
      query: 'Milvus 检索',
      limit: 3,
    })

    expect(balanced?.profile).toBe('balanced')
    expect(contextual?.profile).toBe('contextual')
    expect((balanced?.chunkCount ?? 0) > (contextual?.chunkCount ?? 0)).toBe(true)
    expect(balanced?.topScore).toBeGreaterThan(0)
    expect(contextual?.topScore).toBeGreaterThan(0)
  })

  it('should return zero scores for empty or unmatched query', () => {
    expect(calculateKeywordScore('', 'Milvus 检索')).toBe(0)

    const [summary] = evaluateUserDocRetrievalByProfiles({
      text: '纯中文内容',
      query: 'unmatched-token',
      profiles: ['balanced'],
      limit: 2,
    })

    expect(summary?.topScore).toBe(0)
    expect(summary?.hitChunkCount).toBe(0)
  })
})
