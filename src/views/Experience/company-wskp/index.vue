<template>
  <RowContent
    align="right"
    :label="t('wskp.name')"
    :label-bold="true"
    :label-width="220"
    :is-wrap="true"
    :is-title="true"
    :text="t('wskp.time')" />

  <ListWrap
    :title="t('responsibilities')"
    :list="list"
    inner
    title-size="base"
    bold />

  <ProEdr />
  <ProAdmin />
  <ProLarge />
  <ProTeam />
</template>

<script setup lang="ts">
import { computed } from 'vue'
import RowContent from '../../../components/RowContent/RowContent.vue'
import ListWrap from '../../../components/ListWrap/ListWrap.vue'
import ProEdr from './ProEdr.vue'
import ProAdmin from './ProAdmin.vue'
import ProLarge from './ProLarge.vue'
import ProTeam from './ProTeam.vue'
import { useI18n } from 'vue-i18n'
const { t } = useI18n()

const list = computed(() => [
  t('wskp.d1'),
  t('wskp.d2'),
  t('wskp.d3'),
  t('wskp.d4'),
  t('wskp.d5'),
  t('wskp.d6'),
])
</script>