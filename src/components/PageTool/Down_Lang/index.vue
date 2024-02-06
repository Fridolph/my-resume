<template>
  <div
    class="group absolute top-3 right-3 md:right-0 md:-top-10 z-10 flex flex-row justify-between w-20 h-8 leading-4 bg-white rounded p-2 cursor-pointer hover:ring-1 hover:ring-cyan-100 z-100">
    <DownloadTool />

    <div class="w-[1px] h-8 bg-slate-300 -translate-y-2"></div>

    <ToggleLang />
  </div>
</template>

<script setup lang="ts">
import DownloadTool from './DownloadTool.vue'
import ToggleLang from './ToggleLang.vue'
</script>
