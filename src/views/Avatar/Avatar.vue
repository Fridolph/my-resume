<template>
  <div class="w-full flex justify-center items-center mx-auto my-5 flex-col">
    <img
      class="rounded-full max-w-[260px] mb-3"
      src="/img/avatar.jpg" />

    <div>{{ t('avatar.p1') }}</div>
    <div>{{ t('avatar.p2') }}</div>
  </div>
</template>

<script lang="ts" setup>
import { useI18n } from 'vue-i18n'
const { t } = useI18n()
</script>
