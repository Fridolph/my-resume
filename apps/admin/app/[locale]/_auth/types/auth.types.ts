export interface RoleCapabilities {
  canAccessAdminSurface?: boolean
  canReadPublishedResume?: boolean
  canReadViewerExperience?: boolean
  canEditResume?: boolean
  canPublishResume?: boolean
  canTriggerAiAnalysis?: boolean
}

export interface AuthUserView {
  id: string
  username: string
  role: 'admin' | 'viewer'
  isActive: boolean
  capabilities: RoleCapabilities
}

export interface LoginResult {
  accessToken: string
  tokenType: 'Bearer'
  expiresIn: number
  user: AuthUserView
}
