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

// const feList = ref([
//   '1. 熟练掌握 HTML、CSS 编写符合 Web 标准的代码；',
//   '2. 熟悉 JavaScript、TypeScript， 持续关注 ESNext 特性；',
//   '3. 熟悉 Webpack、Vite 等打包工具及其构建流程；',
//   '4. 熟悉 Vue 及相关技术栈的开发，了解 React 技术栈；',
//   '5. 网络安全行业，熟悉 Web安全 知识。',
// ])

// const otherList = ref([
//   '1. 熟悉 Node.js 及常用模块；',
//   '2. 熟悉 Linux 常用命令，独立完成部署；',
//   '3. 遵循 lint 编写符合团队规范的代码；',
//   '4. 熟悉版本管理工具 git；',
//   '5. 善用科学搜索、插件，高效主义。',
// ])
</script>
