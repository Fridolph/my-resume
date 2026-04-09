import { arrayMove } from '@dnd-kit/sortable'
import type { CSSProperties } from 'react'

import type {
  LocalizedText,
  ResumeEducationItem,
  ResumeExperienceItem,
  ResumeHighlightItem,
  ResumeProfileHero,
  ResumeProfileInterestItem,
  ResumeProfileLink,
  ResumeProjectItem,
  ResumeSkillGroup,
  StandardResume,
} from '../../lib/resume-types'

export type DraftEditorStatus = 'idle' | 'loading' | 'ready' | 'error'
export type DraftFieldValues = Record<string, string>
export type EditorLocaleMode = 'zh' | 'en'
export type SortableCollectionKey =
  | 'profileLinks'
  | 'profileInterests'
  | 'education'
  | 'experiences'
  | 'projects'
  | 'skills'
  | 'highlights'
export type SortableCollectionState = Record<SortableCollectionKey, string[]>

export function cloneResume(resume: StandardResume): StandardResume {
  return JSON.parse(JSON.stringify(resume)) as StandardResume
}

export function formatIsoDateTime(iso: string): string {
  return new Date(iso).toLocaleString('zh-CN', {
    hour12: false,
  })
}

export function createEmptyLocalizedText(): LocalizedText {
  return {
    zh: '',
    en: '',
  }
}

export function createEmptyExperience(): ResumeExperienceItem {
  return {
    companyName: createEmptyLocalizedText(),
    role: createEmptyLocalizedText(),
    employmentType: createEmptyLocalizedText(),
    startDate: '',
    endDate: '',
    location: createEmptyLocalizedText(),
    summary: createEmptyLocalizedText(),
    highlights: [],
    technologies: [],
  }
}

export function createEmptyProfileLink(): ResumeProfileLink {
  return {
    label: createEmptyLocalizedText(),
    url: '',
  }
}

export function createEmptyProfileInterest(): ResumeProfileInterestItem {
  return {
    label: createEmptyLocalizedText(),
  }
}

export function createEmptyProfileHero(): ResumeProfileHero {
  return {
    frontImageUrl: '/img/avatar.jpg',
    backImageUrl: '/img/avatar2.jpg',
    linkUrl: 'https://github.com/Fridolph/my-resume',
    slogans: [createEmptyLocalizedText(), createEmptyLocalizedText()],
  }
}

export function createEmptyEducation(): ResumeEducationItem {
  return {
    schoolName: createEmptyLocalizedText(),
    degree: createEmptyLocalizedText(),
    fieldOfStudy: createEmptyLocalizedText(),
    startDate: '',
    endDate: '',
    location: createEmptyLocalizedText(),
    highlights: [],
  }
}

export function createEmptyProject(): ResumeProjectItem {
  return {
    name: createEmptyLocalizedText(),
    role: createEmptyLocalizedText(),
    startDate: '',
    endDate: '',
    summary: createEmptyLocalizedText(),
    coreFunctions: createEmptyLocalizedText(),
    highlights: [],
    technologies: [],
    links: [],
  }
}

export function createEmptySkillGroup(): ResumeSkillGroup {
  return {
    name: createEmptyLocalizedText(),
    keywords: [],
  }
}

export function createEmptyHighlight(): ResumeHighlightItem {
  return {
    title: createEmptyLocalizedText(),
    description: createEmptyLocalizedText(),
  }
}

export function createEmptySortableCollectionState(): SortableCollectionState {
  return {
    profileLinks: [],
    profileInterests: [],
    education: [],
    experiences: [],
    projects: [],
    skills: [],
    highlights: [],
  }
}

export function buildSortableCollectionState(
  resume: StandardResume,
  createId: (scope: SortableCollectionKey) => string,
): SortableCollectionState {
  return {
    profileLinks: resume.profile.links.map(() => createId('profileLinks')),
    profileInterests: resume.profile.interests.map(() => createId('profileInterests')),
    education: resume.education.map(() => createId('education')),
    experiences: resume.experiences.map(() => createId('experiences')),
    projects: resume.projects.map(() => createId('projects')),
    skills: resume.skills.map(() => createId('skills')),
    highlights: resume.highlights.map(() => createId('highlights')),
  }
}

export function collectionNeedsDraftFieldSync(
  collection: SortableCollectionKey,
): boolean {
  return (
    collection === 'education' ||
    collection === 'experiences' ||
    collection === 'projects' ||
    collection === 'skills'
  )
}

export function reorderResumeCollection(
  resume: StandardResume,
  collection: SortableCollectionKey,
  fromIndex: number,
  toIndex: number,
): StandardResume {
  const nextResume = cloneResume(resume)

  if (collection === 'profileLinks') {
    nextResume.profile.links = arrayMove(nextResume.profile.links, fromIndex, toIndex)
    return nextResume
  }

  if (collection === 'profileInterests') {
    nextResume.profile.interests = arrayMove(
      nextResume.profile.interests,
      fromIndex,
      toIndex,
    )
    return nextResume
  }

  if (collection === 'education') {
    nextResume.education = arrayMove(nextResume.education, fromIndex, toIndex)
    return nextResume
  }

  if (collection === 'experiences') {
    nextResume.experiences = arrayMove(nextResume.experiences, fromIndex, toIndex)
    return nextResume
  }

  if (collection === 'projects') {
    nextResume.projects = arrayMove(nextResume.projects, fromIndex, toIndex)
    return nextResume
  }

  if (collection === 'skills') {
    nextResume.skills = arrayMove(nextResume.skills, fromIndex, toIndex)
    return nextResume
  }

  nextResume.highlights = arrayMove(nextResume.highlights, fromIndex, toIndex)
  return nextResume
}

