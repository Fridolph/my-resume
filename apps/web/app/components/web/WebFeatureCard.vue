<script setup lang="ts">
interface Props {
  title: string
  description: string
  to: string
  badge?: string
  buttonLabel?: string
}

withDefaults(defineProps<Props>(), {
  badge: undefined,
  buttonLabel: '查看页面'
})
</script>

<template>
  <UCard>
    <template #header>
      <div class="space-y-2">
        <UBadge v-if="badge" :label="badge" color="primary" variant="subtle" class="w-fit" />
        <div class="space-y-1">
          <h2 class="text-base font-semibold text-highlighted">
            {{ title }}
          </h2>
          <p class="text-sm text-muted">
            {{ description }}
          </p>
        </div>
      </div>
    </template>

    <template #footer>
      <UButton :to="to" :label="buttonLabel" variant="subtle" color="neutral" />
    </template>
  </UCard>
</template>
