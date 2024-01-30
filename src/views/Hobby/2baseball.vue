<template>
  <div
    class="group transition-color duration-300 origin-center align-center">
    <Iconfont
      class="size-12 translate-y-1 text-center absolute left-0 top-0 transition-all duration-500 origin-center group-hover:-left-full group-hover:-rotate-[360deg]"
      :size="24"
      name="Baseball" />
    <Iconfont
      class="size-12 -translate-y-1 text-center absolute left-full top-0 duration-500 transition-all group-hover:left-0"
      :size="40"
      name="bangqiu" />
  </div>
</template>

<script setup lang="ts">
import Iconfont from '../../components/Iconfont/Iconfont.vue'
</script>
