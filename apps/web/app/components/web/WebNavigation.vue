<script setup lang="ts">
const items = [
  { label: '首页', to: '/' },
  { label: '简历', to: '/resume' },
  { label: '项目', to: '/projects' }
]
</script>

<template>
  <UNavigationMenu :items="items" />
</template>
