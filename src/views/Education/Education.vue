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
    
    <!-- 投简历遇到HR需要验证学信网的，看个人情况吧，不需要直接注释掉 -->
    <ChsiUtil />
  </Section>
</template>

<script setup lang="ts">
import Section from '../../components/Layouts/Section.vue'
import RowContent from '../../components/RowContent/RowContent.vue'
import ChsiUtil from './ChsiUtil.vue'
import { useI18n } from 'vue-i18n'
const { t } = useI18n()
</script>
