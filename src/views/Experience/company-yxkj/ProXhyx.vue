<template>
  <ProjectWrap
    class="pl-4"
    :title="t('proXhyx.name')"
    :btn-label="t('stack')"
    :description="t('proXhyx.descriptiton')"
  >
    <template #lib>
      <button class="my-btn info">微信小程序</button>
      <button class="my-btn info">uni-app</button>
      <button class="my-btn info">uView UI</button>
    </template>
    <ListWrap
      :title="t('contributions')"
      :list="lists"
      inner
      bold
    />
  </ProjectWrap>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import ProjectWrap from '../../../components/ProjectWrap/ProjectWrap.vue'
import ListWrap from '../../../components/ListWrap/ListWrap.vue'
import { useI18n } from 'vue-i18n'
const { t } = useI18n()

const lists = computed(() => [t('proXhyx.d1'), t('proXhyx.d2')])
</script>
