<script setup lang="ts">
const route = useRoute()
const { isAuthenticated } = useAuth()

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
</script>

<template>
  <UApp>
    <div class="min-h-screen bg-muted/30">
      <UHeader title="Fridolph Admin">
        <template #left>
          <div class="flex items-center gap-3">
            <UBadge label="A5" color="primary" variant="subtle" />
            <UNavigationMenu
              v-if="isAuthenticated && !isLoginPage"
              :items="[
                { label: '首页', to: '/' },
                { label: '用户', to: '/users' },
                { label: '文案', to: '/translations' },
                { label: '简历', to: '/resume' },
                { label: '设置', to: '/settings' }
              ]"
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
            Admin milestone A5 · Resume Management Module
          </p>
        </template>
      </UFooter>
    </div>
  </UApp>
</template>
