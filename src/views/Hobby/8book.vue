<template>
  <div
    class="group overflow-hidden relative ring-1 ring-slate-200 rounded flex items-center justify-center size-12 mr-3 mb-3 transition-color duration-300 origin-center align-center">
    <Iconfont
      class="size-12 translate-y-0.5 text-center absolute left-0 top-0 transition-all duration-500 origin-center group-hover:-translate-x-full"
      :size="30"
      name="xiaoshuo" />
    <Iconfont
      class="size-12 translate-y-0.5 text-center absolute left-0 top-0 duration-500 translate-x-full transition-transform group-hover:translate-x-0"
      :size="32"
      name="ziliaoku" />
  </div>
</template>

<script setup lang="ts">
import Iconfont from '../../components/Iconfont/Iconfont.vue'
</script>
