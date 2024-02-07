<template>
  <div
    class="group absolute top-3 right-[calc(100%-50px)] md:right-[88px] md:-top-10 z-10 flex flex-row justify-between size-8 leading-4 bg-white dark:bg-[var(--dark-bg-hover)] rounded p-2 cursor-pointer hover:text-cyan-400 z-100 dark-transition"
    @click="handleSwitch">
    <Iconfont
      v-show="isDark"
      size="20"
      class="-translate-x-[2px]"
      name="night-mode-fill" />
    <Iconfont
      v-show="!isDark"
      size="20"
      class="-translate-x-[2px]"
      name="light-bulb" />
  </div>
</template>

<script setup lang="ts">
import { toRefs } from 'vue'
import { useCommonStore } from '../../../store/common'
import Iconfont from '../../Iconfont/Iconfont.vue'
const store = useCommonStore()
const { isDark } = toRefs(store)
const handleSwitch = () => {
  store.switchTheme()
}
</script>
