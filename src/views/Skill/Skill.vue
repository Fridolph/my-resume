<template>
  <Section
    :title="t('skill.title')"
    anchor="Skill"
    icon="zhuanyezhishijineng">
    <ListWrap      
      type="ul"
      :list="feList"
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
  t('skill.p1'),
  t('skill.p2'),
  t('skill.p3'),
  t('skill.p4'),
  t('skill.p5'),
  t('skill.p6'),
  t('skill.p7'),
])
</script>
