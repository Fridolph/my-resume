<template>
  <Section
    anchor="Personal"
    :title="t('personal.title')"
    icon="github-fill">
    <ProCard />

    <ArticleList />
  </Section>
</template>

<script setup lang="ts">
import Section from '../../components/Layouts/Section.vue'
import ProCard from './ProCard.vue'
import ArticleList from './ArticleList.vue'
import { useI18n } from 'vue-i18n'
const { t } = useI18n()
</script>
