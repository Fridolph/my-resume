import { BadGatewayException } from '@nestjs/common'

export { buildResumeImportJsonRepairPrompt } from '../prompts/resume-import-json-repair.prompt'
import type { ProviderResumeImportPayload } from '../types/resume-import.types'

interface ParseResumeImportJsonResult {
  payload: ProviderResumeImportPayload
  details: string[]
}

/**
 * 从模型输出中提取 JSON object 文本。
 *
 * 兼容模型偶尔包一层 ```json fenced block 的情况；如果找不到对象边界，则视为 provider 输出不可用。
 */
export function extractResumeImportJsonObject(rawText: string): string {
  const fencedMatch = rawText.match(/```(?:json)?\s*([\s\S]*?)```/i)

  if (fencedMatch?.[1]) {
    return fencedMatch[1].trim()
  }

  const firstBrace = rawText.indexOf('{')
  const lastBrace = rawText.lastIndexOf('}')

  if (firstBrace < 0 || lastBrace <= firstBrace) {
    throw new BadGatewayException('AI 未返回可解析的 JSON 结果')
  }

  return rawText.slice(firstBrace, lastBrace + 1).trim()
}

/**
 * 严格解析 provider JSON，并检查最小业务形状。
 *
 * 这里不做 schema 放宽，只负责确认模型输出是 JSON object 且存在 resume 字段。
 */
export function parseResumeImportProviderPayload(
  jsonText: string,
): ParseResumeImportJsonResult {
  const payload = JSON.parse(jsonText) as ProviderResumeImportPayload

  assertResumeImportProviderPayload(payload)

  return {
    payload,
    details: [`JSON 字符数：${jsonText.length}`, `顶层字段：${Object.keys(payload).join(', ') || '无'}`],
  }
}

/**
 * 对模型常见的“漏逗号”JSON 进行本地保守修复。
 *
 * 只在前一个非空白 token 明确是值结尾、下一个 token 明确是新值开头时补逗号；
 * 其他复杂语法错误仍交给 provider repair，避免本地修复过度猜测。
 */
export function repairResumeImportJsonSyntaxLocally(jsonText: string): string | null {
  const repaired = insertMissingCommasBetweenValues(jsonText)

  if (repaired === jsonText) {
    return null
  }

  try {
    JSON.parse(repaired)
    return repaired
  } catch {
    return null
  }
}

/** 根据 JSON.parse 的错误位置截取附近片段，方便定位真实模型输出问题。 */
export function buildResumeImportJsonParseDiagnostics(
  jsonText: string,
  error: unknown,
): string[] {
  const message = error instanceof Error ? error.message : '未知 JSON 解析错误'
  const position = readJsonErrorPosition(message)
  const details = [`原始解析错误：${message}`]

  if (typeof position === 'number') {
    const start = Math.max(0, position - 120)
    const end = Math.min(jsonText.length, position + 120)
    details.push(`错误位置附近片段：${jsonText.slice(start, end)}`)
  }

  return details
}

function assertResumeImportProviderPayload(value: unknown): asserts value is ProviderResumeImportPayload {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    throw new BadGatewayException('AI 识别结果不是 JSON object')
  }

  const payload = value as ProviderResumeImportPayload

  if (!payload.resume || typeof payload.resume !== 'object') {
    throw new BadGatewayException('AI 识别结果缺少 resume 字段')
  }
}

function readJsonErrorPosition(message: string): number | undefined {
  const match = message.match(/position\s+(\d+)/i)

  if (!match?.[1]) {
    return undefined
  }

  const position = Number(match[1])
  return Number.isFinite(position) ? position : undefined
}

function insertMissingCommasBetweenValues(jsonText: string): string {
  let output = ''
  let inString = false
  let escaped = false
  let previousSignificant = ''

  for (let index = 0; index < jsonText.length; index += 1) {
    const char = jsonText[index] ?? ''

    if (inString) {
      output += char

      if (escaped) {
        escaped = false
        continue
      }

      if (char === '\\') {
        escaped = true
        continue
      }

      if (char === '"') {
        inString = false
        previousSignificant = '"'
      }

      continue
    }

    if (char === '"') {
      if (shouldInsertComma(previousSignificant, char)) {
        output += ','
      }

      output += char
      inString = true
      continue
    }

    if (!/\s/.test(char)) {
      if (shouldInsertComma(previousSignificant, char)) {
        output += ','
      }

      previousSignificant = char
    }

    output += char
  }

  return output
}

function shouldInsertComma(previous: string, current: string): boolean {
  if (!previous || previous === ',' || previous === ':' || previous === '{' || previous === '[') {
    return false
  }

  const previousCanEndValue = /[}\]"0-9el]/.test(previous)
  const currentCanStartValue = /[{\["0-9tfn-]/.test(current)

  return previousCanEndValue && currentCanStartValue
}
