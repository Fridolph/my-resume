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
 * 构造用户名密码登录 Method
 *
 * @param input 登录参数
 * @returns 登录请求 Method
 */
export function createLoginWithPasswordMethod(input: LoginWithPasswordInput) {
  return Alova.createMethod<LoginResult>({
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
  })
}

/**
 * 构造读取当前用户 Method
 *
 * @param input 请求参数
 * @returns 当前用户请求 Method
 */
export function createFetchCurrentUserMethod(input: FetchCurrentUserInput) {
  return Alova.createMethod<{
    user: AuthUserView
  }>({
    apiBaseUrl: input.apiBaseUrl,
    pathname: '/auth/me',
    accessToken: input.accessToken,
    fallbackErrorMessage: '登录状态已失效',
  })
}

/**
 * 构造受保护动作 Method
 *
 * @param input 请求参数
 * @returns 动作请求 Method
 */
export function createPostProtectedActionMethod(input: PostProtectedActionInput) {
  return Alova.createMethod<ProtectedActionResponse>({
    apiBaseUrl: input.apiBaseUrl,
    pathname: input.pathname,
    method: 'POST',
    accessToken: input.accessToken,
    fallbackErrorMessage: '当前角色无权执行该操作',
  })
}
