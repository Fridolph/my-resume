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

import type { AuthUserView } from './auth-types'
import { clearAdminResourceStore, ensureCurrentUserSession } from './admin-resource-store'
import { DEFAULT_API_BASE_URL } from './env'
import { clearAccessToken, readAccessToken } from './session-storage'

type AdminSessionStatus = 'loading' | 'ready' | 'unauthorized'

interface AdminSessionContextValue {
  accessToken: string | null
  currentUser: AuthUserView | null
  logout: () => void
  refreshSession: () => Promise<void>
  status: AdminSessionStatus
}

const AdminSessionContext = createContext<AdminSessionContextValue | null>(null)

export function AdminSessionProvider({ children }: { children: ReactNode }) {
  const [status, setStatus] = useState<AdminSessionStatus>('loading')
  const [accessToken, setAccessToken] = useState<string | null>(null)
  const [currentUser, setCurrentUser] = useState<AuthUserView | null>(null)

  const logout = useCallback(() => {
    const activeAccessToken = readAccessToken()

    clearAccessToken()
    clearAdminResourceStore({
      accessToken: activeAccessToken,
      apiBaseUrl: DEFAULT_API_BASE_URL,
    })
    setAccessToken(null)
    setCurrentUser(null)
    setStatus('unauthorized')
  }, [])

  const refreshSession = useCallback(async () => {
    const nextAccessToken = readAccessToken()

    if (!nextAccessToken) {
      setAccessToken(null)
      setCurrentUser(null)
      setStatus('unauthorized')
      return
    }

    setStatus('loading')

    try {
      const nextUser = await ensureCurrentUserSession({
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
      logout,
      refreshSession,
      status,
    }),
    [accessToken, currentUser, logout, refreshSession, status],
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
