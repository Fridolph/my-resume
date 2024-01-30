<template>
  <span
    v-bind="$attrs"
    :class="`iconfont icon-${name} align-middle`"
    :style="`font-size: ${size}px; color: ${color}`"></span>
</template>

<script setup lang="ts">
import { IconfontProps } from './types'

withDefaults(defineProps<IconfontProps>(), {
  size: 14,
  color: 'currentColor'
})
</script>

<style scoped>
.iconfont {
  font-family: 'iconfont' !important;
  font-style: normal;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}
</style>
