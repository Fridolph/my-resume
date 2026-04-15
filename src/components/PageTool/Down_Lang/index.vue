<template>
  <div
    class="z-100 dark-transition group absolute right-3 top-3 z-10 flex h-8 w-20 cursor-pointer flex-row justify-between rounded bg-white p-2 leading-4 dark:bg-[var(--dark-bg-hover)] md:-top-10 md:right-0">
    <DownloadTool />

    <div class="h-8 w-[1px] -translate-y-2 bg-slate-300 dark:bg-slate-800"></div>

    <ToggleLang />
  </div>
</template>

<script setup lang="ts">
import DownloadTool from './DownloadTool.vue'
import ToggleLang from './ToggleLang.vue'
</script>
