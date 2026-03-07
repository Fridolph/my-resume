<script setup lang="ts">
const { data: pageData, pending, error } = await useProjectsPageContent()

usePageSeo({
  title: '项目列表 · Fridolph Web',
  description: '项目列表页面骨架，后续将接入后台项目管理模块的数据。',
  path: '/projects'
})
</script>

<template>
  <WebPageContainer>
    <template v-if="pending">
      <UCard>
        <p class="text-sm text-muted">
          正在加载项目内容…
        </p>
      </UCard>
    </template>

    <template v-else-if="error || !pageData">
      <UAlert color="error" variant="subtle" title="项目内容加载失败" description="请稍后重试，或检查项目数据读取逻辑。" />
    </template>

    <template v-else>
      <WebSectionIntro
        :badge="pageData.intro.badge"
        :title="pageData.intro.title"
        :description="pageData.intro.description"
      />

      <div class="grid gap-4 lg:grid-cols-3">
        <WebProjectPreviewCard
          v-for="project in pageData.projects"
          :key="project.slug"
          :title="project.title"
          :slug="project.slug"
          :description="project.description"
          :tags="project.tags"
        />
      </div>
    </template>
  </WebPageContainer>
</template>
