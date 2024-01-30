<template>
  <Section
    anchor="Experience"
    title="工作经历"
    icon="gongzuoxinxi">
    <CompanyWskp />
    <div class="divide flex my-3"></div>
    <CompanyAili />
  </Section>
</template>

<script setup lang="ts">
import Section from '../../components/Layouts/Section.vue'
import CompanyWskp from './company-wskp/index.vue'
import CompanyAili from './company-aili/index.vue'
</script>
