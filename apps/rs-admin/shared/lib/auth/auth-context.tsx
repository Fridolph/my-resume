'use client'

import type { AuthUserView } from '@my-resume/api-client'
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import type { ReactNode } from 'react'

import { env } from '@config/env'
import { fetchCurrentUser } from '@features/auth/apis/current-user'
import { loginWithPassword } from '@features/auth/apis/login'
import { tokenStorage } from '@shared/lib/auth/token-storage'
import { createMockLoginResult, MOCK_ACCESS_TOKEN, mockAdminUser } from '@shared/lib/mock/mock-auth'

type AuthStatus = 'loading' | 'ready' | 'unauthorized'

interface AuthContextValue {
  status: AuthStatus
  user: AuthUserView | null
  /** 是否处于 mock 模式（不发真实请求） */
  isMock: boolean
  login: (username: string, password: string) => Promise<void>
  logout: () => void
}

const AuthContext = createContext<AuthContextValue | null>(null)

/**
 * 会话上下文：单一来源管理登录态。
 * - mock 模式（env.useMock）：本地直接置为已登录，不发任何请求
 * - 真实模式：进入后台时读 token 校验一次（/auth/me）
 */
export function AuthProvider({ children }: { children: ReactNode }) {
  const [status, setStatus] = useState<AuthStatus>(env.useMock ? 'ready' : 'loading')
  const [user, setUser] = useState<AuthUserView | null>(env.useMock ? mockAdminUser : null)

  const refresh = useCallback(async () => {
    // mock 模式：跳过所有后端校验，直接视为已登录
    if (env.useMock) {
      setUser(mockAdminUser)
      setStatus('ready')
      return
    }

    const token = tokenStorage.get()
    if (!token) {
      setUser(null)
      setStatus('unauthorized')
      return
    }
    try {
      const result = await fetchCurrentUser(token).send()
      setUser(result.user)
      setStatus('ready')
    } catch {
      tokenStorage.clear()
      setUser(null)
      setStatus('unauthorized')
    }
  }, [])

  useEffect(() => {
    void refresh()
  }, [refresh])

  const login = useCallback(async (username: string, password: string) => {
    // mock 模式：任意账号直接登录成功，便于本地查看页面
    if (env.useMock) {
      const result = createMockLoginResult(username || mockAdminUser.username)
      tokenStorage.set(MOCK_ACCESS_TOKEN)
      setUser(result.user)
      setStatus('ready')
      return
    }

    const result = await loginWithPassword(username, password).send()
    tokenStorage.set(result.accessToken)
    setUser(result.user)
    setStatus('ready')
  }, [])

  const logout = useCallback(() => {
    tokenStorage.clear()
    if (env.useMock) {
      // mock 模式下登出后仍可直接访问，仅清空展示态
      setUser(mockAdminUser)
      setStatus('ready')
      return
    }
    setUser(null)
    setStatus('unauthorized')
  }, [])

  const value = useMemo(
    () => ({ status, user, isMock: env.useMock, login, logout }),
    [status, user, login, logout],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
