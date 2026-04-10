import { defaultApiClient as Alova } from './client'
import type {
  AuthUserView,
  FetchCurrentUserInput,
  LoginResult,
  LoginWithPasswordInput,
  PostProtectedActionInput,
  ProtectedActionResponse,
  RoleCapabilities,
} from './types/auth.types'

export type {
  AuthUserView,
  FetchCurrentUserInput,
  LoginResult,
  LoginWithPasswordInput,
  PostProtectedActionInput,
  ProtectedActionResponse,
  RoleCapabilities,
} from './types/auth.types'

/**
 * 用户名密码登录
 *
 * @param input 登录参数
 * @returns 登录结果
 */
export async function loginWithPassword(
  input: LoginWithPasswordInput,
): Promise<LoginResult> {
  return Alova.request<LoginResult>({
    apiBaseUrl: input.apiBaseUrl,
    pathname: '/auth/login',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      username: input.username,
      password: input.password,
    }),
    fallbackErrorMessage: '账号或密码错误',
    requestPolicy: input.requestPolicy,
  })
}

/**
 * 读取当前登录用户
 *
 * @param input 请求参数
 * @returns 用户信息
 */
export async function fetchCurrentUser(
  input: FetchCurrentUserInput,
): Promise<AuthUserView> {
  const payload = await Alova.request<{
    user: AuthUserView
  }>({
    apiBaseUrl: input.apiBaseUrl,
    pathname: '/auth/me',
    accessToken: input.accessToken,
    fallbackErrorMessage: '登录状态已失效',
    requestPolicy: input.requestPolicy,
  })

  return payload.user
}

/**
 * 触发受保护动作
 *
 * @param input 请求参数
 * @returns 动作执行结果
 */
export async function postProtectedAction(
  input: PostProtectedActionInput,
): Promise<ProtectedActionResponse> {
  return Alova.request<ProtectedActionResponse>({
    apiBaseUrl: input.apiBaseUrl,
    pathname: input.pathname,
    method: 'POST',
    accessToken: input.accessToken,
    fallbackErrorMessage: '当前角色无权执行该操作',
    requestPolicy: input.requestPolicy,
  })
}
