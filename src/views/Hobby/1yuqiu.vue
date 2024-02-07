<template>
  <div
    class="group transition-color duration-300 origin-center dark:hover:text-white">
    <Iconfont
      class="size-12 absolute left-0 top-0 rotate-[260deg] -translate-x-1 -translate-y-6 transition-all delay-200 duration-500 group-hover:-left-[100px] group-hover:rotate-180"
      :size="16"
      name="yumaoqiu" />
    <Iconfont
      class="size-12 absolute left-0 top-0 transition-all duration-500 rotate-[10deg] translate-x-4 group-hover:left-0 group-hover:rotate-[360deg] group-hover:scale-[1.35]"
      :size="30"
      name="yumaoqiupai" />
  </div>
</template>

<script setup lang="ts">
import Iconfont from '../../components/Iconfont/Iconfont.vue'

</script>
