<template>
  <Section
    anchor="Personal"
    :title="`个人项目 & 参与开源`"
    icon="github-fill">
    <div class="grid grid-cols-1 gap-3 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-3">
      <RepositoryItem
        name="fridolph"
        description="前端相关学习途径，综合性学习资料整理仓库"
        link="https://github.com/Fridolph/Fridolph">
        <div class="flex flex-row">
          <div class="flex-1">
            推荐内容：
            <a
              class="block"
              target="_blank"
              href="https://github.com/Fridolph/Fridolph/blob/master/10%E5%85%B6%E4%BB%96/%E5%89%8D%E7%AB%AF%E5%AE%89%E5%85%A8%E5%AE%9E%E6%88%98/0%E4%BD%A0%E7%9C%9F%E7%9A%84%E4%BA%86%E8%A7%A3EDR%E5%90%97.md"
              >安全-你真的了解EDR吗</a
            >
            <a
              class="block"
              target="_blank"
              href="https://github.com/Fridolph/Fridolph/blob/master/02CSS%E7%9B%B8%E5%85%B3/%E5%93%8D%E5%BA%94%E5%BC%8F%E5%B8%83%E5%B1%80/%E5%93%8D%E5%BA%94%E8%AE%BE%E8%AE%A1.md"
              >学习响应式设计</a
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
        transitionType="formLeft"
        description="在线简历，Vite + TailWindCSS 极速搭建"
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
        description="demo仓库，较为简单的CSS、JS效果的细节实现"
        transitionType="fromTop"
        link="https://github.com/Fridolph/my-program">
        <div class="flex flex-row">
          <div class="flex-1">
            推荐内容：
            <a
              class="block"
              target="_blank"
              href="https://fridolph.github.io/my-program/public/hover-transition/transform-effect/index.html"
              >CSS3 Transform 常见效果一览</a
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
        description="Vue3 + Vite + TS4 打造自己的组件库"
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

      <RepositoryItem
        name="FE-prepare-interview"
        transitionType="fadeIn"
        description="前端面试综合指导大纲，根据个人理解二次加工"
        link="https://github.com/Fridolph/FE-prepare-interview">
        <div class="flex flex-row">
          <div class="flex flex-wrap gap-y-2">
            <Button size="small">Vue源码</Button>
            <Button size="small">Promise</Button>
            <Button size="small">ES规范</Button>
            <Button size="small">http</Button>
            <Button size="small">项目经验</Button>
            <Button size="small">性能优化</Button>
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
  </Section>
</template>

<script setup lang="ts">
import Section from '../../components/Layouts/Section.vue'
import RepositoryItem from '../../components/RepositoryItem/RepositoryItem.vue'
import Iconfont from '../../components/Iconfont/Iconfont.vue'
import { Button } from 'fri-element-plus'
</script>
