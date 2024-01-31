<template>
  <div
    class="group overflow-hidden relative ring-1 ring-slate-200 rounded p-2 transition-all hover:ring-sky-200 hover:ring-2">
    <div class="group flex flex-col">
      <a
        :href="link"
        target="_blank">
        <div class="text-base font-bold block text-slate-400">{{ name }}</div>
        <div class="text-slate-300 block text-sm">{{ link }}</div>
      </a>
      <div>{{ description }}</div>
    </div>

    <div
      class="absolute w-full h-full p-2 z-10 left-0 right-0 top-0 bottom-0 rounded bg-sky-50"
      :class="{
        'hobby-fromBottom': transitionType === 'fromBottom',
        'hobby-fromTop': transitionType === 'fromTop',
        'hobby-fromLeft': transitionType === 'fromLeft',
        'hobby-fromRight': transitionType === 'fromRight',
        'hobby-fadeIn': transitionType === 'fadeIn',
      }">
      <slot></slot>
    </div>
  </div>
</template>

<script setup lang="ts">
import { RepositoryItemProps } from './types'
withDefaults(defineProps<RepositoryItemProps>(), {
  transitionType: 'fromBottom',
})
</script>
