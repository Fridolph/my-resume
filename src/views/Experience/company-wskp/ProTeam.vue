<template>
  <ProjectWrap
    class="team-build pl-4"
    :title="t('team.name')"
    :show-lib="false"
    :btn-label="t('stack')"
    icon="shejiao">
    <TitleDesc
      icon="shejiao"
      :show-icon="false"
      title="wskp-UI"
      :description="t('team.wskpuiDesc')" />

    <ListWrap
      :title="t('team.main')"
      :list="teamContent"
      inner
      bold
      title-size="sm" />

    <ListWrap
      :title="t('team.grow')"
      :list="teamReward"
      inner
      bold
      title-size="sm" />

    <TitleDesc
      icon="shejiao"
      :show-icon="false"
      title="wskp-mock"
      :description="t('team.mockDesc')" />

    <TitleDesc
      icon="shejiao"
      :show-icon="false"
      title="wskp-UI"
      :description="t('team.deployDesc')" />
  </ProjectWrap>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import TitleDesc from '../../../components/TitleDesc/TitleDesc.vue'
import ProjectWrap from '../../../components/ProjectWrap/ProjectWrap.vue'
import ListWrap from '../../../components/ListWrap/ListWrap.vue'
import { useI18n } from 'vue-i18n'
const { t } = useI18n()

const teamContent = computed(() => [
  t('team.m1'),
  t('team.m2'),
  t('team.m3'),
  t('team.m4'),
  t('team.m5'),
  t('team.m6'),
])

const teamReward = computed(() => [
  t('team.g1'),
  t('team.g2'),
  t('team.g3'),
])
// const teamContent = ref([
//   '- 团队制定UI规范；明确了公共变量名，主题色值等；',
//   '- 前端代码规范(包括ESlint、Prettier等配置，模块、组件命名、写法和其他约定)；',
//   '- theme 相关主题变量、normalize、mixin等；',
//   '- 业务组件二次封装，为产品和UI提供demo示例；',
//   '- 以基础组件为粒度的单元测试；',
//   '- 尽可能详细的一份配套 vuepress 文档，方便后人乘凉。',
// ])

// const teamReward = ref([
//   '- 团队参与感，成员获得成就感',
//   '- 每次提交即review，互相学习',
//   '- 更加注重反馈与用户体验',
// ])
</script>

<style>
.team-build .iconfont {
  font-size: 20px !important;
  position: relative;
  top: -2px;
}
</style>
