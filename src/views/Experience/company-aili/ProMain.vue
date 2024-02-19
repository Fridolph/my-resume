<template>
  <ProjectWrap
    class="pl-4"
    :title="t('aili.pj')"
    :btn-label="t('stack')"
    :description="t('aili.pjDesc')">
    <template #lib>
      <button class="my-btn info">jQuery</button>
      <button class="my-btn info">jQuery Plugins</button>
      <button class="my-btn info">BootStrap</button>
      <button class="my-btn info">ECharts</button>
    </template>

    <p class="pl-3">{{ t('aili.para') }}</p>
    <div class="pl-3 my-3">
      <button class="my-btn warning">{{ t('refactor') }}</button>
      <button class="my-btn info">Webpack</button>
      <button class="my-btn info">React</button>
      <button class="my-btn info">react-router</button>
      <button class="my-btn info">Redux</button>
    </div>
    <ListWrap
      type="ul"
      :title="t('contributions')"
      :list="mainList"
      inner
      bold />

    <ListWrap
      type="ul"
      :title="t('hard')"
      :list="hardList"
      inner
      bold />

    <ListWrap
      type="ul"
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
