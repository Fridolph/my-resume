<template>
  <div
    class="group overflow-hidden relative ring-1 ring-slate-200 rounded flex items-center justify-center size-12 mr-3 mb-3 transition-all  duration-600 ease-linear origin-center hover:bg-slate-500 hover:rounded-2xl hover:text-white">
    <Iconfont
      class="size-12 absolute left-0 top-1 text-center origin-center duration-300 group-hover:opacity-0"
      :size="26"
      name="camera" />
    <Iconfont
      class="size-12 absolute left-0 top-[-2px] opacity-0 text-center transition-opacity invisible ease-linear delay-100 group-hover:visible group-hover:opacity-100"
      :size="34"
      name="camera1196054easyiconnet" />
  </div>
</template>

<script setup lang="ts">
import Iconfont from '../../components/Iconfont/Iconfont.vue'
</script>
