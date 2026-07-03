import { randomUUID } from 'node:crypto'

import type { LocalizedText } from '../../resume/domain/standard-resume'
import type { RagAskCitation } from '../rag/rag.types'
import type {
  AiChatCardMediaPreview,
  AiChatLocale,
  ArticleCardCategory,
  ContentCategory,
} from './ai-chat.types'

// ── 本地化 / 文本 ──

/**
 * 按 locale 读取本地化文本，优先中文，回退英文。
 */
export function readLocalizedText(
  value: LocalizedText,
  locale: AiChatLocale,
): string {
  return (locale === 'en' ? value.en : value.zh || value.en || value.zh).trim()
}

/**
 * 可选文本归一化：trim 或空字符串。
 */
export function normalizeOptionalText(value?: string | null): string {
  return value?.trim() ?? ''
}

// ── 日期 / 周期 ──

/**
 * 格式化起止日期为 "yyyy-MM - yyyy-MM" 或 "yyyy-MM"。
 */
export function formatPeriod(startDate: string, endDate: string): string {
  return [startDate, endDate].filter(Boolean).join(' - ')
}

/**
 * 构建本地日期键（yyyy-MM-dd），用于判断自然日是否变更。
 */
export function buildLocalDateKey(date: Date): string {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

// ── 标识 / 加密 ──

/**
 * 生成 useKey 值（FY- 前缀 + 8 位随机大写 hex）。
 */
export function buildUseKeyValue(): string {
  return `FY-${randomUUID().slice(0, 8).toUpperCase()}`
}

// ── 结构化输出 / 流式 ──

/**
 * 选择结构化输出方法：DeepSeek / Reasoner 用 jsonMode，其他用 functionCalling。
 */
export function chooseStructuredMethod(provider: {
  provider: string
  model: string
}): 'jsonMode' | 'functionCalling' {
  const providerName = provider.provider.toLowerCase()
  const modelName = provider.model.toLowerCase()

  return providerName.includes('deepseek') || modelName.includes('reasoner')
    ? 'jsonMode'
    : 'functionCalling'
}

/**
 * 将答案文本按 28 字符分段，供前端流式渲染使用。
 */
export function chunkAnswerText(answer: string): string[] {
  const compact = answer.trim()

  if (!compact) {
    return []
  }

  const segments = compact.match(/.{1,28}/g)
  return segments?.length ? segments : [compact]
}

// ── 内容分类 ──

/**
 * 将 contentType 归一化为标准内容分类。
 *
 * `media` 归类为 `knowledge_column`，未知类型默认 `tech_blog`。
 */
export function normalizeUserDocCardCategory(
  contentType: string | undefined,
): ContentCategory {
  if (contentType === 'hobby') return 'hobby'
  if (contentType === 'knowledge_column' || contentType === 'media')
    return 'knowledge_column'
  if (contentType === 'general') return 'general'

  return 'tech_blog'
}

/**
 * 将 contentType 归一化为文章卡片分类，hobby 降级为 tech_blog。
 */
export function normalizeArticleCardCategory(
  contentType: string | undefined,
): ArticleCardCategory {
  const category = normalizeUserDocCardCategory(contentType)

  return category === 'hobby' ? 'tech_blog' : category
}

// ── 卡片构建 ──

/**
 * 从 RAG 引用中解析卡片摘要文本，优先 richCard.summary → richCard.description → snippet。
 */
export function resolveCustomCardSummary(citation: RagAskCitation): string {
  return (
    citation.richCard?.summary?.trim() ||
    citation.richCard?.description?.trim() ||
    citation.snippet
  )
}

/**
 * 从 RAG 引用中构建卡片媒体资源列表，合并已有 media 和 imageUrls。
 */
export function buildCustomCardMedia(
  citation: RagAskCitation,
): AiChatCardMediaPreview[] {
  const richCard = citation.richCard
  const existingMedia = richCard?.media ?? []
  const imageUrls = Array.isArray(richCard?.imageUrls)
    ? richCard.imageUrls
    : []
  const imageMedia = imageUrls
    .filter((url) => url && url !== richCard?.imageUrl)
    .map((url, index) => ({
      type: 'image' as const,
      url,
      thumbnailUrl: url,
      title: `参考图片 ${index + 2}`,
    }))

  return [...existingMedia, ...imageMedia]
}
