<script setup lang="ts">
const { preference, localizedThemeOptions, setThemePreference } = useWebTheme()
const { t } = useWebLocale()
</script>

<template>
  <div class="flex items-center gap-2">
    <span class="hidden text-xs text-muted lg:block">
      {{ t('theme.label') }}
    </span>

    <div class="flex items-center gap-1 rounded-lg border border-default p-1">
      <UButton
        v-for="item in localizedThemeOptions"
        :key="item.value"
        :label="item.label"
        :variant="preference === item.value ? 'solid' : 'ghost'"
        color="neutral"
        size="sm"
        @click="setThemePreference(item.value)"
      />
    </div>
  </div>
</template>
