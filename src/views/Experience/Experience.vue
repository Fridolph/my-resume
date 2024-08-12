<template>
  <Section
    anchor="Experience"
    :title="t('work')"
    icon="gongzuoxinxi"
  >
    <CompanyYxkj />
    <div class="divide flex my-3"></div>
    <CompanyWskp />
    <div class="divide flex my-3"></div>
    <CompanyAili />
  </Section>
</template>

<script setup lang="ts">
import Section from '../../components/Layouts/Section.vue'
import CompanyYxkj from './company-yxkj/index.vue'
import CompanyWskp from './company-wskp/index.vue'
import CompanyAili from './company-aili/index.vue'
import { useI18n } from 'vue-i18n'
const { t } = useI18n()
</script>
