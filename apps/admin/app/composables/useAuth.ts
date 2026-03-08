import type { UserSession } from '@repo/types'
import { PlatformApiError } from '@repo/sdk'

let refreshSessionPromise: Promise<UserSession | null> | null = null

const demoAccounts = [
  {
    label: 'Fridolph Super Admin · super-admin',
    description: 'root@fridolph.local / root123'
  },
  {
    label: 'Fridolph Admin · admin',
    description: 'admin@fridolph.local / admin123'
  },
  {
    label: 'Fridolph Editor · editor',
    description: 'editor@fridolph.local / editor123'
  },
  {
    label: 'Fridolph Translator · translator',
    description: 'translator@fridolph.local / translator123'
  },
  {
    label: 'Fridolph Viewer · viewer',
    description: 'viewer@fridolph.local / viewer123'
  }
]

export function useAuth() {
  const apiClient = usePlatformApiClient()
  const sessionCookie = useCookie<UserSession | null>('admin-session', {
    default: () => null,
    sameSite: 'lax'
  })
  const session = useState<UserSession | null>('admin-session-state', () => sessionCookie.value ?? null)
  const ready = useState<boolean>('admin-auth-ready', () => false)

  watch(
    session,
    value => {
      sessionCookie.value = value
    },
    { deep: true }
  )

  const isAuthenticated = computed(() => Boolean(session.value))

  async function refreshSession(force = false) {
    if (!force && ready.value) {
      return session.value
    }

    if (!force && refreshSessionPromise) {
      return await refreshSessionPromise
    }

    refreshSessionPromise = (async () => {
      try {
        const currentUser = await apiClient.getCurrentUser()
        session.value = currentUser
        ready.value = true
        return currentUser
      } catch (error) {
        if (error instanceof PlatformApiError && error.statusCode === 401) {
          session.value = null
          ready.value = true
          return null
        }

        throw error
      } finally {
        refreshSessionPromise = null
      }
    })()

    return await refreshSessionPromise
  }

  async function login(email: string, password: string) {
    const result = await apiClient.login({ email, password })
    session.value = result.session
    ready.value = true
    return result.session
  }

  async function logout() {
    await apiClient.logout()
    session.value = null
    ready.value = true
    return navigateTo('/login')
  }

  return {
    session,
    ready,
    isAuthenticated,
    login,
    logout,
    refreshSession,
    demoAccounts
  }
}
