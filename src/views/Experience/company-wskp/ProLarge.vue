<template>
  <ProjectWrap
    class="pl-4"
    title="LC 安全分析大屏"
    description="安全分析大屏 将用户环境拿到的庞杂数据经过后台数据过滤、加工，最终以可视化形式来展示，经常会用在会议展览、业务监控、风险预警、地理信息分析等多种业务场景。">
    <template #lib>
      <Button
        plain
        type="info"
        size="small"
        >Vue3</Button
      >
      <Button
        plain
        type="info"
        size="small"
        >TypeScript</Button
      >
      <Button
        plain
        type="info"
        size="small"
        >Echarts</Button
      >

      <Button
        plain
        type="info"
        size="small"
        >D3.js</Button
      >
   
      <Button
        plain
        type="info"
        size="small"
        >Vue-i18n</Button
      >
    </template>
    <ListWrap
      title="主要贡献："
      :list="adminList"
      inner
      bold />

    <ListWrap
      title="项目难点："
      :list="hardList"
      inner
      bold />
  </ProjectWrap>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import ProjectWrap from '../../../components/ProjectWrap/ProjectWrap.vue'
import ListWrap from '../../../components/ListWrap/ListWrap.vue'
import { Button } from 'fri-element-plus'

const adminList = ref([
  '- 大屏弃用图片，尽多CSS绘制和Svg，提高加载速度',
  '- lg尺寸下非核心展示的展示处理，得到客户领导同事认可',
  '- ATT&CK 热力图常规展示（小屏下的simple模式支持）绘制',
])

const hardList = ref([
  '- 首屏加载，白屏优化，相关性能优化',
  '- Echarts、d3 绘制各个子模块',
  '- 数据响应式，各图表渲染实时更新',
  '- 布局响应式，从平板、PC到大屏设备展示支持'
])
</script>
