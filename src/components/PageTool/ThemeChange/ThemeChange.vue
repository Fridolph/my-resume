<template>
  <div
    class="z-100 dark-transition group absolute right-[calc(100%-50px)] top-3 z-10 flex size-8 cursor-pointer flex-row justify-between rounded bg-white p-2 leading-4 hover:text-cyan-400 dark:bg-[var(--dark-bg-hover)] md:-top-10 md:right-[88px]"
    @click="handleSwitch">
    <Iconfont
      v-show="isDark"
      size="20"
      class="-translate-x-[2px]"
      name="night-mode-fill" />
    <Iconfont v-show="!isDark" size="20" class="-translate-x-[2px]" name="light-bulb" />
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
