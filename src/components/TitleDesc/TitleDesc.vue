<template>
  <div class="mb-2">
    <h2
      class="mb-2"
      :class="{
        'text-sm': titleSize === 'sm',
        'text-base': titleSize === 'base',
        'text-lg': titleSize === 'lg',
        'text-xl': titleSize === 'xl',
        'text-2xl': titleSize === '2xl',
      }">
      <template v-if="showIcon">
        <Iconfont
          class="relative -top-0.5"
          :name="icon"
          :size="16" />
      </template>
      <span class="ml-1 font-bold">{{ title }}</span>
    </h2>
    <p
      v-if="description"
      class="pl-3"
      v-html="description" />
  </div>
</template>

<script setup lang="ts">
import Iconfont from '../Iconfont/Iconfont.vue'
import { TitleDescProps } from './types'

withDefaults(defineProps<TitleDescProps>(), {
  showIcon: true,
  titleSize: 'base',
})
</script>
