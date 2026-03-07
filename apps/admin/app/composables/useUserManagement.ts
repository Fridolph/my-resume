import type { RoleKey, UserRecord, UserStatus } from '@repo/types'

export function useUserManagement(initialUsers?: UserRecord[] | null) {
  const users = useState<UserRecord[]>('admin-users', () => structuredClone(initialUsers ?? []))
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

  function replaceUsers(nextUsers: UserRecord[]) {
    users.value = structuredClone(nextUsers)
  }

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

  function buildUserInput() {
    if (!form.name.trim() || !form.email.trim()) {
      throw createError({
        statusCode: 400,
        statusMessage: '请完整填写姓名和邮箱'
      })
    }

    return {
      name: form.name.trim(),
      email: form.email.trim(),
      role: form.role,
      status: form.status
    }
  }

  function upsertUser(nextUser: UserRecord) {
    const exists = users.value.some(user => user.id === nextUser.id)
    users.value = exists
      ? users.value.map(user => user.id === nextUser.id ? nextUser : user)
      : [nextUser, ...users.value]
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
    replaceUsers,
    openCreateForm,
    openEditForm,
    closeForm,
    buildUserInput,
    upsertUser
  }
}
