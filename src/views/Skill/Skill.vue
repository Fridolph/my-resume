<template>
  <Section
    :title="t('skill.title')"
    anchor="Skill"
    icon="zhuanyezhishijineng">
    <ListWrap
      :title="t('skill.fe')"
      :list="feList"
      bold />

    <ListWrap
      :title="t('skill.other')"
      :list="otherList"
      bold />
  </Section>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import Section from '../../components/Layouts/Section.vue'
import ListWrap from '../../components/ListWrap/ListWrap.vue'
import { useI18n } from 'vue-i18n'
const { t } = useI18n()

const feList = computed(() => [
  t('skill.fe1'),
  t('skill.fe2'),
  t('skill.fe3'),
  t('skill.fe4'),
  t('skill.fe5'),
])

const otherList = computed(() => [
  t('skill.o1'),
  t('skill.o2'),
  t('skill.o3'),
  t('skill.o4'),
  t('skill.o5'),
])
</script>
