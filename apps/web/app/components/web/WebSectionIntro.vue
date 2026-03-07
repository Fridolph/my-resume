<script setup lang="ts">
interface Props {
  badge?: string
  title: string
  description: string
}

defineProps<Props>()
</script>

<template>
  <div class="space-y-4">
    <UBadge v-if="badge" :label="badge" variant="subtle" color="primary" class="w-fit" />
    <div class="space-y-2">
      <h1 class="text-4xl font-bold tracking-tight text-highlighted sm:text-5xl">
        {{ title }}
      </h1>
      <p class="max-w-3xl text-lg text-muted">
        {{ description }}
      </p>
    </div>
  </div>
</template>
