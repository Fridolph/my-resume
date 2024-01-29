<template>
  <ProjectWrap
    class="pl-4"
    title="Admin 综合管理系统"
    description="公司核心项目，该系统用于管理用户权限，定制功能模块展示；可跳转到其他子系统（包括但不限于EDR 威胁侦测与响应平台、IDC 流量检测与分析系统、Robin 文件扫描系统、SH 安全狩猎项目等）；对其他子系统数据，用户登录，操作日志等进行展示和更进一步的权限操作。">
    <template #lib>
      <Button plain type="info" size="small">Vue3</Button>
      <Button plain type="info" size="small">TypeScript</Button>
      <Button plain type="info" size="small">Echarts</Button>
      <Button plain type="info" size="small">Naive UI</Button>
      <Button plain type="info" size="small">Vue-i18n</Button>
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
  '- 项目架构升级到Vue3，完成相关配置及构建工作',
  '- 和UI同事合作定制、封装表单、上传文件和高级搜索等组件',
  '- 核心模块功能实现，系统权限 及 跳转各子系统逻辑',
])

const hardList = ref([
  '列表复杂信息过滤、处理与展示',
  '定制表单，校验，数据联动及展示',
  '用户定制 smtp 服务相关设置与开启',
  '列表、图表、模版及搜索项的搜索与展示联动',
])
</script>
