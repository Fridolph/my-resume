<template>
  <Section
    title="联系方式"
    icon="lianxi">
    <RowContent
      label="手机"
      text="16602835945" />
    <RowContent
      label="邮箱"
      text="249121486@qq.com" />
    <RowContent
      link
      label="Github"
      text="https://github.com/Fridolph" />
    <RowContent
      link
      label="技术博客"
      text="http://blog.fridolph.top" />
  </Section>
</template>

<script setup lang="ts">
import Section from '../../components/Layouts/Section.vue'
import RowContent from '../../components/RowContent/RowContent.vue'
</script>
