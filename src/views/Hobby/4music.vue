<template>
  <div
    class="group overflow-hidden relative ring-1 ring-slate-200 rounded flex items-center justify-center size-12 mr-3 mb-3 transition-all  duration-300 ease-linear origin-center hover:bg-slate-500 hover:rounded-full hover:text-white">
    <Iconfont
      class="size-12 absolute left-0 top-1 rotate-0 text-center transition-all duration-[600ms] linear origin-center group-hover:rotate-[360deg]"
      :size="28"
      name="music" />
    
  </div>
</template>

<script setup lang="ts">
import Iconfont from '../../components/Iconfont/Iconfont.vue'
</script>
