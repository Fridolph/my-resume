<template>
  <RowContent
    align="right"
    :label="t('aili.name')"
    :label-bold="true"
    :label-width="220"
    :is-wrap="true"
    :is-title="true"
    :text="t('aili.time')" />

  <ListWrap
    :title="t('responsibilities')"
    :list="list"
    inner
    titleSize="base"
    bold />

  <ProMain />
</template>

<script setup lang="ts">
import { computed } from 'vue'
import RowContent from '../../../components/RowContent/RowContent.vue'
import ListWrap from '../../../components/ListWrap/ListWrap.vue'
import ProMain from './ProMain.vue'
import { useI18n } from 'vue-i18n'
const { t } = useI18n()

const list = computed(() => [
  t('aili.r1'),
  t('aili.r2'),
  t('aili.r3'),
  t('aili.r4'),
  t('aili.r5'),
])
</script>
