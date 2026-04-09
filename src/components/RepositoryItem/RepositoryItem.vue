<template>
  <div
    class="group relative overflow-hidden rounded p-2 ring-1 ring-[var(--border)] transition-all hover:ring-2 hover:ring-[var(--focus-border)] dark:ring-[var(--dark-border)] dark:hover:ring-[var(--dark-focus-border)]">
    <div class="group flex flex-col">
      <a :href="link" target="_blank">
        <div class="block text-base font-bold text-slate-400">{{ name }}</div>
        <div class="block text-sm text-slate-300">{{ link }}</div>
      </a>
      <div>{{ description }}</div>
    </div>

    <div
      class="absolute bottom-0 left-0 right-0 top-0 z-10 h-full w-full rounded bg-[var(--card-bg)] p-2 dark:bg-[var(--dark-card-bg)]"
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
