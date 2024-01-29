<template>
  <div class="flex flex-col mb-2">
    <TitleDesc
      :title="title"
      :show-icon="showIcon"
      :icon="icon"
      :description="description" />

    <template v-if="showLib">
      <div class="h-[60px] sm:h-auto flex flex-wrap my-1 mb-3 px-3">
        <Button
          size="small"
          type="primary"
          plain
          >{{ label }}</Button
        >
        <slot name="lib"></slot>
      </div>
    </template>

    <slot></slot>
    <slot name="extra"></slot>
  </div>
</template>

<script setup lang="ts">
import { Button } from 'fri-element-plus'
import { ProjectWrapProps } from './types'
import TitleDesc from '../TitleDesc/TitleDesc.vue'
withDefaults(defineProps<ProjectWrapProps>(), {
  showIcon: true,
  icon: 'xiangmu',
  showLib: true,
  label: '技术栈'
})
</script>

<style scoped></style>
