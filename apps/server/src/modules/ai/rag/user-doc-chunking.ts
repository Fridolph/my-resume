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
 * user_docs 切块策略定义。
 */
export interface UserDocChunkingStrategy {
  label: string
  chunkSize: number
  chunkOverlap: number
}

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

/**
 * 规范化原始文本，保证切块输入稳定。
 *
 * @param text 原始文本
 * @returns 规范化后的文本
 */
export function normalizeUserDocText(text: string): string {
  return text.replace(/\r\n/g, '\n').replace(/\n{3,}/g, '\n\n').trim()
}

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
  const chunks = splitUserDocTextIntoChunks(
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
