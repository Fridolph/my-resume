<template>
  <div class="hover:text-sky-400">
    <Tooltip
      v-show="isZh"
      content="切换英文"
      :width="85">
      <Iconfont
        :size="22"
        name="zhongyingwen2zhongwen"
        @click="toggleLang" />
    </Tooltip>

    <Tooltip
      v-show="!isZh"
      content="To Chinese"
      :width="100">
      <Iconfont
        :size="22"
        name="a-zhongyingwenyingwen"
        @click="toggleLang" />
    </Tooltip>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import Iconfont from '../../Iconfont/Iconfont.vue'
import { Tooltip } from 'fri-element-plus'
import { useI18n } from 'vue-i18n'

const { locale } = useI18n();
const isZh = computed(() => locale.value === 'zh')

function toggleLang() {
  if (isZh.value) {
    locale.value = 'en'
  } else {
    locale.value = 'zh'
  }
}
</script>
