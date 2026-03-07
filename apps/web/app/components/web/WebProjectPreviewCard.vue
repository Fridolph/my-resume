<script setup lang="ts">
interface Props {
  title: string
  slug: string
  description: string
  tags?: string[]
}

withDefaults(defineProps<Props>(), {
  tags: () => []
})
</script>

<template>
  <UCard>
    <template #header>
      <div class="space-y-2">
        <div class="space-y-1">
          <h2 class="text-base font-semibold text-highlighted">
            {{ title }}
          </h2>
          <p class="text-sm text-muted">
            {{ description }}
          </p>
        </div>
        <WebTagList v-if="tags.length" :items="tags" />
      </div>
    </template>

    <template #footer>
      <UButton :to="`/projects/${slug}`" label="查看详情" variant="subtle" color="neutral" />
    </template>
  </UCard>
</template>
