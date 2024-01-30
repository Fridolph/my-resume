<template>
  <Section
    title="专业技能"
    anchor="Skill"
    icon="zhuanyezhishijineng">
    <ListWrap
      title="前端"
      :list="feList"
      bold />

    <ListWrap
      title="其他"
      :list="otherList"
      bold />
  </Section>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import Section from '../../components/Layouts/Section.vue'
import ListWrap from '../../components/ListWrap/ListWrap.vue'

const feList = ref([
  '1. 熟练掌握 HTML、CSS 编写符合 Web 标准的代码；',
  '2. 熟悉 JavaScript、TypeScript， 持续关注 ESNext 特性；',
  '3. 熟悉 Webpack、Vite 等打包工具及其构建流程；',
  '4. 熟悉 Vue 及相关技术栈的开发，了解 React 技术栈；',
  '5. 网络安全行业，熟悉 Web安全 知识。',
])

const otherList = ref([
  '1. 熟悉 Node.js 及常用模块；',
  '2. 熟悉 Linux 常用命令，独立完成部署；',
  '3. 遵循 lint 编写符合团队规范的代码；',
  '4. 熟悉版本管理工具 git；',
  '5. 善用科学搜索、插件，高效主义。',
])
</script>
