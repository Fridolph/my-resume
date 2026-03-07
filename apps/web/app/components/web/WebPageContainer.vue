<script setup lang="ts">
interface Props {
  size?: 'default' | 'narrow'
}

withDefaults(defineProps<Props>(), {
  size: 'default'
})
</script>

<template>
  <UContainer :class="size === 'narrow' ? 'max-w-4xl py-16 sm:py-24' : 'py-16 sm:py-24'">
    <div class="space-y-10">
      <slot />
    </div>
  </UContainer>
</template>
