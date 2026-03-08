export type EntityId = string

export interface Locale {
  id: EntityId
  code: string
  name: string
  enabled: boolean
}

export type PublishStatus = 'draft' | 'reviewing' | 'published' | 'archived'

export const publishStatusTransitionMap: Record<PublishStatus, PublishStatus[]> = {
  draft: ['reviewing', 'archived'],
  reviewing: ['draft', 'published', 'archived'],
  published: ['draft', 'archived'],
  archived: ['draft']
}

export const publishStatusLabels: Record<PublishStatus, string> = {
  draft: '草稿',
  reviewing: '审核中',
  published: '已发布',
  archived: '已归档'
}

export function getAllowedPublishStatusTransitions(currentStatus: PublishStatus) {
  return [...publishStatusTransitionMap[currentStatus]]
}

export function canTransitionPublishStatus(currentStatus: PublishStatus, nextStatus: PublishStatus) {
  if (currentStatus === nextStatus) {
    return true
  }

  return publishStatusTransitionMap[currentStatus].includes(nextStatus)
}

export const roleKeys = ['super-admin', 'admin', 'editor', 'translator', 'viewer'] as const
export type RoleKey = (typeof roleKeys)[number]

export const permissionKeys = [
  'dashboard.read',
  'user.read',
  'user.write',
  'translation.read',
  'translation.write',
  'resume.read',
  'resume.write',
  'project.read',
  'project.write',
  'site.read',
  'site.write'
] as const
export type PermissionKey = (typeof permissionKeys)[number]

export const rolePermissions: Record<RoleKey, PermissionKey[]> = {
  'super-admin': [...permissionKeys],
  admin: [
    'dashboard.read',
    'user.read',
    'user.write',
    'translation.read',
    'translation.write',
    'resume.read',
    'resume.write',
    'project.read',
    'project.write',
    'site.read',
    'site.write'
  ],
  editor: [
    'dashboard.read',
    'translation.read',
    'resume.read',
    'resume.write',
    'project.read',
    'project.write',
    'site.read'
  ],
  translator: [
    'dashboard.read',
    'translation.read',
    'translation.write',
    'site.read'
  ],
  viewer: [
    'dashboard.read',
    'user.read',
    'translation.read',
    'resume.read',
    'project.read',
    'site.read'
  ]
}

export function getRolePermissions(role: RoleKey) {
  return [...rolePermissions[role]]
}

export type UserStatus = 'active' | 'disabled'
export type TranslationNamespace = 'common' | 'resume' | 'project' | 'seo'
export type WebLocale = 'zh-CN' | 'en-US'
export type ThemePreference = 'system' | 'light' | 'dark'

export interface ApiResponseMeta {
  path: string
  timestamp: string
}

export interface ApiSuccessResponse<T> {
  success: true
  data: T
  meta: ApiResponseMeta
}

export interface ApiErrorPayload {
  code: string
  message: string
  statusCode: number
  details?: unknown
}

export interface ApiErrorResponse {
  success: false
  error: ApiErrorPayload
  meta: ApiResponseMeta
}

export type ApiResponse<T> = ApiSuccessResponse<T> | ApiErrorResponse

export interface UserSession {
  id: EntityId
  name: string
  email: string
  role: RoleKey
  permissions: PermissionKey[]
}

export interface AuthLoginInput {
  email: string
  password: string
}

export interface AuthLoginResult {
  session: UserSession
  expiresAt: string
}

export interface ContentActorSummary {
  id: EntityId
  name: string
  email: string
}

export interface ContentAuditFields {
  updatedBy: ContentActorSummary | null
  reviewedBy: ContentActorSummary | null
  publishedAt: string | null
}

export type ContentModuleType = 'translation' | 'resume' | 'project'
export type ContentVersionChangeType = 'seed' | 'create' | 'update' | 'restore'

export interface ContentVersionRecord<TSnapshot = unknown> {
  id: EntityId
  moduleType: ContentModuleType
  entityId: EntityId
  version: number
  status: PublishStatus
  changeType: ContentVersionChangeType
  snapshot: TSnapshot
  createdBy: ContentActorSummary | null
  createdAt: string
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

export interface TranslationRecord extends ContentAuditFields {
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

export interface ResumeDocument extends ContentAuditFields {
  id: EntityId
  status: PublishStatus
  updatedAt: string
  locales: Record<WebLocale, ResumeLocaleContent>
}

export interface ProjectLocaleContent {
  locale: WebLocale
  title: string
  description: string
  summary: string
}

export interface ProjectRecord extends ContentAuditFields {
  id: EntityId
  slug: string
  status: PublishStatus
  sortOrder: number
  cover: string
  externalUrl: string
  tags: string[]
  updatedAt: string
  locales: Record<WebLocale, ProjectLocaleContent>
}

export type TranslationVersionRecord = ContentVersionRecord<TranslationRecord>
export type ResumeVersionRecord = ContentVersionRecord<ResumeDocument>
export type ProjectVersionRecord = ContentVersionRecord<ProjectRecord>

export interface SiteSocialLink {
  id: EntityId
  label: string
  url: string
}

export interface SiteDownloadLink {
  id: EntityId
  label: string
  url: string
}

export interface SiteSeoDefaults {
  title: string
  description: string
  ogImage: string
  siteUrl: string
}

export interface SiteSettingsRecord {
  id: EntityId
  defaultLocale: WebLocale
  socialLinks: SiteSocialLink[]
  downloadLinks: SiteDownloadLink[]
  seo: SiteSeoDefaults
  updatedAt: string
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
