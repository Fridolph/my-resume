<template>
  <AnchorTool />
  <DownloadTool />
  <main
    class="scrollbar sm:w-full md:w-2/3 flex flex-col bg-white md:h-[90vh] overflow-hidden pr-[26px] hover:md:overflow-y-auto hover:md:pr-[20px] overscroll-contain">
    <slot></slot>
  </main>
</template>

<script setup lang="ts">
import AnchorTool from '../../components/AnchorTool/AnchorTool.vue'
import DownloadTool from '../../components/DownloadTool/DownloadTool.vue'
</script>
