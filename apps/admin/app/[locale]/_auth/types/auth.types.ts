/**
 * 后台角色能力定义。
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
 * 当前登录用户视图。
 */
export interface AuthUserView {
  id: string
  username: string
  role: 'admin' | 'viewer'
  isActive: boolean
  capabilities: RoleCapabilities
}

/**
 * 登录成功返回模型。
 */
export interface LoginResult {
  accessToken: string
  tokenType: 'Bearer'
  expiresIn: number
  user: AuthUserView
}
