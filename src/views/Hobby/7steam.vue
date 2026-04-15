<template>
  <div class="group">
    <Iconfont
      class="absolute left-0 top-0.5 size-12 origin-center text-center duration-[500ms] ease-in group-hover:invisible group-hover:scale-[2] group-hover:opacity-0"
      :size="30"
      name="steam" />
    <Iconfont
      class="absolute left-0 top-[-2px] size-12 scale-0 text-center transition-all delay-[200ms] ease-in group-hover:scale-100"
      :size="34"
      name="youxi" />
  </div>
</template>

<script setup lang="ts">
import Iconfont from '../../components/Iconfont/Iconfont.vue'
</script>
