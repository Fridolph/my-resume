'use client'

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'

import type { AuthUserView } from '../[locale]/_auth/types/auth.types'
import { fetchCurrentUser } from '../[locale]/_auth/services/auth-api'
import { DEFAULT_API_BASE_URL } from './env'
import { clearAccessToken, readAccessToken } from './session-storage'

type AdminSessionStatus = 'loading' | 'ready' | 'unauthorized'

interface AdminSessionContextValue {
  accessToken: string | null
  currentUser: AuthUserView | null
  establishSession: (input: { accessToken: string; user: AuthUserView }) => void
  logout: () => void
  refreshSession: () => Promise<void>
  status: AdminSessionStatus
}

const AdminSessionContext = createContext<AdminSessionContextValue | null>(null)

/**
 * 后台会话 Provider 负责把 token 校验结果提升为全局上下文，供整个 dashboard 复用
 *
 * @param children 后台页面内容
 * @returns 后台会话上下文 Provider
 */
export function AdminSessionProvider({ children }: { children: ReactNode }) {
  const [status, setStatus] = useState<AdminSessionStatus>('loading')
  const [accessToken, setAccessToken] = useState<string | null>(null)
  const [currentUser, setCurrentUser] = useState<AuthUserView | null>(null)

  const establishSession = useCallback(
    (input: { accessToken: string; user: AuthUserView }) => {
      setAccessToken(input.accessToken)
      setCurrentUser(input.user)
      setStatus('ready')
    },
    [],
  )

  /**
   * 清理本地 token，让后台壳回到未登录状态
   */
  const logout = useCallback(() => {
    clearAccessToken()
    setAccessToken(null)
    setCurrentUser(null)
    setStatus('unauthorized')
  }, [])

  /**
   * 读取本地 token 并向 server 校验当前用户，构建后台运行时会话
   *
   * @returns 当前刷新流程完成后的 Promise
   */
  const refreshSession = useCallback(async () => {
    const nextAccessToken = readAccessToken()

    if (!nextAccessToken) {
      setAccessToken(null)
      setCurrentUser(null)
      setStatus('unauthorized')
      return
    }

    // 进入 dashboard 前统一走一次 /auth/me，避免各页面各自重复校验
    setStatus('loading')

    try {
      const nextUser = await fetchCurrentUser({
        apiBaseUrl: DEFAULT_API_BASE_URL,
        accessToken: nextAccessToken,
      })

      setAccessToken(nextAccessToken)
      setCurrentUser(nextUser)
      setStatus('ready')
    } catch {
      logout()
    }
  }, [logout])

  useEffect(() => {
    void refreshSession()
  }, [refreshSession])

  const contextValue = useMemo<AdminSessionContextValue>(
    () => ({
      accessToken,
      currentUser,
      establishSession,
      logout,
      refreshSession,
      status,
    }),
    [accessToken, currentUser, establishSession, logout, refreshSession, status],
  )

  return (
    <AdminSessionContext.Provider value={contextValue}>
      {children}
    </AdminSessionContext.Provider>
  )
}

export function useAdminSession(): AdminSessionContextValue {
  const contextValue = useContext(AdminSessionContext)

  if (!contextValue) {
    throw new Error('useAdminSession must be used within AdminSessionProvider')
  }

  return contextValue
}
