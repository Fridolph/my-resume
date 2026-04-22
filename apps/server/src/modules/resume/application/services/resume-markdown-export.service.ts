import { Injectable } from '@nestjs/common'

import { LocalizedText, ResumeLocale, StandardResume } from '../../domain/standard-resume'

type MarkdownSection = {
  title: string
  lines: string[]
}

const SECTION_TITLES: Record<
  ResumeLocale,
  {
    profile: string
    highlights: string
    experience: string
    projects: string
    education: string
    skills: string
  }
> = {
  zh: {
    profile: '基本信息',
    highlights: '核心竞争力',
    experience: '工作经历',
    projects: '核心项目经历',
    education: '教育经历',
    skills: '专业技能',
  },
  en: {
    profile: 'Basic Information',
    highlights: 'Core Strengths',
    experience: 'Work Experience',
    projects: 'Key Projects',
    education: 'Education',
    skills: 'Professional Skills',
  },
}

const PROFILE_TABLE_HEADERS: Record<ResumeLocale, string[]> = {
  zh: ['姓名', '学历', '工作年限', '方向', '地点'],
  en: ['Name', 'Education', 'Years', 'Focus', 'Location'],
}

const PROFILE_FIELD_LABELS: Record<
  ResumeLocale,
  {
    email: string
    phone: string
  }
> = {
  zh: {
    email: 'Email',
    phone: 'Phone',
  },
  en: {
    email: 'Email',
    phone: 'Phone',
  },
}

const PROJECT_FIELD_LABELS: Record<
  ResumeLocale,
  {
    role: string
    summary: string
    coreFunctions: string
    highlights: string
    tech: string
    links: string
  }
> = {
  zh: {
    role: '角色',
    summary: '项目概览',
    coreFunctions: '项目核心功能',
    highlights: '亮点、难点与解决方案',
    tech: '技术栈',
    links: '相关链接',
  },
  en: {
    role: 'Role',
    summary: 'Summary',
    coreFunctions: 'Core Functions',
    highlights: 'Highlights, Challenges & Solutions',
    tech: 'Tech Stack',
    links: 'Links',
  },
}

const EXPERIENCE_FIELD_LABELS: Record<
  ResumeLocale,
  {
    role: string
    summary: string
    highlights: string
    tech: string
  }
> = {
  zh: {
    role: '职位与类型',
    summary: '工作概述',
    highlights: '主要成果',
    tech: '技术栈',
  },
  en: {
    role: 'Role & Type',
    summary: 'Overview',
    highlights: 'Key Achievements',
    tech: 'Tech Stack',
  },
}

function readLocalizedText(value: LocalizedText, locale: ResumeLocale): string {
  return value[locale].trim()
}

function joinNonEmpty(parts: Array<string | null | undefined>, separator = ' · ') {
  return parts
    .map((part) => part?.trim())
    .filter(Boolean)
    .join(separator)
}

function renderBulletList(items: string[]): string[] {
  return items.filter(Boolean).map((item) => `- ${item}`)
}

function indentLine(value: string, level = 1) {
  if (!value.trim()) {
    return ''
  }

  return `${'  '.repeat(level)}${value}`
}

function renderIndentedBulletList(items: string[], level = 1) {
  return renderBulletList(items).map((item) => indentLine(item, level))
}

function renderLabeledLine(label: string, value: string, locale: ResumeLocale) {
  if (!value.trim()) {
    return ''
  }

  return locale === 'zh' ? `**${label}：** ${value}` : `**${label}:** ${value}`
}

function renderMarkdownTable(headers: string[], values: string[]) {
  const divider = headers.map(() => '---')
  return [
    `| ${headers.join(' | ')} |`,
    `| ${divider.join(' | ')} |`,
    `| ${values.map((value) => value || '-').join(' | ')} |`,
  ]
}

function normalizeDateLabel(value: string, locale: ResumeLocale) {
  if (locale === 'en' && value === '至今') {
    return 'Present'
  }

  return value
}

function formatTimeline(
  startDate: string,
  endDate: string,
  locale: ResumeLocale,
  wrap = true,
) {
  const label = `${startDate} - ${normalizeDateLabel(endDate, locale)}`

  if (!wrap) {
    return label
  }

  return locale === 'zh' ? `（${label}）` : `(${label})`
}

