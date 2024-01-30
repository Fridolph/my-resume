<template>
  <div class="group overflow-hidden relative ring-1 ring-slate-200 rounded p-2 transition-all hover:ring-sky-200 hover:ring-2">
    <div class="group flex flex-col">
      <a
        :href="link"
        target="_blank">
        <div class="text-base font-bold block text-slate-400">{{ name }}</div>
        <div class="text-slate-300 block text-sm">{{ link }}</div>
      </a>
      <div>{{ description }}</div>
    </div>

    <div v-if="transitionType === 'formBottom'" class="absolute w-full h-full p-2 z-10 left-0 right-0 top-0 bottom-0 translate-y-full rounded bg-sky-50 transition-transform ease-in-out duration-500 group-hover:translate-y-0">
      <slot></slot>
    </div>

    <div v-if="transitionType === 'fromTop'" class="absolute w-full h-full p-2 z-10 left-0 right-0 top-0 bottom-0 -translate-y-full rounded bg-sky-50 transition-transform ease-in-out duration-500 group-hover:translate-y-0">
      <slot></slot>
    </div>

    <div v-if="transitionType === 'formLeft'" class="absolute w-full h-full p-2 z-10 left-0 right-0 top-0 bottom-0 -translate-x-full rounded bg-sky-50 transition-transform ease-in-out duration-500 group-hover:translate-x-0">
      <slot></slot>
    </div>

    <div v-if="transitionType === 'fromRight'" class="absolute w-full h-full p-2 z-10 left-0 right-0 top-0 bottom-0 translate-x-full rounded bg-sky-50 transition-transform ease-in-out duration-500 group-hover:translate-x-0">
      <slot></slot>
    </div>

    <div v-if="transitionType === 'fadeIn'" class="absolute w-full h-full p-2 z-10 left-0 right-0 top-0 bottom-0 bg-sky-50 rounded transition-opacity ease-in-out duration-500 opacity-0 group-hover:opacity-100">
      <slot></slot>
    </div>
  </div>
</template>

<script setup lang="ts">
import { RepositoryItemProps } from './types'
withDefaults(defineProps<RepositoryItemProps>(), {
  transitionType: 'formBottom'
})
</script>
