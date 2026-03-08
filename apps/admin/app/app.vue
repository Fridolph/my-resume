<script setup lang="ts">
const route = useRoute()
const { isAuthenticated } = useAuth()
const { visibleRouteItems } = useAdminAccess()

useHead({
  meta: [
    { name: 'viewport', content: 'width=device-width, initial-scale=1' }
  ],
  link: [
    { rel: 'icon', href: '/favicon.ico' }
  ]
})

const title = 'Fridolph Admin'
const description = '内容管理后台，负责用户、文案、简历与项目管理。'

useSeoMeta({
  title,
  description,
  ogTitle: title,
  ogDescription: description,
  robots: 'noindex, nofollow'
})

const isLoginPage = computed(() => route.path === '/login')
const navigationItems = computed(() => {
  return visibleRouteItems.value.map(item => ({
    label: item.title,
    to: item.to
  }))
})
</script>

<template>
  <UApp>
    <div class="min-h-screen bg-muted/30">
      <UHeader title="Fridolph Admin">
        <template #left>
          <div class="flex items-center gap-3">
            <UBadge label="P5-5" color="primary" variant="subtle" />
            <UNavigationMenu
              v-if="isAuthenticated && !isLoginPage"
              :items="navigationItems"
            />
          </div>
        </template>

        <template #right>
          <UColorModeButton />
        </template>
      </UHeader>

      <UMain>
        <NuxtPage />
      </UMain>

      <USeparator />

      <UFooter>
        <template #left>
          <p class="text-sm text-muted">
            Admin milestone P5-5 · Page-level Permission Control
          </p>
        </template>
      </UFooter>
    </div>
  </UApp>
</template>
