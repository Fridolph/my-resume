/**
 * user_docs 默认切块大小（字符）。
 *
 * 说明：
 * - 相比 resume_core，user_docs（博客/笔记）文本跨度更大，过大的 chunk 会稀释检索精度。
 * - 这里取 500，优先保证召回粒度与可解释性。
 */
export const DEFAULT_CHUNK_SIZE = 500

/**
 * user_docs 默认切块重叠长度（字符）。
 *
 * 说明：
 * - overlap 用于减少语义断裂；
 * - 过大会带来冗余，过小会丢失上下文衔接。
 * - 这里取 50，作为教学场景下的折中默认值。
 */
export const DEFAULT_CHUNK_OVERLAP = 50

/**
 * user_docs 自定义切块大小下限（字符）。
 *
 * 说明：
 * - 简历/资料结构化片段可能很短，允许小到 4 字符用于教学和实验；
 * - 过小会增加 chunk 数量，Admin 会提示用户谨慎使用。
 */
export const MIN_CHUNK_SIZE = 4

/**
 * user_docs 自定义切块大小上限（字符）。
 */
export const MAX_CHUNK_SIZE = 6666

/**
 * user_docs 自定义重叠长度下限（字符）。
 */
export const MIN_CHUNK_OVERLAP = 0

/**
 * user_docs 自定义重叠长度上限（字符）。
 */
export const MAX_CHUNK_OVERLAP = 300

/**
 * user_docs 切块策略定义。
 */
export interface UserDocChunkingStrategy {
  label: string
  chunkSize: number
  chunkOverlap: number
}

/**
 * 解析 user_docs 切块配置所需的输入。
 */
export interface ResolveUserDocChunkingConfigInput {
  profile?: UserDocChunkingProfile
  chunkSize?: unknown
  chunkOverlap?: unknown
}

/**
 * user_docs 切片 profile（对外稳定键）。
 */
export type UserDocChunkingProfile = 'balanced' | 'contextual' | 'semantic'

/**
 * 对比实验默认策略（本轮只关注两组参数）。
 */
