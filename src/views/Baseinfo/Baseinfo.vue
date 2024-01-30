<template>
  <Section
    :title="t('baseinfo.title')"
    icon="mingpian">
    <RowContent
      :label="t('baseinfo.r1')"
      :text="t('baseinfo.r1v')" />
    <RowContent
      :label="t('baseinfo.r2')"
      :text="t('baseinfo.r2v')" />
    <RowContent
      :label="t('baseinfo.r3')"
      :text="t('baseinfo.r3v')" />
    <RowContent
      :label="t('baseinfo.r4')"
      :text="t('baseinfo.r4v')" />

    <RowContent
      :label="t('baseinfo.r5')"
      :text="t('baseinfo.r5v')" />
  </Section>
</template>

<script setup lang="ts">
import Section from '../../components/Layouts/Section.vue'
import RowContent from '../../components/RowContent/RowContent.vue'
import { useI18n } from 'vue-i18n'
const { t } = useI18n()
</script>
