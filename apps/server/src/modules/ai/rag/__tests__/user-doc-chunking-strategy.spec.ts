import { describe, expect, it } from 'vitest'

import {
  compareUserDocChunkingStrategies,
  UserDocChunkingStrategy,
} from '../user-doc-chunking'

const STRATEGIES: readonly UserDocChunkingStrategy[] = [
  {
    label: '500/50',
    chunkSize: 500,
    chunkOverlap: 50,
  },
  {
    label: '1000/100',
    chunkSize: 1000,
    chunkOverlap: 100,
  },
]

describe('user docs chunking strategy baseline', () => {
  it('should show smaller strategy creates more chunks and higher redundancy', () => {
    const text = 'A'.repeat(2400)
    const [smallStrategy, largeStrategy] = compareUserDocChunkingStrategies(
      text,
      STRATEGIES,
    )

    expect(smallStrategy?.label).toBe('500/50')
    expect(largeStrategy?.label).toBe('1000/100')
    expect(smallStrategy?.chunkCount).toBe(6)
    expect(largeStrategy?.chunkCount).toBe(3)
    expect(smallStrategy?.redundantChars).toBe(250)
    expect(largeStrategy?.redundantChars).toBe(200)
    expect(smallStrategy?.redundancyRatio).toBeGreaterThan(largeStrategy?.redundancyRatio ?? 0)
  })

  it('should keep both strategies at one chunk for short text', () => {
    const [smallStrategy, largeStrategy] = compareUserDocChunkingStrategies(
      'short text',
      STRATEGIES,
    )

    expect(smallStrategy?.chunkCount).toBe(1)
    expect(largeStrategy?.chunkCount).toBe(1)
    expect(smallStrategy?.redundantChars).toBe(0)
    expect(largeStrategy?.redundantChars).toBe(0)
  })

  it('should return zero metrics for empty normalized text', () => {
    const [smallStrategy, largeStrategy] = compareUserDocChunkingStrategies(
      ' \n\n ',
      STRATEGIES,
    )

    expect(smallStrategy?.sourceChars).toBe(0)
    expect(largeStrategy?.sourceChars).toBe(0)
    expect(smallStrategy?.chunkCount).toBe(0)
    expect(largeStrategy?.chunkCount).toBe(0)
  })
})
