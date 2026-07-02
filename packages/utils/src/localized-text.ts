import type { AppLocale } from './locale'

export interface LocalizedTextLike<TValue = string> {
  zh: TValue
  en: TValue
}

/**
 * 读取双语文本的指定语言值。
 *
 * 兼容两种数据格式：
 * - { zh: "...", en: "..." } 对象 → 返回 obj[locale]
 * - 普通字符串 → 直接返回（API 已压平为单语言）
 *
 * @param value - 双语对象或已压平的字符串
 * @param locale - 目标语言
 * @returns 指定语言的字符串值
 */
export function readLocalizedText<TValue>(
  value: LocalizedTextLike<TValue> | string,
  locale: AppLocale,
): string {
  if (typeof value === 'string') return value
  return (value as LocalizedTextLike)[locale] ?? (value as LocalizedTextLike).zh
}
