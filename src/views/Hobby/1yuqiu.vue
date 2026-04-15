<template>
  <div class="transition-color group origin-center duration-300 dark:hover:text-white">
    <Iconfont
      class="absolute left-0 top-0 size-12 -translate-x-1 -translate-y-6 rotate-[260deg] transition-all delay-200 duration-500 group-hover:-left-[100px] group-hover:rotate-180"
      :size="16"
      name="yumaoqiu" />
    <Iconfont
      class="absolute left-0 top-0 size-12 translate-x-4 rotate-[10deg] transition-all duration-500 group-hover:left-0 group-hover:rotate-[360deg] group-hover:scale-[1.35]"
      :size="30"
      name="yumaoqiupai" />
  </div>
</template>

<script setup lang="ts">
import Iconfont from '../../components/Iconfont/Iconfont.vue'
</script>
