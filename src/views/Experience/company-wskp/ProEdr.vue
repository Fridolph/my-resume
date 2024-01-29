<template>
  <ProjectWrap
    class="pl-4"
    title="EDR 终端侦测与响应平台"
    description="一次完整的ToB前端项目开发经历。该项目主要阐述EDR概念本身，从各维度展示用户基础数据，通过筛选与分析，归纳总结出威胁链供安全人员参考。该项目依托于综合管理平台，通过私有部署实现对用户终端的进程、文件等恶意代码实时监控，实现预测和预警等。">
    <template #lib>
      <Button plain type="info" size="small">Vue2</Button>      
      <Button plain type="info" size="small">iView</Button>
      <Button plain type="info" size="small">Vxe-Table</Button>
      <Button plain type="info" size="small">Vue-i18n</Button>
      <Button plain type="info" size="small">Echarts</Button>
      <Button plain type="info" size="small">D3.js</Button>
    </template>
    <ListWrap
      title="主要贡献："
      :list="edrList"
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

const edrList = ref([
  '- 负责前端架构，项目构建，完善基础模块、util，编写文档和示例代码',
  '- 这里写得有点糙，可以想下再完善，别和职责搞混了',
])

const hardList = ref([
  '- 高级搜索，定制搜索，数据联动（筛选器）',
  '- 通过 websocket 实时通信投递并展示终端数据（资产详情）',
  '- 复杂表格定制与良好展示（告警数据）',
  '- 单个接口大量数据的处理（全网列表）',
  '- 自定义页面及html、pdf、excel导出功能(自定义报表)',
])
</script>
