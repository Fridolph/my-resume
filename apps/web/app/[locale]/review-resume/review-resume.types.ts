/** review-resume 页面类型 — 对齐 API 实际响应结构 */

export interface LocalizedText {
  zh: string
  en: string
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
}

export interface ResumeSkill {
  name: LocalizedText
  keywords: LocalizedText[]
  proficiency?: number
}

export interface ResumeExperience {
  companyName: LocalizedText
  role: LocalizedText
  startDate: string
  endDate: string
  location: LocalizedText
  summary: LocalizedText
  highlights: LocalizedText[]
  technologies: string[]
}

export interface ResumeProject {
  name: LocalizedText
  role: LocalizedText
  startDate: string
  endDate: string
  summary: LocalizedText
  highlights: LocalizedText[]
  technologies: string[]
}

export interface ResumeInterest {
  label: LocalizedText
  icon?: string
}

export interface ResumeProfile {
  fullName: LocalizedText
  headline: LocalizedText
  summary: LocalizedText
  location: LocalizedText
  email: string
  phone: string
  website: string
  interests: ResumeInterest[]
}

export interface ResumeData {
  profile: ResumeProfile
  highlights: ResumeHighlight[]
  education: ResumeEducation[]
  skills: ResumeSkill[]
  experiences: ResumeExperience[]
  projects: ResumeProject[]
}

/**
 * API /api/resume/published 实际返回结构：
 * `{ code, data: { status, resume: ResumeData, publishedAt }, message, timestamp, traceId }`
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

export function t(v: LocalizedText, locale: ReviewLocale) {
  return locale === 'en' ? v.en || v.zh : v.zh
}
