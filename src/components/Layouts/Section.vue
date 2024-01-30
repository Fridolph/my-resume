<template>
  <div class="w-full h-fit px-4 mb-5">
    <a v-if="anchor" :id="anchor" class="block border-b text-[16px] font-bold antialiased mb-4 align-middle">
      <Iconfont
        :name="icon"
        :size="30"         
      />
      <span class="align-middle font-bold ml-1 text-lg">{{title}}</span>
    </a>
    <div v-else :href="`#${anchor}`" class="block border-b text-[16px] font-bold antialiased mb-4 align-middle">
      <Iconfont
        :name="icon"
        :size="30"         
      />
      <span class="align-middle font-bold ml-1 text-lg">{{title}}</span>
    </div>
    <slot name="default"></slot>
  </div>
</template>

<script setup lang="ts">
import Iconfont from '../Iconfont/Iconfont.vue'
import { SectionProps } from './types'
defineProps<SectionProps>()
</script>
