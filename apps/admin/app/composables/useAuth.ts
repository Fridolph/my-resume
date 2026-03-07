import { getRolePermissions } from '@repo/types'
import type { RoleKey, UserSession } from '@repo/types'

const mockUsers = [
  {
    id: 'u_super_admin',
    name: 'Fridolph Super Admin',
    email: 'root@fridolph.local',
    password: 'root123',
    role: 'super-admin'
  },
  {
    id: 'u_admin',
    name: 'Fridolph Admin',
    email: 'admin@fridolph.local',
    password: 'admin123',
    role: 'admin'
  },
  {
    id: 'u_editor',
    name: 'Fridolph Editor',
    email: 'editor@fridolph.local',
    password: 'editor123',
    role: 'editor'
  },
  {
    id: 'u_translator',
    name: 'Fridolph Translator',
    email: 'translator@fridolph.local',
    password: 'translator123',
    role: 'translator'
  },
  {
    id: 'u_viewer',
    name: 'Fridolph Viewer',
    email: 'viewer@fridolph.local',
    password: 'viewer123',
    role: 'viewer'
  }
] as const satisfies Array<{
  id: string
  name: string
  email: string
  password: string
  role: RoleKey
}>

function buildSession(user: (typeof mockUsers)[number]): UserSession {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    permissions: getRolePermissions(user.role)
  }
}

export function useAuth() {
  const sessionCookie = useCookie<UserSession | null>('admin-session', {
    default: () => null,
    sameSite: 'lax'
  })

  const session = useState<UserSession | null>('admin-session-state', () => sessionCookie.value ?? null)

  watch(
    session,
    value => {
      sessionCookie.value = value
    },
    { deep: true }
  )

  const isAuthenticated = computed(() => Boolean(session.value))

  async function login(email: string, password: string) {
    await new Promise(resolve => setTimeout(resolve, 150))

    const matchedUser = mockUsers.find(user => user.email === email && user.password === password)

    if (!matchedUser) {
      throw createError({
        statusCode: 401,
        statusMessage: '邮箱或密码不正确'
      })
    }

    session.value = buildSession(matchedUser)
    return session.value
  }

  function logout() {
    session.value = null
    return navigateTo('/login')
  }

  return {
    session,
    isAuthenticated,
    login,
    logout,
    mockUsers
  }
}
