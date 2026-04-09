<template>
  <div
    class="duration-600 group origin-center transition-all ease-linear hover:rounded-2xl hover:bg-slate-500 hover:text-white">
    <Iconfont
      class="absolute left-0 top-1 size-12 origin-center text-center duration-300 group-hover:opacity-0"
      :size="26"
      name="camera" />
    <Iconfont
      class="invisible absolute left-0 top-[-2px] size-12 text-center opacity-0 transition-opacity delay-100 ease-linear group-hover:visible group-hover:opacity-100"
      :size="34"
      name="camera1196054easyiconnet" />
  </div>
</template>

<script setup lang="ts">
import Iconfont from '../../components/Iconfont/Iconfont.vue'
</script>
