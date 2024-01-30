<template>
  <Section
    :title="t('thanks.title')"
    icon="ganxie">
    <div>{{ t('thanks.p1') }}</div>
    <div>{{ t('thanks.p2') }}</div>
  </Section>
</template>

<script setup lang="ts">
import Section from '../../components/Layouts/Section.vue'
import { useI18n } from 'vue-i18n'
const { t } = useI18n()
</script>
