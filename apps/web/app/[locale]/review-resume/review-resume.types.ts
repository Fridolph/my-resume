/** review-resume 页面类型 — 对齐 API /api/resume/published?locale=zh|en 压平响应 */

export interface ResumeLink {
  label: string
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
  fullName: string
  headline: string
  summary: string
  location: string
  email: string
  phone: string
  website: string
  links: ResumeLink[]
  interests: ResumeInterest[]
  hero: ResumeHero
}

export interface ResumeInterest {
  label: string
  icon?: string
}

export interface ResumeHighlight {
  title: string
  description: string
}

export interface ResumeEducation {
  schoolName: string
  degree: string
  fieldOfStudy: string
  startDate: string
  endDate: string
  location: string
  highlights: string[]
}

export interface ResumeSkill {
  name: string
  keywords: string[]
  proficiency?: number
}

export interface ResumeExperience {
  companyName: string
  role: string
  employmentType: string
  startDate: string
  endDate: string
  location: string
  summary: string
  highlights: string[]
  technologies: string[]
}

export interface ResumeProjectLink {
  label: string
  url: string
}

export interface ResumeProject {
  name: string
  role: string
  startDate: string
  endDate: string
  summary: string
  coreFunctions?: string
  highlights: string[]
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

export function t(value: string | null | undefined, _locale: ReviewLocale): string {
  return value?.trim() ?? ''
}
