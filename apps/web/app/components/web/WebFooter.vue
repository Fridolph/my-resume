<script setup lang="ts">
const { t, currentLocaleLabel } = useWebLocale()
const { currentThemeLabel } = useWebTheme()
</script>

<template>
  <UFooter>
    <template #left>
      <div class="space-y-1">
        <p class="text-sm text-muted">
          {{ t('footer.milestone') }}
        </p>
        <p class="text-xs text-muted">
          {{ t('footer.description') }}
        </p>
        <p class="text-xs text-muted">
          {{ t('common.currentLocale') }}：{{ currentLocaleLabel }} · {{ t('common.currentTheme') }}：{{ currentThemeLabel }}
        </p>
        <p class="text-xs text-muted">
          SEO endpoints：`/robots.txt` · `/sitemap.xml`
        </p>
      </div>
    </template>
  </UFooter>
</template>
