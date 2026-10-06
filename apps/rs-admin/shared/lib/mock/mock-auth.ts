import type { AuthUserView, LoginResult } from '@my-resume/api-client'

/**
 * mock 模式专用：本地假登录态。
 * 只在 env.useMock 为 true 时被引用，不参与真实请求。
 */

/** 固定假令牌（不会发往后端） */
export const MOCK_ACCESS_TOKEN = 'mock-access-token'

/** mock 管理员用户，拥有全部能力 */
export const mockAdminUser: AuthUserView = {
  id: 'mock-admin-user',
  username: 'admin',
  role: 'admin',
  isActive: true,
  capabilities: {
    canAccessAdminSurface: true,
    canReadPublishedResume: true,
    canReadViewerExperience: true,
    canEditResume: true,
    canPublishResume: true,
    canTriggerAiAnalysis: true,
  },
}

/** 构造 mock 登录结果：登录页点一下即可直接进入后台 */
export function createMockLoginResult(username: string = mockAdminUser.username): LoginResult {
  return {
    accessToken: MOCK_ACCESS_TOKEN,
    tokenType: 'Bearer',
    expiresIn: 60 * 60 * 24,
    user: { ...mockAdminUser, username },
  }
}
