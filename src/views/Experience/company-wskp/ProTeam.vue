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
      type="ul"
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
      title="wskp-deploy"
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
])

const teamReward = computed(() => [
  t('team.g1'),
  t('team.g2'),
  t('team.g3'),
])
</script>

<style>
.team-build .iconfont {
  font-size: 20px !important;
  position: relative;
  top: -2px;
}
</style>
