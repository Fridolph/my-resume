<template>
  <ProjectWrap
    class="pl-4"
    title="环球礼仪知识平台"
    label="技术栈"
    :description="`打造图文内容社区，传统内容网站，类似简书。提供专业的“礼仪”知识，打造温馨理想的互动社区。`">
    <template #lib>
      <Button
        plain
        type="info"
        size="small"
        >jQuery</Button
      >
      <Button
        plain
        type="info"
        size="small"
        >各种jQuery插件</Button
      >
      <Button
        plain
        type="info"
        size="small"
        >BootStrap</Button
      >
      <Button
        plain
        type="info"
        size="small"
        >Echarts</Button
      >
    </template>

    <p class="pl-3">16年底为优化平台内容，进行架构升级。尤其是前端进行大重构</p>
    <div class="pl-3 my-3">
      <Button
        plain
        type="warning"
        size="small"
        >重构后</Button
      >
      <Button
        plain
        type="info"
        size="small"
        >Webpack</Button
      >
      <Button
        plain
        type="info"
        size="small"
        >React</Button
      >
      <Button
        plain
        type="info"
        size="small"
        >react-router</Button
      >
      <Button
        plain
        type="info"
        size="small"
        >Redux</Button
      >
    </div>
    <ListWrap
      title="主要贡献："
      :list="mainList"
      inner
      bold />

    <ListWrap
      title="项目难点："
      :list="hardList"
      inner
      bold />

    <ListWrap
      title="成长与收获："
      :list="growList"
      inner
      bold />
  </ProjectWrap>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import ProjectWrap from '../../../components/ProjectWrap/ProjectWrap.vue'
import ListWrap from '../../../components/ListWrap/ListWrap.vue'
import { Button } from 'fri-element-plus'

const mainList = ref([
  '- 以页面为单位，快速开发迭代，静态页面及相关样式编码',
  '- 一些工具模块的封装，如：滚动，全屏特效，工具栏，动画和过渡相关mixin',
  '- 页面模块的封装，使其在PC和移动端都能良好展示',
])

const hardList = ref([
  '- 项目重构，因底层框架改变而面临的各项改动、调整与适应',
  '- 学习JSX，理解Redux单向数据流的概念，前端开发模式和思维的改变',
  '- 踩坑，某些功能还是要用jQuery及插件，早期React套jQuery一言难尽',
])

const growList = ref([
  '- 从传统的静态页面开发模式，变为现代前端工程化开发模式',
  '- 学习BootStrap，定制UI组件，并二次封装',
  '- 掌握响应式布局，过渡与动画的应用',
  '- 改变传统DOM操作的思维方式，理解状态改变视图的核心思想',
  '- 通过React的学习和使用，理解和掌握组件化思想',
])
</script>
