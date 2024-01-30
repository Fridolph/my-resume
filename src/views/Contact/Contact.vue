<template>
  <Section
    :title="t('contact.title')"
    icon="lianxi">
    <RowContent
      :label="t('contact.r1')"
      text="16602835945" />
    <RowContent
      :label="t('contact.r2')"
      text="249121486@qq.com" />
    <RowContent
      link
      label="Github"
      text="https://github.com/Fridolph" />
    <RowContent
      link
      :label="t('contact.r4')"
      text="http://blog.fridolph.top" />
  </Section>
</template>

<script setup lang="ts">
import Section from '../../components/Layouts/Section.vue'
import RowContent from '../../components/RowContent/RowContent.vue'
import { useI18n } from 'vue-i18n'
const { t } = useI18n()
</script>
