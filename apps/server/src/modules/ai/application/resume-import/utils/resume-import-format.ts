import { BadRequestException } from '@nestjs/common'
import { createHash } from 'node:crypto'

import type {
  ResumeImportDiscardedItem,
  ResumeImportFormatReport,
  ResumeImportSourceSnapshot,
} from '../types/resume-import.types'

interface NormalizeResumeImportFormatInput {
  fileName: string
  fileSize: number
  rawText: string
}

interface NormalizeResumeImportFormatResult {
  formattedText: string
  formatReport: ResumeImportFormatReport
  rawText: string
  sourceSnapshot: ResumeImportSourceSnapshot
}

interface RuleFilterResult {
  discardedItems: ResumeImportDiscardedItem[]
  safetyFlags: string[]
  text: string
  warnings: string[]
}

const PROMPT_INJECTION_PATTERNS = [
  /ignore\s+(all\s+)?(previous|above)\s+instructions?/i,
  /忽略(以上|之前|所有).{0,12}(指令|规则|提示)/,
  /泄露.{0,12}(system|系统).{0,12}(prompt|提示)/i,
  /system\s+prompt/i,
  /你现在是.{0,12}(系统|开发者|管理员)/,
]

const AD_PATTERNS = [/加微(信)?/i, /vx[:：]/i, /推广|广告|博彩|贷款|返利/]
const HTML_OR_SCRIPT_PATTERNS = [/<script[\s>]/i, /<iframe[\s>]/i, /javascript:/i]
const URL_PATTERN = /https?:\/\/\S+/i

/** 计算用户上传文本的稳定摘要，用于历史审计与重复排查。 */
export function createResumeImportSourceHash(text: string): string {
  return createHash('sha256').update(text).digest('hex')
}

/**
 * 对上传简历做本地规则过滤，返回后续结构化识别使用的中间稿。
 *
 * 注意：这里不再调用 AI。Format / Safety 的长耗时语义已收口到后续
 * `ai_generating` 单次识别调用中，避免上传流程因为预处理额外增加一次 LLM 请求。
 */
export function normalizeResumeImportInputFormat(
  input: NormalizeResumeImportFormatInput,
): NormalizeResumeImportFormatResult {
  const ruleResult = filterResumeImportTextByRules(input.rawText)
  const formattedText = normalizeFormattedText(ruleResult.text)

  if (formattedText.length < 200) {
    throw new BadRequestException('安全过滤后有效简历内容不足，请检查上传文件')
  }

  const sourceHash = createResumeImportSourceHash(input.rawText)
  const warnings = uniqueStrings(ruleResult.warnings)
  const formatReport: ResumeImportFormatReport = {
    summary: '已完成本地规则清洗，生成结构化识别中间稿。',
    rawCharCount: input.rawText.length,
    formattedCharCount: formattedText.length,
    keptLineCount: formattedText.split('\n').filter((line) => line.trim()).length,
    discardedLineCount: ruleResult.discardedItems.length,
    discardedItems: ruleResult.discardedItems,
    safetyFlags: uniqueStrings(ruleResult.safetyFlags),
    warnings,
  }

  return {
    formattedText,
    formatReport,
    rawText: input.rawText,
    sourceSnapshot: {
      fileName: input.fileName,
      fileSize: input.fileSize,
      rawCharCount: input.rawText.length,
      formattedCharCount: formattedText.length,
      sourceHash,
    },
  }
}

/** 基础规则过滤：先移除明显无关、注入或风险行，再交给 AI 归一。 */
export function filterResumeImportTextByRules(text: string): RuleFilterResult {
  const discardedItems: ResumeImportDiscardedItem[] = []
  const keptLines: string[] = []

  for (const rawLine of text.split(/\r?\n/)) {
    const line = rawLine.trimEnd()
    const reason = classifyDiscardReason(line)

    if (reason) {
      discardedItems.push({
        reason: reason.reason,
        riskType: reason.riskType,
        summary: summarizeDiscardedLine(line),
      })
      continue
    }

    keptLines.push(line)
  }

  const normalizedText = keptLines
    .join('\n')
    .replace(/[ \t]+$/gm, '')
    .replace(/\n{3,}/g, '\n\n')
    .trim()
  const safetyFlags = discardedItems.map((item) => item.riskType)
  const warnings = discardedItems.length
    ? [`已丢弃 ${discardedItems.length} 条明显无关或风险内容，详情请查看输入治理报告。`]
    : []

  return {
    discardedItems,
    safetyFlags,
    text: normalizedText,
    warnings,
  }
}

/**
 * 合并本地规则层报告与 AI 在单次识别调用中返回的治理报告。
 *
 * 本地规则层已经真正影响了入模文本，因此它的 discardedItems / safetyFlags 永远保留；
 * AI 报告只作为补充诊断，不能覆盖本地审计结果。
 */
