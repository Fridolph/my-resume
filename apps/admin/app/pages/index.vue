<script setup lang="ts">
definePageMeta({
  middleware: 'auth'
})

const { session, logout } = useAuth()

function handleLogout() {
  void logout()
}
const quickLinks = [
  {
    title: '用户管理',
    description: '验证登录态、权限判断与用户管理模块。',
    to: '/users'
  },
  {
    title: '文案管理',
    description: '验证 namespace、locale、发布状态和缺失文案的管理入口。',
    to: '/translations'
  },
  {
    title: '站点设置',
    description: '验证仅管理员可访问的页面权限。',
    to: '/settings'
  }
]
</script>

<template>
  <UContainer class="py-16 sm:py-24">
    <div class="flex flex-col gap-6">
      <div class="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div class="space-y-3">
          <UBadge label="A4 已接入文案管理模块" variant="subtle" color="primary" class="w-fit" />
          <div class="space-y-2">
            <h1 class="text-4xl font-bold tracking-tight text-highlighted sm:text-5xl">
              欢迎回来，{{ session?.name }}
            </h1>
            <p class="max-w-2xl text-lg text-muted">
              当前账号角色为 {{ session?.role }}。现在后台已经具备登录、登出、路由守卫、基础权限判断、用户管理和文案管理模块入口。
            </p>
          </div>
        </div>

        <div class="flex items-center gap-3">
          <UBadge :label="session?.email || '未登录'" color="neutral" variant="subtle" />
          <UButton label="退出登录" color="neutral" variant="subtle" @click="handleLogout" />
        </div>
      </div>

      <div class="grid gap-4 md:grid-cols-3">
        <UCard v-for="link in quickLinks" :key="link.to">
          <template #header>
            <div class="space-y-1">
              <h2 class="text-base font-semibold text-highlighted">
                {{ link.title }}
              </h2>
              <p class="text-sm text-muted">
                {{ link.description }}
              </p>
            </div>
          </template>

          <template #footer>
            <UButton :to="link.to" label="进入页面" variant="subtle" color="neutral" />
          </template>
        </UCard>
      </div>
    </div>
  </UContainer>
</template>
