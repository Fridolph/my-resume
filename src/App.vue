<template>
  <!-- <img
    class="aspect-video"
    src="/vite.svg" /> -->
  <!-- <img
    class="aspect-square"
    src="./assets/vue.svg" /> -->
  <div class="container">
    <div class="flex items-center">
      <div class="">
        <img
          class="aspect-square"
          src="./assets/vue.svg" />
      </div>
      <div class="flex flex-col ml-2">
        <strong>Fridolph</strong>
        <span>前端工程师</span>
      </div>
    </div>
  </div>
</template>
<script setup lang="ts">
// import { Button, Message } from 'fri-element-plus'
</script>
<style scoped>
.logo {
  height: 6em;
  padding: 1.5em;
  will-change: filter;
  transition: filter 300ms;
}
.logo:hover {
  filter: drop-shadow(0 0 2em #646cffaa);
}
.logo.vue:hover {
  filter: drop-shadow(0 0 2em #42b883aa);
}
</style>
