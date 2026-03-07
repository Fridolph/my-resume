<script setup lang="ts">
import { roleKeys } from '@repo/types'
import type { RoleKey, UserRecord } from '@repo/types'

definePageMeta({
  middleware: 'auth'
})

const toast = useToast()
const { hasPermission } = usePermissions()

if (!hasPermission('user.read')) {
  await navigateTo('/unauthorized')
}

const apiClient = usePlatformApiClient()

const { data, pending, error, refresh } = await useAsyncData('admin-users-api', async () => {
  return await apiClient.listUsers()
})

const canWriteUsers = hasPermission('user.write')
const roleLabelMap: Record<RoleKey, string> = {
  'super-admin': '超级管理员',
  admin: '管理员',
  editor: '编辑',
  translator: '翻译',
  viewer: '查看者'
}

const roleOptions: Array<{ label: string, value: 'all' | RoleKey }> = [
  { label: '全部角色', value: 'all' },
  ...roleKeys.map(role => ({
    label: roleLabelMap[role],
    value: role
  }))
]
const statusOptions = [
  { label: '全部状态', value: 'all' },
  { label: '启用', value: 'active' },
  { label: '禁用', value: 'disabled' }
] as const

const {
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
} = useUserManagement(data.value)

watch(data, (value) => {
  if (value) {
    replaceUsers(value)
  }
}, { immediate: true })

async function handleSaveUser() {
  try {
    const payload = buildUserInput()
    const saved = editingUserId.value
      ? await apiClient.updateUser(editingUserId.value, payload)
      : await apiClient.createUser(payload)

    upsertUser(saved)
    await refresh()
    closeForm()
    toast.add({
      title: editingUserId.value ? '用户已更新' : '用户已创建',
      description: '用户信息、角色和状态已同步到真实数据层。',
      color: 'success'
    })
  } catch (saveError) {
    const message = saveError instanceof Error ? saveError.message : '保存失败，请稍后重试。'
    toast.add({
      title: '保存失败',
      description: message,
      color: 'error'
    })
  }
}

async function handleToggleUserStatus(user: UserRecord) {
  const saved = await apiClient.updateUser(user.id, {
    name: user.name,
    email: user.email,
    role: user.role,
    status: user.status === 'active' ? 'disabled' : 'active'
  })
  upsertUser(saved)
  await refresh()
  toast.add({
    title: user.status === 'active' ? '用户已禁用' : '用户已启用',
    description: `${user.name} 的状态已更新。`,
    color: 'success'
  })
}

async function handleRoleChange(user: UserRecord, role: RoleKey) {
  const saved = await apiClient.updateUser(user.id, {
    name: user.name,
    email: user.email,
    role,
    status: user.status
  })
  upsertUser(saved)
  await refresh()
  toast.add({
    title: '角色已更新',
    description: `${user.name} 已切换为 ${role} 角色。`,
    color: 'success'
  })
}
</script>

