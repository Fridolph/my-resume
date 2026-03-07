<script setup lang="ts">
import type { RoleKey, UserRecord } from '@repo/types'

definePageMeta({
  middleware: 'auth'
})

const toast = useToast()
const { hasPermission } = usePermissions()

if (!hasPermission('user.read')) {
  await navigateTo('/unauthorized')
}

const canWriteUsers = hasPermission('user.write')
const roleOptions: Array<{ label: string, value: 'all' | RoleKey }> = [
  { label: '全部角色', value: 'all' },
  { label: '管理员', value: 'admin' },
  { label: '编辑', value: 'editor' },
  { label: '翻译', value: 'translator' }
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
  openCreateForm,
  openEditForm,
  closeForm,
  saveUser,
  toggleUserStatus,
  updateUserRole
} = useUserManagement()

function handleSaveUser() {
  try {
    saveUser()
    toast.add({
      title: editingUserId.value ? '用户已更新' : '用户已创建',
      description: '用户信息、角色和状态已同步到本地管理状态。',
      color: 'success'
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : '保存失败，请稍后重试。'
    toast.add({
      title: '保存失败',
      description: message,
      color: 'error'
    })
  }
}

function handleToggleUserStatus(user: UserRecord) {
  toggleUserStatus(user.id)
  toast.add({
    title: user.status === 'active' ? '用户已禁用' : '用户已启用',
    description: `${user.name} 的状态已更新。`,
    color: 'success'
  })
}

function handleRoleChange(user: UserRecord, role: RoleKey) {
  updateUserRole(user.id, role)
  toast.add({
    title: '角色已更新',
    description: `${user.name} 已切换为 ${role} 角色。`,
    color: 'success'
  })
}
</script>

<template>
  <UContainer class="py-10">
    <div class="space-y-6">
      <div class="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div class="space-y-2">
          <UBadge label="A3 用户管理模块" variant="subtle" color="primary" class="w-fit" />
          <div class="space-y-1">
            <h1 class="text-2xl font-semibold text-highlighted">
              用户管理
            </h1>
            <p class="max-w-2xl text-sm text-muted">
              当前阶段已打通用户列表、筛选、创建、编辑入口、角色切换和状态切换闭环，用于验证后台业务模块的基础组织方式。
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
              用于验证列表型后台页面的通用查询区结构。
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
              当前阶段先使用本地状态维护用户数据，后续再接入真实 API。
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
              <option value="admin">管理员</option>
              <option value="editor">编辑</option>
              <option value="translator">翻译</option>
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
                  <UBadge :label="user.role" color="neutral" variant="subtle" />
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
                  v-for="role in ['admin', 'editor', 'translator']"
                  :key="role"
                  :label="role"
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
  </UContainer>
</template>
