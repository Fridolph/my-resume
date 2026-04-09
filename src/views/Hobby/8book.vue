<template>
  <div class="transition-color align-center group origin-center duration-300">
    <Iconfont
      class="absolute left-0 top-0 size-12 origin-center translate-y-0.5 text-center transition-all duration-500 group-hover:-translate-x-full"
      :size="30"
      name="xiaoshuo" />
    <Iconfont
      class="absolute left-0 top-0 size-12 translate-x-full translate-y-0.5 text-center transition-transform duration-500 group-hover:translate-x-0"
      :size="32"
      name="ziliaoku" />
  </div>
</template>

<script setup lang="ts">
import Iconfont from '../../components/Iconfont/Iconfont.vue'
</script>
