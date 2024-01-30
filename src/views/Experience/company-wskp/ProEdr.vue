<template>
  <ProjectWrap
    class="pl-4"
    :title="t('proEdr.name')"
    :btn-label="t('stack')"
    :description="t('proEdr.description')">
    <template #lib>
      <Button
        plain
        type="info"
        size="small"
        >Vue2</Button
      >
      <Button
        plain
        type="info"
        size="small"
        >iView</Button
      >
      <Button
        plain
        type="info"
        size="small"
        >Vxe-Table</Button
      >
      <Button
        plain
        type="info"
        size="small"
        >Vue-i18n</Button
      >
      <Button
        plain
        type="info"
        size="small"
        >ECharts</Button
      >
      <Button
        plain
        type="info"
        size="small"
        >D3.js</Button
      >
    </template>
    <ListWrap
      :title="t('contributions')"
      :list="edrList"
      inner
      bold />

    <ListWrap
      :title="t('hard')"
      :list="hardList"
      inner
      bold />
  </ProjectWrap>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import ProjectWrap from '../../../components/ProjectWrap/ProjectWrap.vue'
import ListWrap from '../../../components/ListWrap/ListWrap.vue'
import { Button } from 'fri-element-plus'
import { useI18n } from 'vue-i18n'
const { t } = useI18n()

const edrList = computed(() => [
  t('proEdr.c1'),
  t('proEdr.c2'),
  t('proEdr.c3'),
  t('proEdr.c4'),
  t('proEdr.c5'),
  t('proEdr.c6'),
])

const hardList = computed(() => [
  t('proEdr.h1'),
  t('proEdr.h2'),
  t('proEdr.h3'),
  t('proEdr.h4'),
  t('proEdr.h5'),
])
// const edrList = ref([
//   '- 负责该项目前端架构，项目构建，完善基础模块、util，编写文档和示例代码',
//   '- 首页安全概念展示及可配置化展示',
//   '- 资产详情展示，websocket获取在线终端相关，并展示',
//   '- 封装接口请求、高级搜索、过滤器、PowerShell等业务组件',
//   '- 告警列表，进程信息等大量数据前端过滤和预缓存方案',
//   '- ToB项目私有部署方案 相关性能优化',
// ])

// const hardList = ref([
//   '- 高级搜索，定制搜索，数据联动（筛选器）',
//   '- 通过 websocket 实时通信投递并展示终端数据（资产详情）',
//   '- 复杂表格定制与良好展示（告警数据）',
//   '- 单个接口大量数据的处理（全网列表）',
//   '- 自定义页面及html、pdf、excel导出功能(自定义报表)',
// ])
</script>
