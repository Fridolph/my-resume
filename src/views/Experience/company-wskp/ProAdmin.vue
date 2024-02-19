<template>
  <ProjectWrap
    class="pl-4"
    :title="t('proAdmin.name')"
    :btn-label="t('stack')"
    :description="t('proAdmin.description')">
    <template #lib>
      <button class="my-btn info">Vue3</button>
      <button class="my-btn info">TypeScript</button>
      <button class="my-btn info">ECharts</button>
      <button class="my-btn info">Naive UI</button>
      <button class="my-btn info">Vue-i18n</button>
    </template>
    <ListWrap
      :title="t('contributions')"
      :list="adminList"
      inner
      bold />

    <!-- <ListWrap
      :title="t('hard')"
      :list="hardList"
      inner
      bold /> -->
  </ProjectWrap>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import ProjectWrap from '../../../components/ProjectWrap/ProjectWrap.vue'
import ListWrap from '../../../components/ListWrap/ListWrap.vue'
import { useI18n } from 'vue-i18n'
const { t } = useI18n()

const adminList = computed(() => [
  t('proAdmin.c1'),
  t('proAdmin.c2'),
  t('proAdmin.c3'),
  t('proAdmin.c4'),
  t('proAdmin.c5'),
  t('proAdmin.c6'),
])

// 难点 没有体现出来，老师建议去掉，也是，简历里避免这样的凑字数
// const hardList = computed(() => [
//   t('proAdmin.h1'),
//   t('proAdmin.h2'),
//   t('proAdmin.h3'),
//   t('proAdmin.h4'),
// ])
</script>
