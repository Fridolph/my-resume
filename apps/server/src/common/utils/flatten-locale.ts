/**
 * 递归压平 StandardResume 中的 { zh, en } 双语结构为单一语言字符串。
 *
 * ## 设计决策
 *
 * 存储层（DB/YAML）继续使用 { zh, en } 双语结构以保证 Admin 编辑端
 * 能同时编辑两种语言。本工具仅在 **公开 API 响应层** 调用，将数据按
 * 请求 locale 压平后返回给前端。
 *
 * ## 压平规则
 *
 * 1. 对象仅含 zh + en 两个 key → 取 `obj[locale]`
 * 2. 数组 → 递归处理每个元素
 * 3. 普通对象 → 递归处理每个 value
 * 4. null / 基础类型 → 直接返回
 *
 * @param data - 任意 StandardResume 或其子对象
 * @param locale - 目标语言 'zh' | 'en'
 * @returns 已压平的同构对象（所有 {zh,en} 替换为 string）
 */
export function flattenForLocale<T = unknown>(data: T, locale: 'zh' | 'en'): T {
  if (data === null || typeof data !== 'object') {
    return data
  }

  if (Array.isArray(data)) {
    return data.map((item) => flattenForLocale(item, locale)) as unknown as T
  }

  const record = data as Record<string, unknown>
  const keys = Object.keys(record)

  // 检测纯 { zh, en } 结构 → 取对应语言值
  if (keys.length === 2 && keys.includes('zh') && keys.includes('en')) {
    return (record[locale] ?? record['zh'] ?? record['en']) as unknown as T
  }

  // 普通对象 → 递归处理每个 value
  const result: Record<string, unknown> = {}
  for (const key of keys) {
    result[key] = flattenForLocale(record[key], locale)
  }
  return result as unknown as T
}
