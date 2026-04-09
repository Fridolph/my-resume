<template>
  <div class="transition-color align-center group origin-center duration-300">
    <Iconfont
      class="absolute left-0 top-0 size-12 origin-center translate-y-1 text-center transition-all duration-500 group-hover:-left-full group-hover:-rotate-[360deg]"
      :size="24"
      name="Baseball" />
    <Iconfont
      class="absolute left-full top-0 size-12 -translate-y-1 text-center transition-all duration-500 group-hover:left-0"
      :size="40"
      name="bangqiu" />
  </div>
</template>

<script setup lang="ts">
import Iconfont from '../../components/Iconfont/Iconfont.vue'
</script>
