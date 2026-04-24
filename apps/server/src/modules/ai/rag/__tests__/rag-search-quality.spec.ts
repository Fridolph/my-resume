import { describe, expect, it } from 'vitest'

import {
  applyRagSearchQualityGate,
  resolveRagSearchQualityGate,
} from '../rag-search-quality'
import { RagSearchMatch } from '../rag.types'

const matches: RagSearchMatch[] = [
  {
    id: 'chunk-1',
    title: 'Top 1',
    section: 'knowledge',
    content: 'top content',
    score: 0.72,
  },
  {
    id: 'chunk-2',
    title: 'Top 2',
    section: 'knowledge',
    content: 'second content',
    score: 0.53,
  },
  {
    id: 'chunk-3',
    title: 'Top 3',
    section: 'knowledge',
    content: 'third content',
    score: 0.41,
  },
]

describe('rag search quality gate', () => {
  it('should parse minScore and minScoreGap from env', () => {
    const gate = resolveRagSearchQualityGate({
      RAG_SEARCH_MIN_SCORE: '0.55',
      RAG_SEARCH_MIN_SCORE_GAP: '0.15',
    })

    expect(gate.minScore).toBe(0.55)
    expect(gate.minScoreGap).toBe(0.15)
  })

  it('should ignore invalid env values', () => {
    const gate = resolveRagSearchQualityGate({
      RAG_SEARCH_MIN_SCORE: '-1',
      RAG_SEARCH_MIN_SCORE_GAP: 'not-a-number',
    })

    expect(gate.minScore).toBeUndefined()
    expect(gate.minScoreGap).toBeUndefined()
  })

  it('should filter by minScore', () => {
    const filtered = applyRagSearchQualityGate(matches, {
      minScore: 0.5,
    })

    expect(filtered.map((item) => item.id)).toEqual(['chunk-1', 'chunk-2'])
  })

  it('should keep only top1 when score gap is large enough', () => {
    const filtered = applyRagSearchQualityGate(matches, {
      minScore: 0.5,
      minScoreGap: 0.15,
    })

    expect(filtered.map((item) => item.id)).toEqual(['chunk-1'])
  })
})
