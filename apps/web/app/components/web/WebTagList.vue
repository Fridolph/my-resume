<script setup lang="ts">
interface Props {
  items: string[]
}

defineProps<Props>()
</script>

<template>
  <div class="flex flex-wrap gap-2">
    <UBadge v-for="item in items" :key="item" :label="item" color="neutral" variant="subtle" />
  </div>
</template>
