import { createHash } from 'node:crypto'

import type { LocalizedText, ResumeLocale, StandardResume } from '../../domain/standard-resume'

export type ResumeRagSemanticSection =
  | 'profile'
  | 'core_strengths'
  | 'skills'
  | 'work_experience'
  | 'projects'
  | 'education'

export type ResumeRagSemanticEntityType =
  | 'profile_summary'
  | 'core_strength'
  | 'skill_group'
  | 'experience_summary'
  | 'project_summary'
  | 'education_summary'

export interface ResumeRagSemanticChunk {
  stableKey: string
  section: ResumeRagSemanticSection
  subsectionKey: string
  subsectionTitle: string
  entityType: ResumeRagSemanticEntityType
  title: string
  content: string
  tags: string[]
  chunkIndex: number
  chunkCount: number
  contentHash: string
}

function computeContentHash(content: string): string {
  return createHash('sha256').update(content).digest('hex')
}

function shortHash(value: string): string {
  return computeContentHash(value).slice(0, 12)
}

function localized(value: LocalizedText, locale: ResumeLocale): string {
  return value[locale] || value.zh || value.en
}

function compactLines(lines: Array<string | undefined | null | false>): string {
  return lines
    .filter((line): line is string => typeof line === 'string' && line.trim().length > 0)
    .map((line) => line.trim())
    .join('\n')
}

function stableKey(prefix: string, parts: string[]): string {
  return `${prefix}:${shortHash(parts.join('|'))}`
}

function uniqTags(tags: Array<string | undefined | null | false>): string[] {
  return Array.from(
    new Set(
      tags.filter((tag): tag is string => typeof tag === 'string' && tag.trim().length > 0),
    ),
  )
}

function createChunk(
  input: Omit<ResumeRagSemanticChunk, 'chunkIndex' | 'chunkCount' | 'contentHash'>,
): Omit<ResumeRagSemanticChunk, 'chunkIndex' | 'chunkCount'> {
  return {
    ...input,
    contentHash: computeContentHash(input.content),
  }
}

/**
 * 将结构化简历转换成适合检索的语义块。
 *
 * 这一步优先按简历业务语义拆分，而不是直接对整份 markdown 做固定窗口切块。
 * 过长语义块的二次切分会在后续步骤单独处理。
 */
export function buildResumeRagSemanticChunks(
  resume: StandardResume,
  locale: ResumeLocale,
): ResumeRagSemanticChunk[] {
  const chunks: Array<Omit<ResumeRagSemanticChunk, 'chunkIndex' | 'chunkCount'>> = []
  const fullName = localized(resume.profile.fullName, locale)
  const headline = localized(resume.profile.headline, locale)

  chunks.push(
    createChunk({
      stableKey: 'profile',
      section: 'profile',
      subsectionKey: 'profile',
      subsectionTitle: fullName,
      entityType: 'profile_summary',
      title: `${fullName} / ${headline}`,
      content: compactLines([
        fullName,
        headline,
        localized(resume.profile.summary, locale),
        localized(resume.profile.location, locale),
        resume.profile.website,
      ]),
      tags: uniqTags(['profile', headline, localized(resume.profile.location, locale)]),
    }),
  )

  for (const item of resume.highlights) {
    const title = localized(item.title, locale)

    chunks.push(
      createChunk({
        stableKey: stableKey('core-strength', [title, localized(item.description, locale)]),
        section: 'core_strengths',
        subsectionKey: stableKey('core-strength', [title]),
        subsectionTitle: title,
        entityType: 'core_strength',
        title,
        content: compactLines([title, localized(item.description, locale)]),
        tags: uniqTags(['core_strengths', title]),
      }),
    )
  }

  for (const group of resume.skills) {
    const title = localized(group.name, locale)
    const keywords = group.keywords.map((keyword) => localized(keyword, locale))

    chunks.push(
      createChunk({
        stableKey: stableKey('skill-group', [title, ...keywords]),
        section: 'skills',
        subsectionKey: stableKey('skill-group', [title]),
        subsectionTitle: title,
        entityType: 'skill_group',
        title,
        content: compactLines([title, keywords.join('、')]),
        tags: uniqTags(['skills', title, ...keywords]),
      }),
    )
  }

  for (const experience of resume.experiences) {
    const companyName = localized(experience.companyName, locale)
    const role = localized(experience.role, locale)
    const highlights = experience.highlights.map((highlight) => localized(highlight, locale))

    chunks.push(
      createChunk({
        stableKey: stableKey('experience', [
          companyName,
          role,
          experience.startDate,
          experience.endDate,
        ]),
        section: 'work_experience',
        subsectionKey: stableKey('experience', [companyName, role]),
        subsectionTitle: companyName,
        entityType: 'experience_summary',
        title: `${companyName} / ${role}`,
        content: compactLines([
          companyName,
          role,
          `${experience.startDate} - ${experience.endDate}`,
          localized(experience.location, locale),
          localized(experience.summary, locale),
          highlights.join('\n'),
          experience.technologies.join('、'),
        ]),
        tags: uniqTags(['work_experience', companyName, role, ...experience.technologies]),
      }),
    )
  }

  for (const project of resume.projects) {
    const projectName = localized(project.name, locale)
    const role = localized(project.role, locale)
    const highlights = project.highlights.map((highlight) => localized(highlight, locale))

    chunks.push(
      createChunk({
        stableKey: stableKey('project', [projectName, role, project.startDate, project.endDate]),
        section: 'projects',
        subsectionKey: stableKey('project', [projectName]),
        subsectionTitle: projectName,
        entityType: 'project_summary',
        title: `${projectName} / ${role}`,
        content: compactLines([
          projectName,
          role,
          `${project.startDate} - ${project.endDate}`,
          localized(project.summary, locale),
          localized(project.coreFunctions, locale),
          highlights.join('\n'),
          project.technologies.join('、'),
        ]),
        tags: uniqTags(['projects', projectName, role, ...project.technologies]),
      }),
    )
  }

  for (const education of resume.education) {
    const schoolName = localized(education.schoolName, locale)
    const degree = localized(education.degree, locale)
    const highlights = education.highlights.map((highlight) => localized(highlight, locale))

    chunks.push(
      createChunk({
        stableKey: stableKey('education', [schoolName, degree, education.startDate]),
        section: 'education',
        subsectionKey: stableKey('education', [schoolName]),
        subsectionTitle: schoolName,
        entityType: 'education_summary',
        title: `${schoolName} / ${degree}`,
        content: compactLines([
          schoolName,
          degree,
          localized(education.fieldOfStudy, locale),
          `${education.startDate} - ${education.endDate}`,
          localized(education.location, locale),
          highlights.join('\n'),
        ]),
        tags: uniqTags(['education', schoolName, degree, localized(education.fieldOfStudy, locale)]),
      }),
    )
  }

  return chunks.map((chunk, chunkIndex) => ({
    ...chunk,
    chunkIndex,
    chunkCount: chunks.length,
  }))
}
