<script setup lang="ts">
interface Props {
  title: string
  description: string
  highlights?: string[]
}

withDefaults(defineProps<Props>(), {
  highlights: () => []
})
</script>

<template>
  <UCard>
    <template #header>
      <div class="space-y-1">
        <h2 class="text-base font-semibold text-highlighted">
          {{ title }}
        </h2>
        <p class="text-sm text-muted">
          {{ description }}
        </p>
      </div>
    </template>

    <WebTagList v-if="highlights.length" :items="highlights" />
  </UCard>
</template>
