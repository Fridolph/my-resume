<template>
  <div class="w-full flex justify-center items-center mx-auto my-5 flex-col">
    <img
      class="rounded-full max-w-[260px] mb-3"
      src="/img/avatar.jpg" />

    <div class="group leading-none tracking-tight text-center mb-2">
      <span
        class="my-text-clip"
        >{{ t('avatar.p1') }}</span
      >
    </div>
    <div class="group leading-none tracking-tight text-center text-zinc-300">
      <span
        class="my-text-clip from-sky-400 to-violet-800"
        >{{ t('avatar.p2') }}</span
      >
    </div>
  </div>
</template>

<script lang="ts" setup>
import { useI18n } from 'vue-i18n'
const { t } = useI18n()
</script>
