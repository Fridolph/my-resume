import {
  publishResume as publishResumeRequest,
  type ResumePublishedSnapshot,
} from '@my-resume/api-client'

import { AuthUserView, LoginResult } from '../types/auth.types'

interface LoginWithPasswordInput {
  apiBaseUrl: string
  username: string
  password: string
}

interface FetchCurrentUserInput {
  apiBaseUrl: string
  accessToken: string
}

interface PostProtectedActionInput extends FetchCurrentUserInput {
  pathname: string
}

interface ProtectedActionResponse {
  message: string
}

function joinApiUrl(apiBaseUrl: string, pathname: string): string {
  return `${apiBaseUrl.replace(/\/$/, '')}${pathname}`
}

export async function loginWithPassword(
  input: LoginWithPasswordInput,
): Promise<LoginResult> {
  const response = await fetch(joinApiUrl(input.apiBaseUrl, '/auth/login'), {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      username: input.username,
      password: input.password,
    }),
  })

  if (!response.ok) {
    throw new Error('账号或密码错误')
  }

  return (await response.json()) as LoginResult
}

export async function fetchCurrentUser(
  input: FetchCurrentUserInput,
): Promise<AuthUserView> {
  const response = await fetch(joinApiUrl(input.apiBaseUrl, '/auth/me'), {
    headers: {
      Authorization: `Bearer ${input.accessToken}`,
    },
  })

  if (!response.ok) {
    throw new Error('登录状态已失效')
  }

  const payload = (await response.json()) as {
    user: AuthUserView
  }

  return payload.user
}

export async function postProtectedAction(
  input: PostProtectedActionInput,
): Promise<ProtectedActionResponse> {
  const response = await fetch(joinApiUrl(input.apiBaseUrl, input.pathname), {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${input.accessToken}`,
    },
  })

  if (!response.ok) {
    throw new Error('当前角色无权执行该操作')
  }

  return (await response.json()) as ProtectedActionResponse
}

export async function publishResume(
  input: FetchCurrentUserInput,
): Promise<ResumePublishedSnapshot> {
  return publishResumeRequest(input)
}
