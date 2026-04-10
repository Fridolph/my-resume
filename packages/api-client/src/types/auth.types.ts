import type { RequestPolicy } from './client.types'

/**
 * 角色能力声明
 */
export interface RoleCapabilities {
  canAccessAdminSurface?: boolean
  canReadPublishedResume?: boolean
  canReadViewerExperience?: boolean
  canEditResume?: boolean
  canPublishResume?: boolean
  canTriggerAiAnalysis?: boolean
}

/**
 * 当前用户视图
 */
export interface AuthUserView {
  id: string
  username: string
  role: 'admin' | 'viewer'
  isActive: boolean
  capabilities: RoleCapabilities
}

/**
 * 登录结果
 */
export interface LoginResult {
  accessToken: string
  tokenType: 'Bearer'
  expiresIn: number
  user: AuthUserView
}

/**
 * 登录参数
 */
export interface LoginWithPasswordInput {
  apiBaseUrl: string
  username: string
  password: string
  requestPolicy?: RequestPolicy
}

/**
 * 当前用户查询参数
 */
export interface FetchCurrentUserInput {
  apiBaseUrl: string
  accessToken: string
  requestPolicy?: RequestPolicy
}

/**
 * 受保护动作参数
 */
export interface PostProtectedActionInput extends FetchCurrentUserInput {
  pathname: string
}

/**
 * 受保护动作返回
 */
export interface ProtectedActionResponse {
  message: string
}