export function buildSortableTransformStyle(
  transform: { x: number; y: number; scaleX?: number; scaleY?: number } | null,
  transition: string | undefined,
  isDragging: boolean,
): CSSProperties {
  return {
    transform: transform
      ? `translate3d(${transform.x}px, ${transform.y}px, 0) scale(${transform.scaleX ?? 1}, ${transform.scaleY ?? 1})`
      : undefined,
    transition,
    zIndex: isDragging ? 10 : undefined,
  }
}

export function parseCommaSeparatedValues(value: string): string[] {
  return value
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean)
}

export function formatCommaSeparatedValues(values: string[]): string {
  return values.join(', ')
}

export function formatLineSeparatedValues(values: string[]): string {
  return values.join('\n')
}

export function parseLineSeparatedValues(value: string): string[] {
  return value
    .split('\n')
    .map((item) => item.trim())
    .filter(Boolean)
}

export function formatLocalizedLines(
  values: LocalizedText[],
  locale: 'zh' | 'en',
): string {
  return values
    .map((item) => item[locale])
    .filter(Boolean)
    .join('\n')
}

export function mergeLocalizedLines(
  currentValues: LocalizedText[],
  locale: 'zh' | 'en',
  value: string,
): LocalizedText[] {
  const nextValues = value
    .split('\n')
    .map((item) => item.trim())
    .filter(Boolean)

  const targetLength =
    currentValues.length > 0
      ? Math.max(currentValues.length, nextValues.length)
      : nextValues.length

  return Array.from({ length: targetLength }, (_, index) => ({
    zh: locale === 'zh' ? (nextValues[index] ?? '') : (currentValues[index]?.zh ?? ''),
    en: locale === 'en' ? (nextValues[index] ?? '') : (currentValues[index]?.en ?? ''),
  })).filter((item) => item.zh || item.en)
}

export function buildDraftFieldKey(
  scope: 'experience' | 'project' | 'education' | 'skill' | 'profile',
  index: number | 'interests' | 'hero',
  field: 'highlights' | 'technologies' | 'keywords' | 'interests' | 'slogans',
  locale?: 'zh' | 'en',
): string {
  return [scope, index, field, locale ?? 'plain'].join(':')
}

export function buildDraftFieldValues(resume: StandardResume): DraftFieldValues {
  const nextValues: DraftFieldValues = {}

  resume.experiences.forEach((experience, index) => {
    nextValues[buildDraftFieldKey('experience', index, 'highlights', 'zh')] =
      formatLocalizedLines(experience.highlights, 'zh')
    nextValues[buildDraftFieldKey('experience', index, 'highlights', 'en')] =
      formatLocalizedLines(experience.highlights, 'en')
    nextValues[buildDraftFieldKey('experience', index, 'technologies')] =
      formatCommaSeparatedValues(experience.technologies)
  })

  resume.projects.forEach((project, index) => {
    nextValues[buildDraftFieldKey('project', index, 'highlights', 'zh')] =
      formatLocalizedLines(project.highlights, 'zh')
    nextValues[buildDraftFieldKey('project', index, 'highlights', 'en')] =
      formatLocalizedLines(project.highlights, 'en')
    nextValues[buildDraftFieldKey('project', index, 'technologies')] =
      formatCommaSeparatedValues(project.technologies)
  })

  resume.education.forEach((education, index) => {
    nextValues[buildDraftFieldKey('education', index, 'highlights', 'zh')] =
      formatLocalizedLines(education.highlights, 'zh')
    nextValues[buildDraftFieldKey('education', index, 'highlights', 'en')] =
      formatLocalizedLines(education.highlights, 'en')
  })

  resume.skills.forEach((skill, index) => {
    nextValues[buildDraftFieldKey('skill', index, 'keywords')] =
      formatLineSeparatedValues(skill.keywords)
  })

  nextValues[buildDraftFieldKey('profile', 'hero', 'slogans', 'zh')] =
    formatLocalizedLines(resume.profile.hero.slogans, 'zh')
  nextValues[buildDraftFieldKey('profile', 'hero', 'slogans', 'en')] =
    formatLocalizedLines(resume.profile.hero.slogans, 'en')

  return nextValues
}

export function copyLocalizedTextValue(value: LocalizedText) {
  value.en = value.zh
}

export function clearLocalizedTextValue(value: LocalizedText) {
  value.en = ''
}

export function copyLocalizedLineValues(values: LocalizedText[]): LocalizedText[] {
  return values.map((item) => ({
    zh: item.zh,
    en: item.zh,
  }))
}

export function clearLocalizedLineValues(values: LocalizedText[]): LocalizedText[] {
  return values.map((item) => ({
    zh: item.zh,
    en: '',
  }))
}

export function copyProfileInterestValues(
  values: ResumeProfileInterestItem[],
): ResumeProfileInterestItem[] {
  return values.map((item) => ({
    ...item,
    label: {
      zh: item.label.zh,
      en: item.label.zh,
    },
  }))
}

export function clearProfileInterestValues(
  values: ResumeProfileInterestItem[],
): ResumeProfileInterestItem[] {
  return values.map((item) => ({
    ...item,
    label: {
      zh: item.label.zh,
      en: '',
    },
  }))
}

export function ensureHeroSlogans(hero: ResumeProfileHero): ResumeProfileHero {
  if (hero.slogans.length >= 2) {
    return hero
  }

  return {
    ...hero,
    slogans: [
      ...hero.slogans,
      ...Array.from({ length: 2 - hero.slogans.length }, () =>
        createEmptyLocalizedText(),
      ),
    ],
  }
}
