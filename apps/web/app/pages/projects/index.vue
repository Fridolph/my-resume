<script setup lang="ts">
usePageSeo({
  title: '项目列表 · Fridolph Web',
  description: '项目列表页面骨架，后续将接入后台项目管理模块的数据。',
  path: '/projects'
})

const projects = [
  {
    title: 'Resume Platform',
    slug: 'resume-platform',
    description: 'Monorepo 个人内容平台，包含展示站与管理后台。',
    tags: ['Nuxt 4', 'Monorepo', 'Nuxt UI']
  },
  {
    title: 'Design System Draft',
    slug: 'design-system-draft',
    description: '预留 UI 设计系统沉淀方向。',
    tags: ['Design Tokens', 'Reusable UI', 'Theme']
  },
  {
    title: 'i18n Content Hub',
    slug: 'i18n-content-hub',
    description: '预留文案与内容管理中心方向。',
    tags: ['i18n', 'CMS', 'Content Workflow']
  }
]
</script>

<template>
  <WebPageContainer>
    <WebSectionIntro
      badge="Projects Components"
      title="项目列表"
      description="W3 已将项目列表页抽象成项目预览卡片体系。后续无论项目来源是本地 mock 还是后台 API，都可以复用同一套展示组件。"
    />

    <div class="grid gap-4 lg:grid-cols-3">
      <WebProjectPreviewCard
        v-for="project in projects"
        :key="project.slug"
        :title="project.title"
        :slug="project.slug"
        :description="project.description"
        :tags="project.tags"
      />
    </div>
  </WebPageContainer>
</template>
