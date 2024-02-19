<template>
  <ProjectWrap
    class="pl-4"
    :title="t('proEdr.name')"
    :btn-label="t('stack')"
    :description="t('proEdr.description')">
    <template #lib>
      <button class="my-btn info">Vue2</button>
      <button class="my-btn info">iView</button>
      <button class="my-btn info">Vxe-Table</button>
      <button class="my-btn info">Vue-i18n</button>
      <button class="my-btn info">ECharts</button>
      <button class="my-btn info">D3.js</button>
    </template>
    <ListWrap
      :title="t('contributions')"
      :list="edrList"
      inner
      bold />

    <ListWrap
      :title="t('hard')"
      :list="hardList"
      inner
      bold />
  </ProjectWrap>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import ProjectWrap from '../../../components/ProjectWrap/ProjectWrap.vue'
import ListWrap from '../../../components/ListWrap/ListWrap.vue'
import { useI18n } from 'vue-i18n'
const { t } = useI18n()

const edrList = computed(() => [
  t('proEdr.c1'),
  t('proEdr.c2'),
  t('proEdr.c3'),
  t('proEdr.c4'),
  t('proEdr.c5'),
  t('proEdr.c6'),
  t('proEdr.c7'),
])

const hardList = computed(() => [
  t('proEdr.h1'),
  t('proEdr.h2'),
  t('proEdr.h3'),
])
</script>
