<template>
  <ProjectWrap
    class="pl-4"
    :title="t('proAdmin.name')"
    :btn-label="t('stack')"
    :description="t('proAdmin.description')">
    <template #lib>
      <Button plain type="info" size="small">Vue3</Button>
      <Button plain type="info" size="small">TypeScript</Button>
      <Button plain type="info" size="small">ECharts</Button>
      <Button plain type="info" size="small">Naive UI</Button>
      <Button plain type="info" size="small">Vue-i18n</Button>
    </template>
    <ListWrap
      :title="t('contributions')"
      :list="adminList"
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

const adminList = computed(() => [
  t('proAdmin.c1'),
  t('proAdmin.c2'),
  t('proAdmin.c3'),
  t('proAdmin.c4'),
])

const hardList = computed(() => [
  t('proAdmin.h1'),
  t('proAdmin.h2'),
  t('proAdmin.h3'),
  t('proAdmin.h4'),
])
// const adminList = ref([
//   '- 项目架构升级到Vue3，完成相关配置及构建工作',
//   '- 和UI同事合作，确定UI库，定义主题变量，编写组件规范',
//   '- 封装通用表单、上传文件和高级搜索等组件',
//   '- 核心模块功能实现，系统权限 及 跳转各子系统逻辑',
// ])

// const hardList = ref([
//   '列表复杂信息过滤、处理与展示',
//   '定制表单，校验，数据联动及展示',
//   '用户定制 smtp 服务相关设置与开启',
//   '列表、图表、模版及搜索项的搜索与展示联动',
// ])
</script>
