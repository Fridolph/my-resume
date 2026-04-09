<template>
  <div class="mb-2 flex flex-col">
    <TitleDesc
      :title="title"
      :show-icon="showIcon"
      :icon="icon"
      :description="description" />

    <template v-if="showLib">
      <div class="my-1 mb-3 flex h-[60px] flex-wrap px-3 sm:h-auto">
        <button class="my-btn primary">{{ btnLabel }}</button>
        <slot name="lib"></slot>
      </div>
    </template>

    <slot></slot>
    <slot name="extra"></slot>
  </div>
</template>

<script setup lang="ts">
import { ProjectWrapProps } from './types'
import TitleDesc from '../TitleDesc/TitleDesc.vue'

withDefaults(defineProps<ProjectWrapProps>(), {
  showIcon: true,
  icon: 'xiangmu',
  showLib: true,
  btnLabel: '技术栈',
})
</script>

<style scoped></style>
