<template>
  <ProjectWrap
    class="pl-4"
    :title="t('proLarge.name')"
    :btn-label="t('stack')"
    :description="t('proLarge.description')">
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
        >ECharts</Button
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
  t('proLarge.d1'),
  t('proLarge.d2'),
  t('proLarge.d3'),
])
const hardList = computed(() => [
  t('proLarge.h1'),
  t('proLarge.h2'),
  t('proLarge.h3'),
  t('proLarge.h4'),
])
// const adminList = ref([
//   '- 大屏弃用图片，尽多CSS绘制和Svg，提高加载速度',
//   '- lg尺寸下非核心展示的展示处理，得到客户领导同事认可',
//   '- ATT&CK 热力图常规展示（小屏下的simple模式支持）绘制',
// ])

// const hardList = ref([
//   '- 首屏加载，白屏优化，相关性能优化',
//   '- ECharts、d3 绘制各个子模块',
//   '- 数据响应式，各图表渲染实时更新',
//   '- 布局响应式，从平板、PC到大屏设备展示支持'
// ])
</script>
