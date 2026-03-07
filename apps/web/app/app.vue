<script setup lang="ts">
useHead({
  meta: [
    { name: 'viewport', content: 'width=device-width, initial-scale=1' }
  ],
  link: [
    { rel: 'icon', href: '/favicon.ico' }
  ]
})

const title = 'Fridolph Web'
const description = '个人内容展示站，承载主页、简历、项目与多语言内容。'

useSeoMeta({
  title,
  description,
  ogTitle: title,
  ogDescription: description,
  twitterCard: 'summary_large_image'
})
</script>

<template>
  <UApp>
    <div class="min-h-screen bg-default">
      <UHeader title="Fridolph Web">
        <template #left>
          <div class="flex items-center gap-3">
            <UBadge label="W4" color="primary" variant="subtle" />
            <WebNavigation />
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

      <WebFooter />
    </div>
  </UApp>
</template>