function deriveWorkYears(resume: StandardResume, locale: ResumeLocale) {
  const firstStartDate = [...resume.experiences]
    .map((item) => item.startDate)
    .filter(Boolean)
    .sort()[0]

  if (!firstStartDate) {
    return ''
  }

  const [year, month = '01'] = firstStartDate.split('-')
  const start = new Date(Date.UTC(Number(year), Number(month) - 1, 1))
  const now = new Date()
  let years = now.getUTCFullYear() - start.getUTCFullYear()
  const monthDiff = now.getUTCMonth() - start.getUTCMonth()

  if (monthDiff < 0) {
    years -= 1
  }

  if (years > 0) {
    return locale === 'zh' ? `${years}年` : `${years}+ years`
  }

  return locale === 'zh' ? '1年以内' : 'Less than 1 year'
}

function pickPrimaryEducation(resume: StandardResume, locale: ResumeLocale) {
  const education = resume.education[0]

  if (!education) {
    return ''
  }

  return joinNonEmpty(
    [
      readLocalizedText(education.degree, locale),
      readLocalizedText(education.fieldOfStudy, locale),
    ],
    '·',
  )
}

function expandEducationDegree(value: string, locale: ResumeLocale) {
  const normalized = value.trim()

  if (locale !== 'zh') {
    return [normalized]
  }

  switch (normalized) {
    case '本科':
      return ['全日制本科', '学士']
    case '硕士':
      return ['全日制硕士', '硕士']
    case '博士':
      return ['全日制博士', '博士']
    default:
      return [normalized]
  }
}

function formatEducationSummary(
  degree: string,
  fieldOfStudy: string,
  timeline: string,
  locale: ResumeLocale,
) {
  const summary = joinNonEmpty(
    [...expandEducationDegree(degree, locale), fieldOfStudy],
    ' / ',
  )

  return joinNonEmpty([timeline, summary], '  ')
}

@Injectable()
export class ResumeMarkdownExportService {
  render(resume: StandardResume, locale: ResumeLocale): string {
    const sections = [
      this.renderProfileSection(resume, locale),
      this.renderHighlightsSection(resume, locale),
      this.renderEducationSection(resume, locale),
      this.renderSkillsSection(resume, locale),
      this.renderExperienceSection(resume, locale),
      this.renderProjectsSection(resume, locale),
    ].filter((section): section is MarkdownSection => section !== null)

    return sections
      .flatMap((section) => [`## ${section.title}`, ...section.lines, ''])
      .join('\n')
      .trim()
  }

  private renderProfileSection(
    resume: StandardResume,
    locale: ResumeLocale,
  ): MarkdownSection {
    const profile = resume.profile
    const labels = PROFILE_FIELD_LABELS[locale]
    const tableHeaders = PROFILE_TABLE_HEADERS[locale]
    const contactLine = joinNonEmpty(
      [
        `${labels.email}: ${profile.email}`,
        `${labels.phone}: ${profile.phone}`,
      ],
      '  |  ',
    )

    const lines = [
      `# ${readLocalizedText(profile.fullName, locale)}`,
      '',
      ...renderMarkdownTable(tableHeaders, [
        readLocalizedText(profile.fullName, locale),
        pickPrimaryEducation(resume, locale),
        deriveWorkYears(resume, locale),
        readLocalizedText(profile.headline, locale),
        readLocalizedText(profile.location, locale),
      ]),
      '',
      contactLine,
      '',
      readLocalizedText(profile.summary, locale),
    ].filter(Boolean)

    return {
      title: SECTION_TITLES[locale].profile,
      lines,
    }
  }

  private renderHighlightsSection(
    resume: StandardResume,
    locale: ResumeLocale,
  ): MarkdownSection | null {
    if (resume.highlights.length === 0) {
      return null
    }

    return {
      title: SECTION_TITLES[locale].highlights,
      lines: renderBulletList(
        resume.highlights.map((item) => {
          const separator = locale === 'zh' ? '：' : ': '
          return `**${readLocalizedText(item.title, locale)}**${separator}${readLocalizedText(item.description, locale)}`
        }),
      ),
    }
  }

