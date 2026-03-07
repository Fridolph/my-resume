import type { RoleKey, UserSession } from '@repo/types'

const rolePermissions: Record<RoleKey, UserSession['permissions']> = {
  admin: [
    'dashboard.read',
    'user.read',
    'user.write',
    'translation.read',
    'translation.write',
    'resume.read',
    'resume.write',
    'project.read',
    'project.write',
    'site.write'
  ],
  editor: [
    'dashboard.read',
    'translation.read',
    'resume.read',
    'resume.write',
    'project.read',
    'project.write'
  ],
  translator: [
    'dashboard.read',
    'translation.read',
    'translation.write'
  ]
}

const mockUsers = [
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
    permissions: rolePermissions[user.role]
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
