import { describe, expect, it } from 'vitest'

import {
  compareUserDocChunkingStrategies,
  resolveUserDocChunkingStrategy,
  splitUserDocByMarkdownSections,
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
  it('should resolve balanced profile as safe default strategy', () => {
    const strategy = resolveUserDocChunkingStrategy()

    expect(strategy).toMatchObject({
      label: '500/50',
      chunkSize: 500,
      chunkOverlap: 50,
    })
  })

  it('should resolve contextual profile to larger context strategy', () => {
    const strategy = resolveUserDocChunkingStrategy('contextual')

    expect(strategy).toMatchObject({
      label: '1000/100',
      chunkSize: 1000,
      chunkOverlap: 100,
    })
  })

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

  it('should split markdown by ## sections with semantic strategy', () => {
    const md = `
## 工作经历

2024-至今 在成都澳昇能源担任全栈工程师

## 项目经历

### my-resume 在线简历

从 0 到 1 搭建全栈应用
    `.trim()

    const chunks = splitUserDocByMarkdownSections(md)

    expect(chunks.length).toBeGreaterThanOrEqual(2)
    expect(chunks.some((c) => c.includes('工作经历'))).toBe(true)
    expect(chunks.some((c) => c.includes('项目经历'))).toBe(true)
    // 语义分块不会把两段合并
    expect(chunks.filter((c) => c.includes('工作经历') && c.includes('项目经历')).length).toBe(0)
  })

  it('should fallback to paragraph split for plain text without ##', () => {
    const text = '第一段内容\n\n第二段内容\n\n第三段内容'
    const chunks = splitUserDocByMarkdownSections(text)

    expect(chunks.length).toBeGreaterThanOrEqual(2)
    expect(chunks.some((c) => c.includes('第一段'))).toBe(true)
    expect(chunks.some((c) => c.includes('第二段'))).toBe(true)
  })

  it('should handle empty input', () => {
    expect(splitUserDocByMarkdownSections('')).toEqual([])
    expect(splitUserDocByMarkdownSections('   ')).toEqual([])
  })
})
