<script setup lang="ts">
definePageMeta({
  middleware: 'auth'
})

const { session, logout } = useAuth()
const { visibleRouteItems } = useAdminAccess()

function handleLogout() {
  void logout()
}

const quickLinks = computed(() => {
  return visibleRouteItems.value.filter(item => item.to !== '/')
})
</script>

<template>
  <UContainer class="py-16 sm:py-24">
    <div class="flex flex-col gap-6">
      <div class="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div class="space-y-3">
          <UBadge label="P5-5 页面权限判断已接入真实会话" variant="subtle" color="primary" class="w-fit" />
          <div class="space-y-2">
            <h1 class="text-4xl font-bold tracking-tight text-highlighted sm:text-5xl">
              欢迎回来，{{ session?.name }}
            </h1>
            <p class="max-w-2xl text-lg text-muted">
              当前账号角色为 {{ session?.role }}。现在后台首页、导航和页面入口会根据真实权限集合动态显示，只展示当前账号真正可访问的模块。
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
