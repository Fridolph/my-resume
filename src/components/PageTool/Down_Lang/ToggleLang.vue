<template>
  <div class="dark-transition hover:text-sky-400">
    <Iconfont
      v-show="isZh"
      :size="22"
      name="zhongyingwen2zhongwen"
      @click="toggleLang" />

    <Iconfont
      v-show="!isZh"
      :size="22"
      name="a-zhongyingwenyingwen"
      @click="toggleLang" />
  </div>
</template>

<script setup lang="ts">
import Iconfont from '../../Iconfont/Iconfont.vue'
import useLocale from '../../../hooks/useLocale'
const { toggleLang, isZh } = useLocale()
</script>
