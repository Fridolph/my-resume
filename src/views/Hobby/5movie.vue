<template>
  <div
    class="group overflow-hidden relative ring-1 ring-slate-200 rounded flex items-center justify-center size-12 mr-3 mb-3 origin-center align-center">
    <Iconfont
      class="size-12 absolute left-0 top-0 translate-x-[10px] translate-y-1 transition-transform ease-linear duration-[400ms]  group-hover:-translate-y-12"
      :size="28"
      name="swticondianying" />
    <Iconfont
      class="size-12 absolute left-0 top-0 translate-x-2 translate-y-12 transition-transform ease-linear duration-[400ms]  group-hover:translate-y-0"
      :size="30"
      name="movie2" />
  </div>
</template>

<script setup lang="ts">
import Iconfont from '../../components/Iconfont/Iconfont.vue'
</script>
