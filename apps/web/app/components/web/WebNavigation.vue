<script setup lang="ts">
const { t, locale } = useWebLocale()

const items = computed(() => [
  { label: t('nav.home'), to: '/' },
  { label: t('nav.resume'), to: '/resume' },
  { label: t('nav.projects'), to: '/projects' }
])
</script>

<template>
  <UNavigationMenu :key="locale" :items="items" />
</template>