export function mergeResumeImportFormatReports(
  localReport: ResumeImportFormatReport,
  aiReport: unknown,
): ResumeImportFormatReport {
  if (!aiReport || typeof aiReport !== 'object' || Array.isArray(aiReport)) {
    return localReport
  }

  const report = aiReport as Partial<ResumeImportFormatReport>
  const aiDiscardedItems = normalizeDiscardedItems(report.discardedItems)
  const discardedItems = uniqueDiscardedItems([
    ...localReport.discardedItems,
    ...aiDiscardedItems,
  ])
  const safetyFlags = uniqueStrings([
    ...localReport.safetyFlags,
    ...normalizeStringArray(report.safetyFlags),
  ])
  const warnings = uniqueStrings([
    ...localReport.warnings,
    ...normalizeStringArray(report.warnings),
  ])

  return {
    ...localReport,
    summary: readString(report.summary) || localReport.summary,
    rawCharCount: normalizeCount(report.rawCharCount, localReport.rawCharCount),
    formattedCharCount: normalizeCount(
      report.formattedCharCount,
      localReport.formattedCharCount,
    ),
    keptLineCount: normalizeCount(report.keptLineCount, localReport.keptLineCount),
    discardedLineCount: Math.max(
      localReport.discardedLineCount,
      normalizeCount(report.discardedLineCount, aiDiscardedItems.length),
      discardedItems.length,
    ),
    discardedItems,
    safetyFlags,
    warnings,
  }
}

function classifyDiscardReason(
  line: string,
): { reason: string; riskType: ResumeImportDiscardedItem['riskType'] } | null {
  const normalizedLine = line.trim()

  if (!normalizedLine) {
    return null
  }

  if (PROMPT_INJECTION_PATTERNS.some((pattern) => pattern.test(normalizedLine))) {
    return {
      reason: '疑似提示词注入，已从识别输入中移除。',
      riskType: 'prompt_injection',
    }
  }

  if (HTML_OR_SCRIPT_PATTERNS.some((pattern) => pattern.test(normalizedLine))) {
    return {
      reason: '疑似脚本或 HTML 注入，已从识别输入中移除。',
      riskType: 'unsafe_markup',
    }
  }

  if (AD_PATTERNS.some((pattern) => pattern.test(normalizedLine))) {
    return {
      reason: '疑似广告或推广内容，已从识别输入中移除。',
      riskType: 'advertisement',
    }
  }

  const urlMatch = normalizedLine.match(URL_PATTERN)

  if (urlMatch && urlMatch[0].length > 120) {
    return {
      reason: '疑似异常超长链接，已从识别输入中移除。',
      riskType: 'irrelevant',
    }
  }

  return null
}

function summarizeDiscardedLine(line: string): string {
  const compactLine = line.replace(/\s+/g, ' ').trim()

  return compactLine.length > 80 ? `${compactLine.slice(0, 80)}...` : compactLine
}

function normalizeFormattedText(value: unknown): string {
  if (typeof value !== 'string') {
    return ''
  }

  return value.replace(/\r\n/g, '\n').replace(/\n{3,}/g, '\n\n').trim()
}

function normalizeDiscardedItems(value: unknown): ResumeImportDiscardedItem[] {
  if (!Array.isArray(value)) {
    return []
  }

  return value
    .map((item) => {
      if (!item || typeof item !== 'object' || Array.isArray(item)) {
        return null
      }

      const candidate = item as Partial<ResumeImportDiscardedItem>
      const summary = readString(candidate.summary)
      const reason = readString(candidate.reason)
      const riskType = normalizeRiskType(candidate.riskType)

      if (!summary || !reason || !riskType) {
        return null
      }

      return {
        summary,
        reason,
        riskType,
      }
    })
    .filter((item): item is ResumeImportDiscardedItem => Boolean(item))
}

function normalizeRiskType(
  value: unknown,
): ResumeImportDiscardedItem['riskType'] | null {
  if (
    value === 'prompt_injection' ||
    value === 'advertisement' ||
    value === 'unsafe_markup' ||
    value === 'irrelevant'
  ) {
    return value
  }

  return null
}

function normalizeStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) {
    return []
  }

  return value.filter(
    (item): item is string => typeof item === 'string' && item.trim().length > 0,
  )
}

function readString(value: unknown): string {
  return typeof value === 'string' ? value.trim() : ''
}

function normalizeCount(value: unknown, fallback: number): number {
  return typeof value === 'number' && Number.isFinite(value) && value >= 0
    ? Math.round(value)
    : fallback
}

function uniqueStrings(values: string[]): string[] {
  return Array.from(new Set(values.map((value) => value.trim()).filter(Boolean)))
}

function uniqueDiscardedItems(
  items: ResumeImportDiscardedItem[],
): ResumeImportDiscardedItem[] {
  const seen = new Set<string>()

  return items.filter((item) => {
    const key = `${item.riskType}:${item.reason}:${item.summary}`

    if (seen.has(key)) {
      return false
    }

    seen.add(key)
    return true
  })
}
