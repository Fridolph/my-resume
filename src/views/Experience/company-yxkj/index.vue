<template>
  <RowContent
    align="right"
    :label="t('yxkj.name')"
    :label-bold="true"
    :label-width="220"
    :is-wrap="true"
    :is-title="true"
    :text="t('yxkj.time')"
  />

  <ListWrap
    :title="t('responsibilities')"
    :list="lists"
    inner
    title-size="base"
    bold
  />

  <ListWrap
    :title="t('yxkj.results')"
    :list="results"
    inner
    title-size="base"
    bold
  />

  <ProSaas />
  <ProXhyx />
</template>

<script setup lang="ts">
import { computed } from 'vue'
import RowContent from '../../../components/RowContent/RowContent.vue'
import ListWrap from '../../../components/ListWrap/ListWrap.vue'
import ProSaas from './ProSaas.vue'
import ProXhyx from './ProXhyx.vue'
import { useI18n } from 'vue-i18n'

const { t } = useI18n()

const lists = computed(() => [t('yxkj.d1'), t('yxkj.d2'), t('yxkj.d3'), t('yxkj.d4'), t('yxkj.d5')])
const results = computed(() => [
  t('yxkj.l1'),
  t('yxkj.l2'),
  t('yxkj.l3'),
  t('yxkj.l4'),
  t('yxkj.l5'),
])
</script>
