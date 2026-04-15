<template>
  <div class="mb-5 h-fit w-full px-4">
    <a v-if="anchor" :id="anchor" class="my-section-title hover:text-[var(--text)]">
      <Iconfont :name="icon" :size="30" />
      <span class="ml-1 align-middle text-lg font-bold">{{ title }}</span>
    </a>
    <div v-else :href="`#${anchor}`" class="my-section-title">
      <Iconfont :name="icon" :size="30" />
      <span class="ml-1 align-middle text-lg font-bold">{{ title }}</span>
    </div>
    <slot name="default"></slot>
  </div>
</template>

<script setup lang="ts">
import Iconfont from '../Iconfont/Iconfont.vue'
import { SectionProps } from './types'
defineProps<SectionProps>()
</script>
