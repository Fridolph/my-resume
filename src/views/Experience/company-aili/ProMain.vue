<template>
  <ProjectWrap
    class="pl-4"
    :title="t('aili.pj')"
    :btn-label="t('stack')"
    :description="t('aili.pjDesc')">
    <template #lib>
      <Button
        plain
        type="info"
        size="small"
        >jQuery</Button
      >
      <Button
        plain
        type="info"
        size="small"
        >jQuery Plugins</Button
      >
      <Button
        plain
        type="info"
        size="small"
        >BootStrap</Button
      >
      <Button
        plain
        type="info"
        size="small"
        >ECharts</Button
      >
    </template>

    <p class="pl-3">{{ t('aili.para') }}</p>
    <div class="pl-3 my-3">
      <Button
        plain
        type="warning"
        size="small"
        >{{ t('refactor') }}</Button
      >
      <Button
        plain
        type="info"
        size="small"
        >Webpack</Button
      >
      <Button
        plain
        type="info"
        size="small"
        >React</Button
      >
      <Button
        plain
        type="info"
        size="small"
        >react-router</Button
      >
      <Button
        plain
        type="info"
        size="small"
        >Redux</Button
      >
    </div>
    <ListWrap
      :title="t('contributions')"
      :list="mainList"
      inner
      bold />

    <ListWrap
      :title="t('hard')"
      :list="hardList"
      inner
      bold />

    <ListWrap
      :title="t('team.grow')"
      :list="growList"
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

const mainList = computed(() => [t('aili.c1'), t('aili.c2'), t('aili.c3')])
const hardList = computed(() => [t('aili.h1'), t('aili.h2'), t('aili.h3')])
const growList = computed(() => [
  t('aili.g1'),
  t('aili.g2'),
  t('aili.g3'),
  t('aili.g4'),
  t('aili.g5'),
])
</script>

<style scoped>
:deep(button) {
  margin-bottom: 10px;
}
</style>
