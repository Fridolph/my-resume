import { Injectable } from '@nestjs/common'

import { LocalizedText, ResumeLocale, StandardResume } from './domain/standard-resume'

type MarkdownSection = {
  title: string
  lines: string[]
}

const SECTION_TITLES: Record<
  ResumeLocale,
  {
    summary: string
    highlights: string
    experience: string
    projects: string
    education: string
    skills: string
    interests: string
    links: string
  }
> = {
  zh: {
    summary: '个人简介',
    highlights: '亮点',
    experience: '工作经历',
    projects: '项目经历',
    education: '教育经历',
    skills: '技能清单',
    interests: '兴趣方向',
    links: '相关链接',
  },
  en: {
    summary: 'Summary',
    highlights: 'Highlights',
    experience: 'Experience',
    projects: 'Projects',
    education: 'Education',
    skills: 'Skills',
    interests: 'Interests',
    links: 'Links',
  },
}

const PROJECT_FIELD_LABELS: Record<
  ResumeLocale,
  {
    summary: string
    coreFunctions: string
    highlights: string
    tech: string
  }
> = {
  zh: {
    summary: '项目概览',
    coreFunctions: '项目核心功能',
    highlights: '亮点、难点与解决方案',
    tech: '技术栈',
  },
  en: {
    summary: 'Summary',
    coreFunctions: 'Core Functions',
    highlights: 'Highlights, Challenges & Solutions',
    tech: 'Tech',
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

function formatSkillGroupLabel(name: string, proficiency: number | undefined) {
  if (typeof proficiency !== 'number') {
    return name
  }

  return `${name} (${proficiency}/100)`
}

@Injectable()
export class ResumeMarkdownExportService {
  render(resume: StandardResume, locale: ResumeLocale): string {
    const sections = [
      this.renderProfileSection(resume, locale),
      this.renderHighlightsSection(resume, locale),
      this.renderExperienceSection(resume, locale),
      this.renderProjectsSection(resume, locale),
      this.renderEducationSection(resume, locale),
      this.renderSkillsSection(resume, locale),
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
    const titles = SECTION_TITLES[locale]
    const profile = resume.profile

    const lines = [
      `# ${readLocalizedText(profile.fullName, locale)}`,
      readLocalizedText(profile.headline, locale),
      joinNonEmpty([
        readLocalizedText(profile.location, locale),
        profile.email,
        profile.phone,
        profile.website,
      ]),
      '',
      readLocalizedText(profile.summary, locale),
    ].filter(Boolean)

    if (profile.links.length > 0) {
      lines.push('', `### ${titles.links}`)
      lines.push(
        ...renderBulletList(
          profile.links.map((link) => {
            const label = readLocalizedText(link.label, locale)
            return `[${label}](${link.url})`
          }),
        ),
      )
    }

    if (profile.interests.length > 0) {
      lines.push('', `### ${titles.interests}`)
      lines.push(
        ...renderBulletList(
          profile.interests.map((interest) => readLocalizedText(interest.label, locale)),
        ),
      )
    }

    return {
      title: titles.summary,
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
      lines: resume.highlights.flatMap((item) => [
        `### ${readLocalizedText(item.title, locale)}`,
        readLocalizedText(item.description, locale),
        '',
      ]),
    }
  }

  private renderExperienceSection(
    resume: StandardResume,
    locale: ResumeLocale,
  ): MarkdownSection | null {
    if (resume.experiences.length === 0) {
      return null
    }

    const lines = resume.experiences.flatMap((item) => [
      `### ${readLocalizedText(item.companyName, locale)}`,
      joinNonEmpty([
        readLocalizedText(item.role, locale),
        readLocalizedText(item.employmentType, locale),
        `${item.startDate} - ${item.endDate}`,
        readLocalizedText(item.location, locale),
      ]),
      '',
      readLocalizedText(item.summary, locale),
      ...renderBulletList(
        item.highlights.map((highlight) => readLocalizedText(highlight, locale)),
      ),
      `**Tech:** ${item.technologies.join(' / ')}`,
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
      `### ${readLocalizedText(item.name, locale)}`,
      joinNonEmpty([
        readLocalizedText(item.role, locale),
        `${item.startDate} - ${item.endDate}`,
      ]),
      '',
      readLocalizedText(item.summary, locale)
        ? `**${fieldLabels.summary}:** ${readLocalizedText(item.summary, locale)}`
        : '',
      readLocalizedText(item.coreFunctions, locale)
        ? `**${fieldLabels.coreFunctions}:** ${readLocalizedText(item.coreFunctions, locale)}`
        : '',
      item.highlights.length > 0 ? `**${fieldLabels.highlights}:**` : '',
      ...renderBulletList(
        item.highlights.map((highlight) => readLocalizedText(highlight, locale)),
      ),
      item.technologies.length > 0
        ? `**${fieldLabels.tech}:** ${item.technologies.join(' / ')}`
        : '',
      ...renderBulletList(
        item.links.map((link) => {
          const label = readLocalizedText(link.label, locale)
          return `[${label}](${link.url})`
        }),
      ),
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
      `### ${readLocalizedText(item.schoolName, locale)}`,
      joinNonEmpty([
        readLocalizedText(item.degree, locale),
        readLocalizedText(item.fieldOfStudy, locale),
        `${item.startDate} - ${item.endDate}`,
        readLocalizedText(item.location, locale),
      ]),
      ...renderBulletList(
        item.highlights.map((highlight) => readLocalizedText(highlight, locale)),
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
      lines: resume.skills.map(
        (group) =>
          `- **${formatSkillGroupLabel(readLocalizedText(group.name, locale), group.proficiency)}**: ${group.keywords.join(' / ')}`,
      ),
    }
  }
}
