<template>
  <ul class="my-5">
    <li class="text-base font-bold mb-3">参与开源</li>

    <li class="group">
      <a
        class="before:content-['•'] before:pl-3 before:mr-2 before:text-sm before:font-bold before:mb-2 text-[var(--link)]"
        target="_blank"
        href="https://developer.mozilla.org/zh-CN/docs/Learn/Performance/Perceived_performance"
        >MDN - 感知性能</a
      > <span>{{ t('personal.l1desc') }}</span>
    </li>

    <li>
      <a
        class="before:content-['•'] before:pl-3 before:mr-2 before:text-sm before:font-bold before:mb-2 text-[var(--link)]"
        target="_blank"
        href="https://github.com/jerryc127/hexo-theme-butterfly"
        >hexo-theme-butterfly</a
      ><span>{{ t('personal.l2desc') }}</span>
    </li>
  </ul>

  <ul class="my-5">
    <li class="text-base font-bold mb-3">{{ t('personal.article') }}</li>

    <li class="group">
      <a
        class="before:content-['•'] before:pl-3 before:mr-2 before:text-sm before:font-bold before:mb-2 text-[var(--link)]"
        target="_blank"
        href="https://juejin.cn/post/7334929489195909170"
        >TailWindCSS + Vite + Vue3 打造个性化在线简历项目，从开发到上线</a
      >
    </li>

    <li>
      <a
        class="before:content-['•'] before:pl-3 before:mr-2 before:text-sm before:font-bold before:mb-2 text-[var(--link)]"
        target="_blank"
        href="https://blog.fridolph.top/2024/01/26/32647990-bc5d-11ee-b11d-1ddb3fe7683d/"
        >什么是Accessibility - 无障碍</a
      >
    </li>
  </ul>
</template>

<script setup lang="ts">
import { useI18n } from 'vue-i18n'
const { t } = useI18n()
</script>
