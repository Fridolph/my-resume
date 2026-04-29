import {
  createLocalizedText,
  type ResumeHighlightItem,
  type StandardResume,
} from '../../../../resume/domain/standard-resume'

interface PatchCoreStrengthsInput {
  resume: StandardResume
  text: string
}

interface PatchCoreStrengthsResult {
  resume: StandardResume
  repairMessages: string[]
}

/**
 * 当 provider 漏识别 `## 核心竞争力` 时，用原文确定性解析补回 highlights。
 *
 * 这不是 AI 生成，只把 Markdown 中已经明确存在的 bullet 映射为 StandardResume.highlights。
 */
export function patchResumeImportCoreStrengthsFromText(
  input: PatchCoreStrengthsInput,
): PatchCoreStrengthsResult {
  if (input.resume.highlights.length > 0) {
    return {
      resume: input.resume,
      repairMessages: [],
    }
  }

  const highlights = parseCoreStrengthHighlights(input.text)

  if (highlights.length === 0) {
    return {
      resume: input.resume,
      repairMessages: [],
    }
  }

  return {
    resume: {
      ...input.resume,
      highlights,
    },
    repairMessages: [`已从原文 ## 核心竞争力 补回 ${highlights.length} 条 highlights`],
  }
}

function parseCoreStrengthHighlights(text: string): ResumeHighlightItem[] {
  const section = readMarkdownSection(text, '核心竞争力')

  return section
    .split('\n')
    .map((line) => line.trim())
    .filter((line) => line.startsWith('-'))
    .map((line) => line.replace(/^[-*]\s*/, '').trim())
    .filter(Boolean)
    .map((line) => {
      const match = line.match(/^\*\*(.+?)\*\*[:：]\s*(.+)$/)
      const title = match?.[1]?.trim() || line.slice(0, 24)
      const description = match?.[2]?.trim() || line

      return {
        title: createLocalizedText(title, ''),
        description: createLocalizedText(description, ''),
      }
    })
}

function readMarkdownSection(text: string, heading: string): string {
  const pattern = new RegExp(`^##\\s+${escapeRegExp(heading)}\\s*$`, 'm')
  const match = pattern.exec(text)

  if (!match) {
    return ''
  }

  const start = (match.index ?? 0) + match[0].length
  const rest = text.slice(start)
  const nextHeading = /^##\s+/m.exec(rest)
  const end = nextHeading?.index ?? rest.length

  return rest.slice(0, end).trim()
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}
