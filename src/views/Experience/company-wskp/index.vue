<template>
  <RowContent
    align="right"
    label="成都网思科平科技有限公司"
    :label-bold="true"
    :label-width="220"
    :is-wrap="true"
    :is-title="true"
    text="2017年7月——2024年1月" />

  <ListWrap
    title="工作内容与职责："
    :list="list"
    inner
    title-size="base"
    bold />

  <ProEdr />
  <ProAdmin />
  <ProLarge />
  <ProTeam />
</template>

<script setup lang="ts">
import { ref } from 'vue'
import RowContent from '../../../components/RowContent/RowContent.vue'
import ListWrap from '../../../components/ListWrap/ListWrap.vue'
import ProEdr from './ProEdr.vue'
import ProAdmin from './ProAdmin.vue'
import ProLarge from './ProLarge.vue'
import ProTeam from './ProTeam.vue'

const list = ref([
  '1. 负责项目前端架构搭建，确定技术框架，明确团队开发规范；',
  '2. 整理产品需求文档，编写开发文档；',
  '3. 配合设计人员进行前端开发，完成产品与客户的需求与功能；',
  '4. 与后端工程师共同协商约定数据接口，完成前后台数据交互；',
  '5. 完成项目相关需求开发、自测和Code Review，及时反馈测试相关问题；',
  '6. 团队Leader，团队建设与资源共享。',
])
</script>

<style scoped></style>
