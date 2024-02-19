<template>
  <div class="grid grid-cols-1 gap-3 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-3">
    <RepositoryItem
      name="fridolph"
      :description="t('personal.r1')"
      link="https://github.com/Fridolph/Fridolph">
      <div class="flex flex-row">
        <div class="flex-1">
          {{ t('personal.recommend') }}
          <a
            class="block"
            target="_blank"
            href="https://github.com/Fridolph/Fridolph/blob/master/10%E5%85%B6%E4%BB%96/%E5%89%8D%E7%AB%AF%E5%AE%89%E5%85%A8%E5%AE%9E%E6%88%98/0%E4%BD%A0%E7%9C%9F%E7%9A%84%E4%BA%86%E8%A7%A3EDR%E5%90%97.md"
            >{{ t('personal.r1_t1') }}</a
          >
          <a
            class="block"
            target="_blank"
            href="https://github.com/Fridolph/Fridolph/blob/master/02CSS%E7%9B%B8%E5%85%B3/%E5%93%8D%E5%BA%94%E5%BC%8F%E5%B8%83%E5%B1%80/%E5%93%8D%E5%BA%94%E8%AE%BE%E8%AE%A1.md"
            >{{ t('personal.r1_t2') }}</a
          >
        </div>
        <a
          class="flex items-center justify-center p-4 cursor-pointer"
          href="https://github.com/Fridolph/Fridolph"
          target="_blank">
          <Iconfont
            name="tiaozhuan"
            :size="22" />
        </a>
      </div>
    </RepositoryItem>

    <RepositoryItem
      name="my-resume"
      transitionType="fromLeft"
      :description="t('personal.r2')"
      link="https://github.com/Fridolph/my-resume/">
      <div class="flex flex-row">
        <div class="basis-full flex flex-wrap flex-row gap-1">
          <img
            alt="Static Badge"
            src="https://img.shields.io/badge/%E8%84%9A%E6%89%8B%E6%9E%B6-vite-red" />
          <img
            alt="Static Badge"
            src="https://img.shields.io/badge/%E5%89%8D%E7%AB%AF%E6%A1%86%E6%9E%B6-Vue3-%236495ed" />
          <img
            alt="Static Badge"
            src="https://img.shields.io/badge/UI-TailWind-green" />
          <img
            alt="Static Badge"
            src="https://img.shields.io/badge/%E8%84%9A%E6%9C%AC%E8%AF%AD%E8%A8%80-TypeScript-%25236495ed" />
          <img
            alt="Static Badge"
            src="https://img.shields.io/badge/UI-fri_element_plus-%238a2be2" />
        </div>
        <a
          class="flex items-center justify-center p-4 cursor-pointer"
          href="https://github.com/Fridolph/Fridolph"
          target="_blank">
          <Iconfont
            name="tiaozhuan"
            :size="22" />
        </a>
      </div>
    </RepositoryItem>

    <RepositoryItem
      name="my-program"
      :description="t('personal.r3')"
      transitionType="fromTop"
      link="https://github.com/Fridolph/my-program">
      <div class="flex flex-row">
        <div class="flex-1">
          {{ t('personal.recommend') }}
          <a
            class="block"
            target="_blank"
            href="https://fridolph.github.io/my-program/public/hover-transition/transform-effect/index.html"
            >{{ t('personal.r3_t1') }}</a
          >
          <a
            class="block"
            target="_blank"
            href="https://fridolph.github.io/my-program/public/hover-transition/text-hover/index.html"
            >CSS3 text-hover demo</a
          >
        </div>
        <a
          class="flex items-center justify-center p-4 cursor-pointer"
          href="https://github.com/Fridolph/Fridolph"
          target="_blank">
          <Iconfont
            name="tiaozhuan"
            :size="22" />
        </a>
      </div>
    </RepositoryItem>

    <RepositoryItem
      name="my-element-plus"
      :description="t('personal.r4')"
      transitionType="fromRight"
      link="https://github.com/Fridolph/my-program">
      <div class="flex flex-row">
        <div class="basis-full flex flex-wrap flex-row gap-1">
          <img
            alt="Static Badge"
            src="https://img.shields.io/badge/%E8%84%9A%E6%89%8B%E6%9E%B6-vite-red" />
          <img
            alt="Static Badge"
            src="https://img.shields.io/badge/%E5%89%8D%E7%AB%AF%E6%A1%86%E6%9E%B6-Vue3-%236495ed" />

          <img
            alt="Static Badge"
            src="https://img.shields.io/badge/%E8%84%9A%E6%9C%AC%E8%AF%AD%E8%A8%80-TypeScript-%25236495ed" />
          <img
            alt="Static Badge"
            src="https://img.shields.io/badge/%E6%89%93%E5%8C%85%E5%B7%A5%E5%85%B7-Rollup-orange" />
        </div>
        <a
          class="flex items-center justify-center p-4 cursor-pointer"
          href="https://github.com/Fridolph/Fridolph"
          target="_blank">
          <Iconfont
            name="tiaozhuan"
            :size="22" />
        </a>
      </div>
    </RepositoryItem>

    <!-- 项目虽好，但求面试还写刷面试的，场景过于不适 -->
    <!-- 听取老师建议，PDF把这个效果去掉了 -->
    <!-- 在线简历方便演示估计也没人注意细节暂且保留 -->
    <RepositoryItem
      name="FE-prepare-interview"
      transitionType="fadeIn"
      :description="t('personal.r5')"
      link="https://github.com/Fridolph/FE-prepare-interview">
      <div class="flex flex-row">
        <div class="flex flex-wrap gap-y-2">
          <button class="my-btn">{{ t('personal.b1') }}</button>
          <button class="my-btn">Promise</button>
          <button class="my-btn">{{ t('personal.b3') }}</button>
          <button class="my-btn">http</button>
          <button class="my-btn">{{ t('personal.b5') }}</button>
          <button class="my-btn">{{ t('personal.b6') }}</button>
        </div>
        <a
          class="flex items-center justify-center p-4 cursor-pointer"
          href="https://github.com/Fridolph/FE-prepare-interview"
          target="_blank">
          <Iconfont
            name="tiaozhuan"
            :size="22" />
        </a>
      </div>
    </RepositoryItem>
  </div>
</template>

<script setup lang="ts">
import RepositoryItem from '../../components/RepositoryItem/RepositoryItem.vue'
import Iconfont from '../../components/Iconfont/Iconfont.vue'
import { useI18n } from 'vue-i18n'
const { t } = useI18n()
</script>
