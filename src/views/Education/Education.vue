<template>
  <Section
    :title="t('education.title')"
    anchor="Education"
    icon="peixunjiaoyu">
    <RowContent
      :label="t('education.r1')"
      :label-width="190"
      :label-bold="true"
      :is-wrap="true"
      :text="t('education.r1v')"
      align="right"      
     />
  </Section>
</template>

<script setup lang="ts">
import Section from '../../components/Layouts/Section.vue'
import RowContent from '../../components/RowContent/RowContent.vue'
import { useI18n } from 'vue-i18n'
const { t } = useI18n()
</script>
