<script setup lang="ts">
const route = useRoute()
const slug = computed(() => String(route.params.slug || 'unknown-project'))
const pageTitle = computed(() => `${slug.value} · 项目详情 · Fridolph Web`)
const pageDescription = computed(() => `项目 ${slug.value} 的详情页骨架，后续将接入项目详情数据和 SEO 内容。`)

const detailSections = computed(() => [
  {
    label: '页面类型',
    value: '动态详情页',
    hint: '用于承载项目详情内容。'
  },
  {
    label: '当前 slug',
    value: slug.value,
    hint: '来自 Nuxt 动态路由参数。'
  },
  {
    label: '下阶段能力',
    value: '接入真实数据',
    hint: '后续对接后台项目内容。'
  }
])

usePageSeo({
  title: pageTitle.value,
  description: pageDescription.value,
  path: `/projects/${slug.value}`
})
</script>

<template>
  <WebPageContainer size="narrow">
    <WebSectionIntro
      badge="Project Detail Components"
      :title="slug"
      :description="pageDescription"
    />

    <div class="grid gap-4 md:grid-cols-3">
      <WebStatCard
        v-for="section in detailSections"
        :key="section.label"
        :label="section.label"
        :value="section.value"
        :hint="section.hint"
      />
    </div>

    <UCard>
      <template #header>
        <div class="space-y-1">
          <h2 class="text-base font-semibold text-highlighted">
            页面说明
          </h2>
          <p class="text-sm text-muted">
            当前详情页用于验证动态路由、页面 SEO 封装和后续项目详情模块的承载边界。
          </p>
        </div>
      </template>

      <template #footer>
        <UButton to="/projects" label="返回项目列表" variant="subtle" color="neutral" />
      </template>
    </UCard>
  </WebPageContainer>
</template>
