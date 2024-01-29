<template>
  <dl
    class="mb-3"
    :class="{ 'pl-3': inner }">
    <dt
      class="mb-2"
      :class="{
        'font-bold': bold,
        'text-sm': titleSize === 'sm',
        'text-base': titleSize === 'base',
        'text-lg': titleSize === 'lg',
        'text-xl': titleSize === 'xl',
        'text-2xl': titleSize === '2xl',
      }">
      {{ title }}
    </dt>
    <dd
      class="pl-3"
      v-for="(item, idx) in list"
      :key="idx">
      {{ item }}
    </dd>
  </dl>
</template>

<script setup lang="ts">
import { ListWrapProps } from './types'
withDefaults(defineProps<ListWrapProps>(), {
  bold: false,
  inner: false,
  titleSize: 'base',
})
</script>

<style scoped></style>
