/** review-resume 页面类型 — 对齐 API /api/resume/published 实际响应 */

export interface LocalizedText {
  zh: string
  en: string
}

export interface ResumeLink {
  label: LocalizedText
  url: string
  icon?: string
}

export interface ResumeHero {
  frontImageUrl: string
  backImageUrl: string
  linkUrl: string
  slogans: string[]
}

export interface ResumeProfile {
  fullName: LocalizedText
  headline: LocalizedText
  summary: LocalizedText
  location: LocalizedText
  email: string
  phone: string
  website: string
  links: ResumeLink[]
  interests: ResumeInterest[]
  hero: ResumeHero
}

export interface ResumeInterest {
  label: LocalizedText
  icon?: string
}

export interface ResumeHighlight {
  title: LocalizedText
  description: LocalizedText
}

export interface ResumeEducation {
  schoolName: LocalizedText
  degree: LocalizedText
  fieldOfStudy: LocalizedText
  startDate: string
  endDate: string
  location: LocalizedText
  highlights: LocalizedText[]
}

export interface ResumeSkill {
  name: LocalizedText
  keywords: LocalizedText[]
  proficiency?: number
}

export interface ResumeExperience {
  companyName: LocalizedText
  role: LocalizedText
  employmentType: string
  startDate: string
  endDate: string
  location: LocalizedText
  summary: LocalizedText
  highlights: LocalizedText[]
  technologies: string[]
}

export interface ResumeProjectLink {
  label: LocalizedText
  url: string
}

export interface ResumeProject {
  name: LocalizedText
  role: LocalizedText
  startDate: string
  endDate: string
  summary: LocalizedText
  coreFunctions?: string
  highlights: LocalizedText[]
  technologies: string[]
  links: ResumeProjectLink[]
}

export interface ResumeData {
  meta: {
    slug: string
    version: number
    defaultLocale: 'zh' | 'en'
    locales: string[]
  }
  profile: ResumeProfile
  highlights: ResumeHighlight[]
  education: ResumeEducation[]
  skills: ResumeSkill[]
  experiences: ResumeExperience[]
  projects: ResumeProject[]
}

/**
 * API /api/resume/published 实际返回结构
 */
export interface PublishedResumeApiResponse {
  code: number
  data: {
    status: string
    resume: ResumeData
    publishedAt: string
  }
  message: string
  timestamp: string
  traceId: string
}

export type ReviewLocale = 'zh' | 'en'

export function t(v: LocalizedText, locale: ReviewLocale): string {
  if (locale === 'en') {
    const en = v.en?.trim()
    return en || v.zh?.trim() || ''
  }
  return v.zh?.trim() || v.en?.trim() || ''
}
