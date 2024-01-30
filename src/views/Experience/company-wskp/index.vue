<template>
  <RowContent
    align="right"
    :label="t('wskp.name')"
    :label-bold="true"
    :label-width="220"
    :is-wrap="true"
    :is-title="true"
    :text="t('wskp.time')" />

  <ListWrap
    :title="t('responsibilities')"
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
import { computed } from 'vue'
import RowContent from '../../../components/RowContent/RowContent.vue'
import ListWrap from '../../../components/ListWrap/ListWrap.vue'
import ProEdr from './ProEdr.vue'
import ProAdmin from './ProAdmin.vue'
import ProLarge from './ProLarge.vue'
import ProTeam from './ProTeam.vue'
import { useI18n } from 'vue-i18n'
const { t } = useI18n()

const list = computed(() => [
  t('wskp.d1'),
  t('wskp.d2'),
  t('wskp.d3'),
  t('wskp.d4'),
  t('wskp.d5'),
  t('wskp.d6'),
])
// const list = ref([
//   '1. 负责项目前端架构搭建，确定技术框架，明确团队开发规范；',
//   '2. 整理产品需求文档，编写开发文档；',
//   '3. 配合设计人员进行前端开发，完成产品与客户的需求与功能；',
//   '4. 与后端工程师共同协商约定数据接口，完成前后台数据交互；',
//   '5. 完成项目相关需求开发、自测和Code Review，及时反馈测试相关问题；',
//   '6. 团队Leader，团队建设与资源共享。',
// ])
</script>

<style scoped></style>