<template>
  <UContainer class="py-10">
    <template v-if="pending">
      <UCard>
        <p class="text-sm text-muted">
          正在加载用户列表…
        </p>
      </UCard>
    </template>

    <template v-else-if="error || !data">
      <UAlert title="用户列表加载失败" description="请检查 P3 用户模块 API 接入。" color="error" variant="subtle" />
    </template>

    <template v-else>
      <div class="space-y-6">
        <div class="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div class="space-y-2">
            <UBadge label="P5-1 角色与权限模型" variant="subtle" color="primary" class="w-fit" />
            <div class="space-y-1">
              <h1 class="text-2xl font-semibold text-highlighted">
                用户管理
              </h1>
              <p class="max-w-2xl text-sm text-muted">
                当前用户模块已开始使用统一角色与权限模型，后续会继续衔接真实鉴权、权限守卫与接口边界控制。
              </p>
            </div>
          </div>

          <UButton
            v-if="canWriteUsers"
            label="新建用户"
            icon="i-lucide-user-plus"
            @click="openCreateForm"
          />
        </div>

        <div class="grid gap-4 md:grid-cols-3">
          <UCard>
            <template #header>总用户数</template>
            <p class="text-2xl font-semibold text-highlighted">
              {{ stats.total }}
            </p>
          </UCard>
          <UCard>
            <template #header>启用中</template>
            <p class="text-2xl font-semibold text-highlighted">
              {{ stats.active }}
            </p>
          </UCard>
          <UCard>
            <template #header>已禁用</template>
            <p class="text-2xl font-semibold text-highlighted">
              {{ stats.disabled }}
            </p>
          </UCard>
        </div>

        <UCard>
          <template #header>
            <div class="space-y-1">
              <h2 class="text-base font-semibold text-highlighted">
                筛选与查询
              </h2>
              <p class="text-sm text-muted">
                当前列表已经由真实 API 驱动，筛选区继续沿用后台通用列表结构。
              </p>
            </div>
          </template>

          <div class="grid gap-4 lg:grid-cols-[2fr_1fr_1fr]">
            <UFormField label="关键字搜索">
              <UInput v-model="keyword" placeholder="按姓名或邮箱搜索" icon="i-lucide-search" />
            </UFormField>

            <UFormField label="角色筛选">
              <select v-model="selectedRole" class="w-full rounded-md border border-default bg-default px-3 py-2 text-sm text-default">
                <option v-for="option in roleOptions" :key="option.value" :value="option.value">
                  {{ option.label }}
                </option>
              </select>
            </UFormField>

            <UFormField label="状态筛选">
              <select v-model="selectedStatus" class="w-full rounded-md border border-default bg-default px-3 py-2 text-sm text-default">
                <option v-for="option in statusOptions" :key="option.value" :value="option.value">
                  {{ option.label }}
                </option>
              </select>
            </UFormField>
          </div>
        </UCard>

        <UCard v-if="isFormOpen && canWriteUsers">
          <template #header>
            <div class="space-y-1">
              <h2 class="text-base font-semibold text-highlighted">
                {{ editingUserId ? '编辑用户' : '创建用户' }}
              </h2>
              <p class="text-sm text-muted">
                当前阶段已切换到真实 API，角色与权限集合已开始收口到统一模型。
              </p>
            </div>
          </template>

          <div class="grid gap-4 md:grid-cols-2">
            <UFormField label="姓名">
              <UInput v-model="form.name" placeholder="请输入姓名" />
            </UFormField>

            <UFormField label="邮箱">
              <UInput v-model="form.email" type="email" placeholder="请输入邮箱" />
            </UFormField>

            <UFormField label="角色">
              <select v-model="form.role" class="w-full rounded-md border border-default bg-default px-3 py-2 text-sm text-default">
                <option v-for="role in roleKeys" :key="role" :value="role">{{ roleLabelMap[role] }}</option>
              </select>
            </UFormField>

            <UFormField label="状态">
              <select v-model="form.status" class="w-full rounded-md border border-default bg-default px-3 py-2 text-sm text-default">
                <option value="active">启用</option>
                <option value="disabled">禁用</option>
              </select>
            </UFormField>
          </div>

          <template #footer>
            <div class="flex gap-3">
              <UButton label="保存用户" @click="handleSaveUser" />
              <UButton label="取消" color="neutral" variant="subtle" @click="closeForm" />
            </div>
          </template>
        </UCard>

        <div class="grid gap-4">
          <UCard v-for="user in filteredUsers" :key="user.id">
            <template #header>
              <div class="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                <div class="space-y-1">
                  <div class="flex items-center gap-2">
                    <h2 class="text-base font-semibold text-highlighted">
                      {{ user.name }}
                    </h2>
                    <UBadge :label="roleLabelMap[user.role]" color="neutral" variant="subtle" />
                    <UBadge :label="user.status" :color="user.status === 'active' ? 'success' : 'warning'" variant="subtle" />
                  </div>
                  <p class="text-sm text-muted">
                    {{ user.email }}
                  </p>
                  <p class="text-xs text-muted">
                    更新时间：{{ new Date(user.updatedAt).toLocaleString() }}
                  </p>
                </div>

                <div v-if="canWriteUsers" class="flex flex-wrap gap-2">
                  <UButton label="编辑" color="neutral" variant="subtle" @click="openEditForm(user)" />
                  <UButton
                    :label="user.status === 'active' ? '禁用' : '启用'"
                    color="neutral"
                    variant="subtle"
                    @click="handleToggleUserStatus(user)"
                  />
                </div>
              </div>
            </template>

            <div class="grid gap-4 lg:grid-cols-[1.2fr_0.8fr]">
              <div class="space-y-2">
                <h3 class="text-sm font-medium text-default">
                  权限集合
                </h3>
                <div class="flex flex-wrap gap-2">
                  <UBadge v-for="permission in user.permissions" :key="permission" :label="permission" color="primary" variant="subtle" />
                </div>
              </div>

              <div class="space-y-2">
                <h3 class="text-sm font-medium text-default">
                  角色切换
                </h3>
                <div class="flex flex-wrap gap-2">
                  <UButton
                    v-for="role in roleKeys"
                    :key="role"
                    :label="roleLabelMap[role]"
                    size="xs"
                    :variant="user.role === role ? 'solid' : 'subtle'"
                    color="neutral"
                    :disabled="!canWriteUsers"
                    @click="handleRoleChange(user, role as RoleKey)"
                  />
                </div>
              </div>
            </div>
          </UCard>
        </div>
      </div>
    </template>
  </UContainer>
</template>
