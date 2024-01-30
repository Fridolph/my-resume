<template>
  <Section
    title="基本信息"
    icon="mingpian">
    <RowContent
      label="姓名"
      text="付寅生" />
    <RowContent
      label="学历 / 专业"
      text="本科 / 通信工程" />
    <RowContent
      label="工作经验"
      text="八年" />
    <RowContent
      label="所在地"
      text="成都市高新区" />

    <RowContent
      label="求职意向"
      text="前端工程师 / 偏Vue" />
  </Section>
</template>

<script setup lang="ts">
import Section from '../../components/Layouts/Section.vue'
import RowContent from '../../components/RowContent/RowContent.vue'
</script>