  private renderExperienceSection(
    resume: StandardResume,
    locale: ResumeLocale,
  ): MarkdownSection | null {
    if (resume.experiences.length === 0) {
      return null
    }

    const labels = EXPERIENCE_FIELD_LABELS[locale]
    const lines = resume.experiences.flatMap((item) => [
      indentLine(
        `### **${readLocalizedText(item.companyName, locale)}** ${formatTimeline(
          item.startDate,
          item.endDate,
          locale,
        )}`,
      ),
      '',
      indentLine(
        renderLabeledLine(
          labels.role,
          joinNonEmpty(
            [
              readLocalizedText(item.role, locale),
              readLocalizedText(item.employmentType, locale),
              readLocalizedText(item.location, locale),
            ],
            ' · ',
          ),
          locale,
        ),
        2,
      ),
      indentLine(
        renderLabeledLine(labels.summary, readLocalizedText(item.summary, locale), locale),
        2,
      ),
      item.highlights.length > 0
        ? indentLine(
            locale === 'zh'
              ? `**${labels.highlights}：**`
              : `**${labels.highlights}:**`,
            2,
          )
        : '',
      ...renderIndentedBulletList(
        item.highlights.map((highlight) => readLocalizedText(highlight, locale)),
        2,
      ),
      indentLine(
        renderLabeledLine(labels.tech, item.technologies.join(' / '), locale),
        2,
      ),
      '',
    ])

    return {
      title: SECTION_TITLES[locale].experience,
      lines,
    }
  }

  private renderProjectsSection(
    resume: StandardResume,
    locale: ResumeLocale,
  ): MarkdownSection | null {
    if (resume.projects.length === 0) {
      return null
    }

    const fieldLabels = PROJECT_FIELD_LABELS[locale]
    const lines = resume.projects.flatMap((item) => [
      indentLine(
        `### **${readLocalizedText(item.name, locale)}** ${formatTimeline(
          item.startDate,
          item.endDate,
          locale,
        )}`,
      ),
      '',
      indentLine(
        renderLabeledLine(fieldLabels.role, readLocalizedText(item.role, locale), locale),
        2,
      ),
      readLocalizedText(item.summary, locale)
        ? indentLine(
            renderLabeledLine(
              fieldLabels.summary,
              readLocalizedText(item.summary, locale),
              locale,
            ),
            2,
          )
        : '',
      readLocalizedText(item.coreFunctions, locale)
        ? indentLine(
            renderLabeledLine(
              fieldLabels.coreFunctions,
              readLocalizedText(item.coreFunctions, locale),
              locale,
            ),
            2,
          )
        : '',
      item.highlights.length > 0
        ? indentLine(
            locale === 'zh'
              ? `**${fieldLabels.highlights}：**`
              : `**${fieldLabels.highlights}:**`,
            2,
          )
        : '',
      ...renderIndentedBulletList(
        item.highlights.map((highlight) => readLocalizedText(highlight, locale)),
        2,
      ),
      item.technologies.length > 0
        ? indentLine(
            renderLabeledLine(fieldLabels.tech, item.technologies.join(' / '), locale),
            2,
          )
        : '',
      item.links.length > 0
        ? indentLine(
            renderLabeledLine(
              fieldLabels.links,
              item.links
                .map((link) => {
                  const label = readLocalizedText(link.label, locale)
                  return `[${label}](${link.url})`
                })
                .join(' / '),
              locale,
            ),
            2,
          )
        : '',
      '',
    ])

    return {
      title: SECTION_TITLES[locale].projects,
      lines,
    }
  }

  private renderEducationSection(
    resume: StandardResume,
    locale: ResumeLocale,
  ): MarkdownSection | null {
    if (resume.education.length === 0) {
      return null
    }

    const lines = resume.education.flatMap((item) => [
      indentLine(`### **${readLocalizedText(item.schoolName, locale)}**`),
      '',
      indentLine(
        formatEducationSummary(
          readLocalizedText(item.degree, locale),
          readLocalizedText(item.fieldOfStudy, locale),
          formatTimeline(item.startDate, item.endDate, locale, false),
          locale,
        ),
        2,
      ),
      '',
    ])

    return {
      title: SECTION_TITLES[locale].education,
      lines,
    }
  }

  private renderSkillsSection(
    resume: StandardResume,
    locale: ResumeLocale,
  ): MarkdownSection | null {
    if (resume.skills.length === 0) {
      return null
    }

    return {
      title: SECTION_TITLES[locale].skills,
      lines: resume.skills.flatMap((group) => [
        indentLine(`### ${readLocalizedText(group.name, locale)}`),
        ...renderIndentedBulletList(group.keywords, 2),
        '',
      ]),
    }
  }
}
