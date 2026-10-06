'use client'

import type { AuthUserView } from '@my-resume/api-client'
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import type { ReactNode } from 'react'

import { fetchCurrentUser } from '@features/auth/apis/current-user'
import { loginWithPassword } from '@features/auth/apis/login'
import { tokenStorage } from '@shared/lib/auth/token-storage'

type AuthStatus = 'loading' | 'ready' | 'unauthorized'

interface AuthContextValue {
  status: AuthStatus
  user: AuthUserView | null
  login: (username: string, password: string) => Promise<void>
  logout: () => void
}

const AuthContext = createContext<AuthContextValue | null>(null)

/**
 * 会话上下文：单一来源管理登录态。
 * 进入后台时读 token 校验一次（/auth/me），避免各页面重复校验。
 */
export function AuthProvider({ children }: { children: ReactNode }) {
  const [status, setStatus] = useState<AuthStatus>('loading')
  const [user, setUser] = useState<AuthUserView | null>(null)

  const refresh = useCallback(async () => {
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
    const result = await loginWithPassword(username, password).send()
    tokenStorage.set(result.accessToken)
    setUser(result.user)
    setStatus('ready')
  }, [])

  const logout = useCallback(() => {
    tokenStorage.clear()
    setUser(null)
    setStatus('unauthorized')
  }, [])

  const value = useMemo(
    () => ({ status, user, login, logout }),
    [status, user, login, logout],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
