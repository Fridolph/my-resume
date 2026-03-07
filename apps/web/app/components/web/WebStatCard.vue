<script setup lang="ts">
interface Props {
  label: string
  value: string
  hint?: string
}

defineProps<Props>()
</script>

<template>
  <UCard>
    <template #header>
      <p class="text-sm text-muted">
        {{ label }}
      </p>
    </template>

    <div class="space-y-1">
      <p class="text-2xl font-semibold text-highlighted">
        {{ value }}
      </p>
      <p v-if="hint" class="text-sm text-muted">
        {{ hint }}
      </p>
    </div>
  </UCard>
</template>
