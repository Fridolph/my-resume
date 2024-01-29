<template>
  <RowContent
    align="right"
    label="四川爱礼科技有限公司"
    :label-bold="true"
    :label-width="220"
    :is-wrap="true"
    :is-title="true"
    text="2016年1月——2017年7月" />

  <ListWrap
    title="工作内容与职责："
    :list="list"
    inner
    titleSize="base"
    bold />

  <ProMain />
</template>

<script setup lang="ts">
import { ref } from 'vue'
import RowContent from '../../../components/RowContent/RowContent.vue'
import ListWrap from '../../../components/ListWrap/ListWrap.vue'
import ProMain from './ProMain.vue'

const list = ref([
  '- 负责 环球礼仪知识平台、四川爱礼科技官网 项目的前端界面及相关开发',
  '- 根据设计图切图，以页为模块单位完成相关静态页的开发',
  '- 将页面各子模块组件化，维护容器组件及其展示组件',
  '- 各子页面进行移动端响应式适配和其他兼容处理',
])
</script>
