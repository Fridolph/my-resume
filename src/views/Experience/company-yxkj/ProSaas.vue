<template>
  <ProjectWrap
    class="pl-4"
    :title="t('proSaas.name')"
    :btn-label="t('stack')"
    :description="t('proSaas.description')"
  >
    <template #lib>
      <button class="my-btn info">Vue3</button>
      <button class="my-btn info">TypeScript</button>
      <button class="my-btn info">antdVue</button>
      <button class="my-btn info">Echarts</button>
    </template>
    <ListWrap
      :title="t('contributions')"
      :list="saasList"
      inner
      bold
    />

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

const saasList = computed(() => [
  t('proSaas.d1'),
  t('proSaas.d2'),
  t('proSaas.d3'),
  t('proSaas.d4'),
])
</script>
