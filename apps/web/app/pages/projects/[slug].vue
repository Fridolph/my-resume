<script setup lang="ts">
const route = useRoute()
const slug = String(route.params.slug || 'unknown-project')
const { data: pageData, pending, error } = await useProjectDetailContent(slug)

usePageSeo({
  title: `${slug} · 项目详情 · Fridolph Web`,
  description: `项目 ${slug} 的详情页骨架，后续将接入项目详情数据和 SEO 内容。`,
  path: `/projects/${slug}`
})
</script>

<template>
  <WebPageContainer size="narrow">
    <template v-if="pending">
      <UCard>
        <p class="text-sm text-muted">
          正在加载项目详情…
        </p>
      </UCard>
    </template>

    <template v-else-if="error || !pageData">
      <UAlert color="error" variant="subtle" title="项目详情加载失败" description="请稍后重试，或检查详情数据读取逻辑。" />
    </template>

    <template v-else>
      <WebSectionIntro
        :badge="pageData.intro.badge"
        :title="pageData.intro.title"
        :description="pageData.intro.description"
      />

      <div class="grid gap-4 md:grid-cols-3">
        <WebStatCard
          v-for="section in pageData.stats"
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
              当前详情页已经改为数据驱动渲染，后续可以直接替换为后台项目详情响应。
            </p>
          </div>
        </template>

        <template #footer>
          <UButton to="/projects" label="返回项目列表" variant="subtle" color="neutral" />
        </template>
      </UCard>
    </template>
  </WebPageContainer>
</template>
