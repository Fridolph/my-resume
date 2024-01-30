<template>
  <div
    class="group">
    <Iconfont
      class="size-12 absolute left-0 top-0.5 text-center origin-center duration-[500ms] ease-in group-hover:scale-[2] group-hover:opacity-0 group-hover:invisible"
      :size="30"
      name="steam" />
    <Iconfont
      class="size-12 absolute left-0 top-[-2px] text-center transition-all delay-[200ms] scale-0 ease-in  group-hover:scale-100"
      :size="34"
      name="youxi" />
  </div>
</template>

<script setup lang="ts">
import Iconfont from '../../components/Iconfont/Iconfont.vue'
</script>
