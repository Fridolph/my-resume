export type EntityId = string

export interface Locale {
  id: EntityId
  code: string
  name: string
  enabled: boolean
}

export type PublishStatus = 'draft' | 'reviewing' | 'published' | 'archived'

export type RoleKey = 'admin' | 'editor' | 'translator'
export type UserStatus = 'active' | 'disabled'
export type TranslationNamespace = 'common' | 'resume' | 'project' | 'seo'
export type WebLocale = 'zh-CN' | 'en-US'
export type ThemePreference = 'system' | 'light' | 'dark'

export type PermissionKey =
  | 'dashboard.read'
  | 'user.read'
  | 'user.write'
  | 'translation.read'
  | 'translation.write'
  | 'resume.read'
  | 'resume.write'
  | 'project.read'
  | 'project.write'
  | 'site.write'

export interface UserSession {
  id: EntityId
  name: string
  email: string
  role: RoleKey
  permissions: PermissionKey[]
}

export interface UserRecord {
  id: EntityId
  name: string
  email: string
  role: RoleKey
  status: UserStatus
  permissions: PermissionKey[]
  updatedAt: string
}

export interface TranslationRecord {
  id: EntityId
  namespace: TranslationNamespace
  key: string
  locale: string
  value: string
  status: PublishStatus
  missing: boolean
  updatedAt: string
}

export interface ResumeBaseInfo {
  fullName: string
  headline: string
  location: string
  summary: string
}

export interface ResumeEducationItem {
  id: EntityId
  school: string
  degree: string
  period: string
  summary: string
}

export interface ResumeExperienceItem {
  id: EntityId
  company: string
  role: string
  period: string
  summary: string
}

export interface ResumeSkillGroup {
  id: EntityId
  title: string
  items: string[]
}

export interface ResumeContactItem {
  id: EntityId
  label: string
  value: string
  href?: string
}

export interface ResumeLocaleContent {
  locale: WebLocale
  baseInfo: ResumeBaseInfo
  education: ResumeEducationItem[]
  experiences: ResumeExperienceItem[]
  skillGroups: ResumeSkillGroup[]
  contacts: ResumeContactItem[]
}

export interface ResumeDocument {
  id: EntityId
  status: PublishStatus
  updatedAt: string
  locales: Record<WebLocale, ResumeLocaleContent>
}

export interface WebStatItem {
  label: string
  value: string
  hint?: string
}

export interface WebFeatureItem {
  title: string
  description: string
  to: string
  badge?: string
}

export interface ResumeSectionItem {
  title: string
  description: string
  highlights: string[]
}

export interface ProjectItem {
  title: string
  slug: string
  description: string
  tags: string[]
}

export interface HomePageContent {
  intro: {
    badge: string
    title: string
    description: string
  }
  stats: WebStatItem[]
  features: WebFeatureItem[]
}

export interface ResumePageContent {
  intro: {
    badge: string
    title: string
    description: string
  }
  sections: ResumeSectionItem[]
}

export interface ProjectsPageContent {
  intro: {
    badge: string
    title: string
    description: string
  }
  projects: ProjectItem[]
}

export interface ProjectDetailContent {
  slug: string
  intro: {
    badge: string
    title: string
    description: string
  }
  stats: WebStatItem[]
}
