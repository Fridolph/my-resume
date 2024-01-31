<template>
  <ProjectWrap
    class="pl-4"
    :title="t('proEdr.name')"
    :btn-label="t('stack')"
    :description="t('proEdr.description')">
    <template #lib>
      <Button
        plain
        type="info"
        size="small"
        >Vue2</Button
      >
      <Button
        plain
        type="info"
        size="small"
        >iView</Button
      >
      <Button
        plain
        type="info"
        size="small"
        >Vxe-Table</Button
      >
      <Button
        plain
        type="info"
        size="small"
        >Vue-i18n</Button
      >
      <Button
        plain
        type="info"
        size="small"
        >ECharts</Button
      >
      <Button
        plain
        type="info"
        size="small"
        >D3.js</Button
      >
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
import { Button } from 'fri-element-plus'
import { useI18n } from 'vue-i18n'
const { t } = useI18n()

const edrList = computed(() => [
  t('proEdr.c1'),
  t('proEdr.c2'),
  t('proEdr.c3'),
  t('proEdr.c4'),
  t('proEdr.c5'),
  t('proEdr.c6'),
])

const hardList = computed(() => [
  t('proEdr.h1'),
  t('proEdr.h2'),
  t('proEdr.h3'),
  t('proEdr.h4'),
  t('proEdr.h5'),
])
</script>
