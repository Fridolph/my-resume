<template>
  <div class="flex mb-4 flex-row justify-between">
    <template v-if="type === 'labelText'">
      <div
        class="label min-w-20 mr-10"
        :class="[labelBold ? 'font-bold' : '', isTitle ? 'text-lg' : 'text-sm']"
        :style="`${labelWidth ? `width:${labelWidth}px` : ''}`">
        {{ label }}
      </div>
      <div class="flex-1 text-left" :class="{'sm:text-right': isWrap}">
        <a
          v-if="link"
          :href="text"
          target="_blank"
          >{{ text }}</a
        >
        <template v-else>
          {{ text }}
        </template>
      </div>
    </template>
  </div>
</template>

<script setup lang="ts">
import { RowContentProps } from './types.ts'
withDefaults(defineProps<RowContentProps>(), {
  type: 'labelText',
  link: false,
  align: 'left',
  labelBold: false,
  isWrap: false,
  isTitle: false
})
</script>

<style scoped></style>
