import {
  createEmptyStandardResume,
  createLocalizedText,
  normalizeStandardResume,
  type LocalizedText,
  type ResumeHighlightItem,
  type StandardResume,
} from '../../../../resume/domain/standard-resume'

/**
 * 创建中文 LocalizedText，英文先留空。
 */
function localizedZh(value: string): LocalizedText {
  return createLocalizedText(value.trim(), '')
}

/**
 * 读取两个 Markdown 二级标题之间的内容。
 */
function sectionBetween(text: string, startTitle: string, endTitles: string[]): string {
  const startIndex = text.indexOf(startTitle)

  if (startIndex < 0) {
    return ''
  }

  const contentStart = startIndex + startTitle.length
  const endIndexes = endTitles
    .map((title) => text.indexOf(title, contentStart))
    .filter((index) => index >= 0)
  const endIndex = endIndexes.length > 0 ? Math.min(...endIndexes) : text.length

  return text.slice(contentStart, endIndex).trim()
}

/**
 * 将三级标题块拆成 title/meta/body，适配 lifeiyu mock 简历样例。
 */
function splitByMarkdownHeading(
  section: string,
): Array<{ title: string; meta: string; body: string }> {
  const headingPattern = /^ {0,4}###\s+(?:\*\*(.+?)\*\*|(.+?))(?:\s*（(.+?)）)?\s*$/gm
  const matches = Array.from(section.matchAll(headingPattern))

  return matches.map((match, index) => {
    const start = (match.index ?? 0) + match[0].length
    const end = matches[index + 1]?.index ?? section.length

    return {
      title: (match[1] ?? match[2] ?? '').trim(),
      meta: match[3]?.trim() ?? '',
      body: section.slice(start, end).trim(),
    }
  })
}

/**
 * 从 Markdown bold label 中提取单行字段。
 */
function extractField(body: string, label: string): string {
  const escapedLabel = label.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  const pattern = new RegExp(`\\*\\*${escapedLabel}：\\*\\*\\s*([^\\n]+)`)
  const match = body.match(pattern)

  return match?.[1]?.trim() ?? ''
}

/**
 * 从 Markdown bold label 后提取列表。
 */
function extractListAfterLabel(body: string, label: string): string[] {
  const escapedLabel = label.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  const pattern = new RegExp(
    `\\*\\*${escapedLabel}：\\*\\*([\\s\\S]*?)(?=\\n\\s*\\*\\*|$)`,
  )
  const match = body.match(pattern)

  if (!match?.[1]) {
    return []
  }

  return match[1]
    .split('\n')
    .map((line) => line.replace(/^\s*-\s*/, '').trim())
    .filter(Boolean)
}

/**
 * 将技术栈字段按 / 拆成数组。
 */
function splitTechStack(value: string): string[] {
  return value
    .split('/')
    .map((item) => item.trim())
    .filter(Boolean)
}

/**
 * 拆分时间区间。
 */
function splitPeriod(value: string): { startDate: string; endDate: string } {
  const [startDate = '', endDate = ''] = value.split('-').map((item) => item.trim())

  return {
    startDate,
    endDate,
  }
}

/**
 * 解析 mock 简历顶部的基本信息表格。
 */
function parseProfileTable(text: string) {
  const tableRows = text
    .split('\n')
    .filter((line) => line.startsWith('|') && !line.includes('---') && line.includes('|'))
  const tableRow = tableRows.find((line) => !line.includes('姓名')) ?? tableRows[0]
  const cells =
    tableRow
      ?.split('|')
      .map((item) => item.trim())
      .filter(Boolean) ?? []

  return {
    fullName: cells[0] ?? '',
    education: cells[1] ?? '',
    experienceYears: cells[2] ?? '',
    headline: cells[3] ?? '',
    location: cells[4] ?? '',
  }
}

/**
 * 将 lifeiyu-mock-zh.md 风格的中文 Markdown 简历解析成 StandardResume。
 *
 * 该 parser 只服务 mock provider 回归，不作为真实用户简历的通用解析器。
 */
