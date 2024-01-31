<template>
  <ProjectWrap
    class="pl-4"
    :title="t('proAdmin.name')"
    :btn-label="t('stack')"
    :description="t('proAdmin.description')">
    <template #lib>
      <Button plain type="info" size="small">Vue3</Button>
      <Button plain type="info" size="small">TypeScript</Button>
      <Button plain type="info" size="small">ECharts</Button>
      <Button plain type="info" size="small">Naive UI</Button>
      <Button plain type="info" size="small">Vue-i18n</Button>
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
  t('proAdmin.c1'),
  t('proAdmin.c2'),
  t('proAdmin.c3'),
  t('proAdmin.c4'),
])

const hardList = computed(() => [
  t('proAdmin.h1'),
  t('proAdmin.h2'),
  t('proAdmin.h3'),
  t('proAdmin.h4'),
])
</script>
