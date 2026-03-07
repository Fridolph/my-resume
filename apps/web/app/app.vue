<script setup lang="ts">
const { locale, t } = useWebLocale()
await useSiteSettingsQuery()
const { siteName, siteDescription, defaultOgImage } = useSiteSeoConfig()

useHead(() => ({
  htmlAttrs: {
    lang: locale.value
  },
  meta: [
    { name: 'viewport', content: 'width=device-width, initial-scale=1' }
  ],
  link: [
    { rel: 'icon', href: '/favicon.ico' }
  ]
}))

useSeoMeta({
  title: siteName,
  description: siteDescription,
  ogTitle: siteName,
  ogDescription: siteDescription,
  ogImage: defaultOgImage,
  twitterImage: defaultOgImage,
  twitterCard: 'summary_large_image'
})
</script>

<template>
  <UApp>
    <div class="min-h-screen bg-default">
      <UHeader :title="t('app.name')">
        <template #left>
          <div class="flex items-center gap-3">
            <UBadge label="W6" color="primary" variant="subtle" />
            <WebNavigation />
          </div>
        </template>

        <template #right>
          <div class="flex items-center gap-3">
            <WebLocaleSwitch />
            <WebThemeSwitch />
          </div>
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
