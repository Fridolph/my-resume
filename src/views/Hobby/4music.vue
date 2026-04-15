<template>
  <div
    class="group origin-center transition-all duration-300 ease-linear hover:rounded-full hover:bg-slate-500 hover:text-white">
    <Iconfont
      class="linear absolute left-0 top-1 size-12 origin-center rotate-0 text-center transition-all duration-[600ms] group-hover:rotate-[360deg]"
      :size="28"
      name="music" />
  </div>
</template>

<script setup lang="ts">
import Iconfont from '../../components/Iconfont/Iconfont.vue'
</script>