export const USER_DOC_CHUNKING_STRATEGIES: readonly UserDocChunkingStrategy[] = [
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

/**
 * 切片 profile 到策略映射。
 */
export const USER_DOC_CHUNKING_PROFILE_MAP: Record<
  UserDocChunkingProfile,
  UserDocChunkingStrategy
> = {
  balanced: USER_DOC_CHUNKING_STRATEGIES[0],
  contextual: USER_DOC_CHUNKING_STRATEGIES[1],
  semantic: {
    label: 'semantic',
    chunkSize: 0,
    chunkOverlap: 0,
  },
}

/**
 * 单个切块策略的统计摘要。
 */
export interface UserDocChunkingSummary {
  label: string
  sourceChars: number
  chunkSize: number
  chunkOverlap: number
  chunkCount: number
  minChunkChars: number
  maxChunkChars: number
  avgChunkChars: number
  totalChunkChars: number
  redundantChars: number
  redundancyRatio: number
}

import { normalizeExtractedText } from '../application/services/file-extraction.service'

/**
 * 规范化原始文本，保证切块输入稳定。
 *
 * @param text 原始文本
 * @returns 规范化后的文本
 */
export const normalizeUserDocText = normalizeExtractedText

/**
 * 将提取后的文本按固定窗口切块，并保留 overlap。
 *
 * @param text 原始文本
 * @param chunkSize 每块最大字符数
 * @param chunkOverlap 相邻块重叠字符数
 * @returns 切分后的 chunk 文本列表
 */
export function splitUserDocTextIntoChunks(
  text: string,
  chunkSize = DEFAULT_CHUNK_SIZE,
  chunkOverlap = DEFAULT_CHUNK_OVERLAP,
): string[] {
  const normalizedText = normalizeUserDocText(text)

  if (!normalizedText) {
    return []
  }

  const safeChunkSize = Math.max(Math.floor(chunkSize), 1)
  const safeChunkOverlap = Math.min(Math.max(Math.floor(chunkOverlap), 0), safeChunkSize - 1)
  const step = safeChunkSize - safeChunkOverlap
  const chunks: string[] = []

  for (let start = 0; start < normalizedText.length; start += step) {
    const chunk = normalizedText.slice(start, start + safeChunkSize).trim()

    if (chunk) {
      chunks.push(chunk)
    }

    if (start + safeChunkSize >= normalizedText.length) {
      break
    }
  }

  return chunks
}

/**
 * 按 Markdown 结构语义分块：先按 ## 标题分段，段过长时按段落二次拆分。
 *
 * ## 标题是文档作者给出的天然语义边界。纯文本（无 ##）回退到按段落拆分。
 * 段内超过 2000 字符时按 `\n\n` 继续拆，避免单 chunk 过长稀释检索精度。
 *
 * @param text 规范化后的 Markdown 文本
 * @returns 语义分块结果
 */
export function splitUserDocByMarkdownSections(text: string): string[] {
  const normalized = normalizeUserDocText(text)
  if (!normalized) return []

  // 1. 按 ## 标题拆分（只分二级标题，### 保留在父 section 内）
  const SECTION_RE = /^##\s+.+$/gm
  const headerPositions: Array<{ index: number; header: string }> = []
  let m: RegExpExecArray | null

  while ((m = SECTION_RE.exec(normalized)) !== null) {
    headerPositions.push({ index: m.index, header: m[0] })
  }

  if (headerPositions.length === 0) {
    return splitTextByParagraphs(normalized)
  }

  const sectionChunks: string[] = []

  for (let i = 0; i < headerPositions.length; i++) {
    const current = headerPositions[i]
    const next = headerPositions[i + 1]
    const end = next ? next.index : normalized.length
    const section = normalized.slice(current.index, end).trim()
    if (!section) continue

    sectionChunks.push(
      ...(section.length > 2000 ? splitTextByParagraphs(section) : [section]),
    )
  }

  if (headerPositions[0].index > 0) {
    const preamble = normalized.slice(0, headerPositions[0].index).trim()
    if (preamble) {
      sectionChunks.unshift(
        ...(preamble.length > 2000 ? splitTextByParagraphs(preamble) : [preamble]),
      )
    }
  }

  return sectionChunks
}

function splitTextByParagraphs(text: string): string[] {
  const paragraphs = text.split(/\n{2,}/).map((p) => p.trim()).filter(Boolean)
  const MIN_COMBINED_CHARS = 300

  // 合并过短相邻段落，避免一句话自成一个 chunk
  const result: string[] = []
  let buffer = ''

  for (const para of paragraphs) {
    const candidate = buffer ? `${buffer}\n\n${para}` : para

    if (candidate.length <= MIN_COMBINED_CHARS || para.length < 100) {
      buffer = candidate
    } else {
      if (buffer) result.push(buffer)
      buffer = para
    }
  }

  if (buffer) result.push(buffer)

  // 对合并后仍超长的做句子级保守拆分
  const final: string[] = []
  for (const chunk of result) {
    if (chunk.length <= 2000) {
      final.push(chunk)
    } else {
      const sentences = chunk.split(/(?<=[。！？])\s*/)
      let sentenceBuffer = ''
      for (const sentence of sentences) {
        if ((sentenceBuffer + sentence).length > 2000 && sentenceBuffer) {
          final.push(sentenceBuffer.trim())
          sentenceBuffer = sentence
        } else {
          sentenceBuffer += sentence
        }
      }
      if (sentenceBuffer.trim()) final.push(sentenceBuffer.trim())
    }
  }

  return final
}

/**
 * 统计单个切块策略在当前文本上的结果。
 *
 * @param text 原始文本
 * @param strategy 切块策略
 * @returns 统计摘要
 */
export function summarizeUserDocChunking(
  text: string,
  strategy: UserDocChunkingStrategy,
): UserDocChunkingSummary {
  const normalizedText = normalizeUserDocText(text)
  const chunks =
    strategy.label === 'semantic'
      ? splitUserDocByMarkdownSections(normalizedText)
      : splitUserDocTextIntoChunks(
          normalizedText,
          strategy.chunkSize,
          strategy.chunkOverlap,
        )
  const sourceChars = normalizedText.length
  const totalChunkChars = chunks.reduce((sum, chunk) => sum + chunk.length, 0)
  const minChunkChars = chunks.length > 0 ? Math.min(...chunks.map((chunk) => chunk.length)) : 0
  const maxChunkChars = chunks.length > 0 ? Math.max(...chunks.map((chunk) => chunk.length)) : 0
  const avgChunkChars = chunks.length > 0 ? totalChunkChars / chunks.length : 0
  const redundantChars = Math.max(totalChunkChars - sourceChars, 0)
  const redundancyRatio = sourceChars > 0 ? redundantChars / sourceChars : 0

  return {
    label: strategy.label,
    sourceChars,
    chunkSize: strategy.chunkSize,
    chunkOverlap: strategy.chunkOverlap,
    chunkCount: chunks.length,
    minChunkChars,
    maxChunkChars,
    avgChunkChars,
    totalChunkChars,
    redundantChars,
    redundancyRatio,
  }
}

/**
 * 对一组切块参数做批量对比统计。
 *
 * @param text 原始文本
 * @param strategies 待比较策略
 * @returns 策略统计结果
 */
export function compareUserDocChunkingStrategies(
  text: string,
  strategies: readonly UserDocChunkingStrategy[] = USER_DOC_CHUNKING_STRATEGIES,
): UserDocChunkingSummary[] {
  return strategies.map((strategy) => summarizeUserDocChunking(text, strategy))
}

/**
 * 解析 user_docs 切片 profile。
 *
 * 默认使用 `balanced`（500/50），保持当前行为不变。
 *
 * @param profile 可选 profile
 * @returns profile 对应切片策略
 */
export function resolveUserDocChunkingStrategy(
  profile: UserDocChunkingProfile = 'semantic',
): UserDocChunkingStrategy {
  return USER_DOC_CHUNKING_PROFILE_MAP[profile]
}

/**
 * 解析一个可选的正整数切块参数。
 *
 * @param value 原始输入，可能来自 multipart form-data 字符串
 * @param fieldName 字段名，用于生成可读错误
 * @param min 允许下限
 * @param max 允许上限
 * @returns 解析后的整数，未传则返回 undefined
 */
export function parseOptionalUserDocChunkingNumber(
  value: unknown,
  fieldName: 'chunkSize' | 'chunkOverlap',
  min: number,
  max: number,
): number | undefined {
  if (value === undefined || value === null || value === '') {
    return undefined
  }

  const parsed = typeof value === 'number' ? value : Number(value)

  if (!Number.isInteger(parsed)) {
    throw new Error(`${fieldName} must be an integer`)
  }

  if (parsed < min || parsed > max) {
    throw new Error(`${fieldName} must be between ${min} and ${max}`)
  }

  return parsed
}

/**
 * 解析最终生效的 user_docs 切块配置。
 *
 * profile 提供默认值；若传入 chunkSize/chunkOverlap，则以自定义值覆盖。
 *
 * @param input profile 与可选自定义参数
 * @returns 最终用于切块和 metadata 记录的配置
 */
export function resolveUserDocChunkingConfig(
  input: ResolveUserDocChunkingConfigInput = {},
): UserDocChunkingStrategy {
  const baseStrategy = resolveUserDocChunkingStrategy(input.profile)

  // semantic 策略不需要 chunkSize/chunkOverlap，跳过所有固定窗口校验
  if (baseStrategy.label === 'semantic') {
    return baseStrategy
  }

  const chunkSize =
    parseOptionalUserDocChunkingNumber(
      input.chunkSize,
      'chunkSize',
      MIN_CHUNK_SIZE,
      MAX_CHUNK_SIZE,
    ) ?? baseStrategy.chunkSize
  const chunkOverlap =
    parseOptionalUserDocChunkingNumber(
      input.chunkOverlap,
      'chunkOverlap',
      MIN_CHUNK_OVERLAP,
      MAX_CHUNK_OVERLAP,
    ) ?? baseStrategy.chunkOverlap

  if (chunkOverlap >= chunkSize) {
    throw new Error('chunkOverlap must be less than chunkSize')
  }

  return {
    label: `${chunkSize}/${chunkOverlap}`,
    chunkSize,
    chunkOverlap,
  }
}
