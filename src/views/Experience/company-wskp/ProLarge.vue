<template>
  <ProjectWrap
    class="pl-4"
    :title="t('proLarge.name')"
    :btn-label="t('stack')"
    :description="t('proLarge.description')">
    <template #lib>
      <Button
        plain
        type="info"
        size="small"
        >Vue3</Button
      >
      <Button
        plain
        type="info"
        size="small"
        >TypeScript</Button
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
   
      <Button
        plain
        type="info"
        size="small"
        >Vue-i18n</Button
      >
    </template>
    <ListWrap
      :title="t('contributions')"
      :list="adminList"
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

const adminList = computed(() => [
  t('proLarge.d1'),
  t('proLarge.d2'),
  t('proLarge.d3'),
])
const hardList = computed(() => [
  t('proLarge.h1'),
  t('proLarge.h2'),
  t('proLarge.h3'),
  t('proLarge.h4'),
])
</script>