export function parseMockResumeFromMarkdown(text: string): StandardResume {
  const resume = createEmptyStandardResume()
  const profileTable = parseProfileTable(text)
  const headingName = text.match(/^#\s+(.+)$/m)?.[1]?.trim() ?? profileTable.fullName
  const email = text.match(/Email:\s*([^\s|]+)/i)?.[1]?.trim() ?? ''
  const phone = text.match(/Phone:\s*([^\s|]+)/i)?.[1]?.trim() ?? ''
  const profileSection = sectionBetween(text, '## 基本信息', ['## 核心竞争力'])
  const summary = profileSection
    .split('\n')
    .map((line) => line.trim())
    .filter(
      (line) =>
        line &&
        !line.startsWith('#') &&
        !line.startsWith('|') &&
        !line.includes('Email:'),
    )
    .join('\n')

  resume.profile.fullName = localizedZh(headingName)
  resume.profile.headline = localizedZh(profileTable.headline)
  resume.profile.summary = localizedZh(summary)
  resume.profile.location = localizedZh(profileTable.location)
  resume.profile.email = email
  resume.profile.phone = phone

  const strengthsSection = sectionBetween(text, '## 核心竞争力', ['## 教育经历'])
  resume.highlights = strengthsSection
    .split('\n')
    .map((line) => line.trim())
    .filter((line) => line.startsWith('-'))
    .map((line): ResumeHighlightItem => {
      const normalized = line.replace(/^-\s*/, '')
      const match = normalized.match(/^\*\*(.+?)\*\*[:：]\s*(.+)$/)

      return {
        title: localizedZh(match?.[1] ?? normalized.slice(0, 24)),
        description: localizedZh(match?.[2] ?? normalized),
      }
    })

  const educationSection = sectionBetween(text, '## 教育经历', ['## 专业技能'])
  resume.education = splitByMarkdownHeading(educationSection).map((item) => {
    const periodLine = item.body
      .split('\n')
      .map((line) => line.trim())
      .find((line) => /\d{4}\.\d{2}/.test(line))
    const parts = periodLine?.split(/\s{2,}/).map((part) => part.trim()) ?? []
    const period = splitPeriod(parts[0] ?? '')
    const degreeParts = (parts[1] ?? '').split('/').map((part) => part.trim())

    return {
      schoolName: localizedZh(item.title),
      degree: localizedZh(degreeParts.slice(0, 2).join(' / ')),
      fieldOfStudy: localizedZh(degreeParts[2] ?? ''),
      startDate: period.startDate,
      endDate: period.endDate,
      location: localizedZh(''),
      highlights: [],
    }
  })

  const skillsSection = sectionBetween(text, '## 专业技能', ['## 工作经历'])
  resume.skills = splitByMarkdownHeading(skillsSection).map((item) => ({
    name: localizedZh(item.title),
    keywords: item.body
      .split('\n')
      .map((line) => line.replace(/^\s*-\s*/, '').trim())
      .filter(Boolean)
      .map((line) => localizedZh(line)),
  }))

  const experienceSection = sectionBetween(text, '## 工作经历', ['## 核心项目经历'])
  resume.experiences = splitByMarkdownHeading(experienceSection).map((item) => {
    const period = splitPeriod(item.meta)
    const role = extractField(item.body, '职位与类型')
    const summaryText = extractField(item.body, '工作概述')
    const highlights = extractListAfterLabel(item.body, '主要成果')
    const technologies = splitTechStack(extractField(item.body, '技术栈'))

    return {
      companyName: localizedZh(item.title),
      role: localizedZh(role),
      employmentType: localizedZh('全职'),
      startDate: period.startDate,
      endDate: period.endDate,
      location: localizedZh(''),
      summary: localizedZh(summaryText),
      highlights: highlights.map((line) => localizedZh(line)),
      technologies,
    }
  })

  const projectsSection = sectionBetween(text, '## 核心项目经历', ['## 自我评价'])
  resume.projects = splitByMarkdownHeading(projectsSection).map((item) => {
    const period = splitPeriod(item.meta)
    const role = extractField(item.body, '角色')
    const summaryText = extractField(item.body, '项目概览')
    const coreFunctions = extractField(item.body, '项目核心功能')
    const highlights = extractListAfterLabel(item.body, '亮点、难点与解决方案')
    const technologies = splitTechStack(extractField(item.body, '技术栈'))

    return {
      name: localizedZh(item.title),
      role: localizedZh(role),
      startDate: period.startDate,
      endDate: period.endDate,
      summary: localizedZh(summaryText),
      coreFunctions: localizedZh(coreFunctions),
      highlights: highlights.map((line) => localizedZh(line)),
      technologies,
      links: [],
    }
  })

  return normalizeStandardResume(resume)
}
