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
  it('should resolve semantic as default strategy (#218)', () => {
    const strategy = resolveUserDocChunkingStrategy()

    expect(strategy).toMatchObject({
      label: 'semantic',
      chunkSize: 0,
      chunkOverlap: 0,
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

  it('should have no overlap between semantic chunks (#217)', () => {
    const md = `
## 项目一

这是第一个项目的详细描述，包含多方面的技术细节。

## 项目二

这是第二个项目的详细描述，同样包含丰富的信息。
    `.trim()
    const chunks = splitUserDocByMarkdownSections(md)

    expect(chunks.length).toBe(2)

    // 验证无 overlap：任两个相邻 chunk 内容不重叠
    for (let i = 1; i < chunks.length; i++) {
      const prev = chunks[i - 1]
      const curr = chunks[i]
      // 语义分块不应有相同内容
      expect(prev).not.toBe(curr)
      // 前一个 chunk 的尾部和后一个 chunk 的头部不应相同
      expect(prev.slice(-20)).not.toBe(curr.slice(0, 20))
    }
  })

  it('should match chunk count to ## heading count (#217)', () => {
    const md = ['## 经历', '内容A', '## 技能', '内容B', '## 项目', '内容C'].join('\n\n')
    const chunks = splitUserDocByMarkdownSections(md)

    // 3个 ## 标题 → 3个 chunk
    expect(chunks.length).toBe(3)
    expect(chunks[0]).toContain('经历')
    expect(chunks[1]).toContain('技能')
    expect(chunks[2]).toContain('项目')
  })
})
