<script setup lang="ts">
const { locale, localeOptions, setLocale, t } = useWebLocale()
</script>

<template>
  <div class="flex items-center gap-2">
    <span class="hidden text-xs text-muted sm:block">
      {{ t('locale.label') }}
    </span>

    <div class="flex items-center gap-1 rounded-lg border border-default p-1">
      <UButton
        v-for="item in localeOptions"
        :key="item.value"
        :label="item.label"
        :variant="locale === item.value ? 'solid' : 'ghost'"
        color="neutral"
        size="sm"
        @click="setLocale(item.value)"
      />
    </div>
  </div>
</template>
