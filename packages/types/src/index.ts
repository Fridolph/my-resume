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
