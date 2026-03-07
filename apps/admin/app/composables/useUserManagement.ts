import type { PermissionKey, RoleKey, UserRecord, UserStatus } from '@repo/types'

const rolePermissions: Record<RoleKey, PermissionKey[]> = {
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

function createUserRecord(input: {
  id: string
  name: string
  email: string
  role: RoleKey
  status: UserStatus
}): UserRecord {
  return {
    ...input,
    permissions: rolePermissions[input.role],
    updatedAt: new Date().toISOString()
  }
}

const initialUsers: UserRecord[] = [
  createUserRecord({
    id: 'u_admin',
    name: 'Fridolph Admin',
    email: 'admin@fridolph.local',
    role: 'admin',
    status: 'active'
  }),
  createUserRecord({
    id: 'u_editor',
    name: 'Fridolph Editor',
    email: 'editor@fridolph.local',
    role: 'editor',
    status: 'active'
  }),
  createUserRecord({
    id: 'u_translator',
    name: 'Fridolph Translator',
    email: 'translator@fridolph.local',
    role: 'translator',
    status: 'disabled'
  })
]

export function useUserManagement() {
  const users = useState<UserRecord[]>('admin-users', () => structuredClone(initialUsers))
  const keyword = ref('')
  const selectedRole = ref<'all' | RoleKey>('all')
  const selectedStatus = ref<'all' | UserStatus>('all')
  const editingUserId = ref<string | null>(null)
  const isFormOpen = ref(false)

  const form = reactive({
    name: '',
    email: '',
    role: 'editor' as RoleKey,
    status: 'active' as UserStatus
  })

  const filteredUsers = computed(() => {
    return users.value.filter((user) => {
      const matchesKeyword = !keyword.value
        || user.name.toLowerCase().includes(keyword.value.toLowerCase())
        || user.email.toLowerCase().includes(keyword.value.toLowerCase())
      const matchesRole = selectedRole.value === 'all' || user.role === selectedRole.value
      const matchesStatus = selectedStatus.value === 'all' || user.status === selectedStatus.value
      return matchesKeyword && matchesRole && matchesStatus
    })
  })

  const stats = computed(() => ({
    total: users.value.length,
    active: users.value.filter(user => user.status === 'active').length,
    disabled: users.value.filter(user => user.status === 'disabled').length
  }))

  function resetForm() {
    form.name = ''
    form.email = ''
    form.role = 'editor'
    form.status = 'active'
    editingUserId.value = null
  }

  function openCreateForm() {
    resetForm()
    isFormOpen.value = true
  }

  function openEditForm(user: UserRecord) {
    editingUserId.value = user.id
    form.name = user.name
    form.email = user.email
    form.role = user.role
    form.status = user.status
    isFormOpen.value = true
  }

  function closeForm() {
    isFormOpen.value = false
    resetForm()
  }

  function saveUser() {
    if (!form.name.trim() || !form.email.trim()) {
      throw createError({
        statusCode: 400,
        statusMessage: '请完整填写姓名和邮箱'
      })
    }

    if (editingUserId.value) {
      users.value = users.value.map((user) => {
        if (user.id !== editingUserId.value) {
          return user
        }
        return createUserRecord({
          id: user.id,
          name: form.name.trim(),
          email: form.email.trim(),
          role: form.role,
          status: form.status
        })
      })
    } else {
      users.value = [
        createUserRecord({
          id: `user_${crypto.randomUUID()}`,
          name: form.name.trim(),
          email: form.email.trim(),
          role: form.role,
          status: form.status
        }),
        ...users.value
      ]
    }

    closeForm()
  }

  function toggleUserStatus(userId: string) {
    users.value = users.value.map((user) => {
      if (user.id !== userId) {
        return user
      }
      return createUserRecord({
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        status: user.status === 'active' ? 'disabled' : 'active'
      })
    })
  }

  function updateUserRole(userId: string, role: RoleKey) {
    users.value = users.value.map((user) => {
      if (user.id !== userId) {
        return user
      }
      return createUserRecord({
        id: user.id,
        name: user.name,
        email: user.email,
        role,
        status: user.status
      })
    })
  }

  return {
    users,
    filteredUsers,
    keyword,
    selectedRole,
    selectedStatus,
    stats,
    form,
    isFormOpen,
    editingUserId,
    openCreateForm,
    openEditForm,
    closeForm,
    saveUser,
    toggleUserStatus,
    updateUserRole
  }
}
