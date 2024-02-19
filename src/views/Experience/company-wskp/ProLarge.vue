<template>
  <ProjectWrap
    class="pl-4"
    :title="t('proLarge.name')"
    :btn-label="t('stack')"
    :description="t('proLarge.description')">
    <template #lib>
      <button class="my-btn info">Vue3</button>
      <button class="my-btn info">TypeScript</button>
      <button class="my-btn info">ECharts</button>
      <button class="my-btn info">D3.js</button>
      <button class="my-btn info">Vue-i18n</button>
    </template>
    <ListWrap
      type="ul"
      :title="t('contributions')"
      :list="adminList"
      title-size="base"
      inner
      bold />

    <ListWrap
      type="ul"
      :title="t('hard')"
      :list="hardList"
      title-size="base"
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

const adminList = computed(() => [t('proLarge.d1'), t('proLarge.d2'), t('proLarge.d3')])
const hardList = computed(() => [
  t('proLarge.h1'),
  t('proLarge.h2'),
  t('proLarge.h3'),
  t('proLarge.h4'),
])
</script>
