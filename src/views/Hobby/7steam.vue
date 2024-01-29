<template>
  <div
    class="group overflow-hidden relative ring-1 ring-slate-200 rounded flex items-center justify-center size-12 mr-3 mb-3 ">
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
