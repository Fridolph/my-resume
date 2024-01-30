<template>
  <RowContent
    align="right"
    :label="t('aili.name')"
    :label-bold="true"
    :label-width="220"
    :is-wrap="true"
    :is-title="true"
    :text="t('aili.time')" />

  <ListWrap
    :title="t('responsibilities')"
    :list="list"
    inner
    titleSize="base"
    bold />

  <ProMain />
</template>

<script setup lang="ts">
import { computed } from 'vue'
import RowContent from '../../../components/RowContent/RowContent.vue'
import ListWrap from '../../../components/ListWrap/ListWrap.vue'
import ProMain from './ProMain.vue'
import { useI18n } from 'vue-i18n'
const { t } = useI18n()

const list = computed(() => [
  t('aili.r1'),
  t('aili.r2'),
  t('aili.r3'),
  t('aili.r4'),
])
// const list = ref([
//   '- 负责 环球礼仪知识平台、四川爱礼科技官网 项目的前端界面及相关开发',
//   '- 根据设计图切图，以页为模块单位完成相关静态页的开发',
//   '- 将页面各子模块组件化，维护容器组件及其展示组件',
//   '- 各子页面进行移动端响应式适配和其他兼容处理',
// ])
</script>
