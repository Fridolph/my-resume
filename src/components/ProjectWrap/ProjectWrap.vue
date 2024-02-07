<template>
  <div class="flex flex-col mb-2">
    <TitleDesc
      :title="title"
      :show-icon="showIcon"
      :icon="icon"
      :description="description" />

    <template v-if="showLib">
      <div class="h-[60px] sm:h-auto flex flex-wrap my-1 mb-3 px-3">
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
  btnLabel: '技术栈'
})
</script>

<style scoped></style>
