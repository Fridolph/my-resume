<template>
  <div
    class="invisible z-10 md:visible group absolute flex flex-row justify-between right-0 w-20 -top-10 h-8 leading-4 bg-white rounded p-2 cursor-pointer hover:ring-1 hover:ring-cyan-100">
    <DownloadTool />

    <div class="w-[1px] h-8 bg-slate-300 -translate-y-2"></div>

    <ToggleLang />
  </div>
</template>

<script setup lang="ts">
import DownloadTool from './DownloadTool.vue'
import ToggleLang from './ToggleLang.vue'
</script>
