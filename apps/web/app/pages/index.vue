<script setup lang="ts">
const { data: pageData, pending, error } = await useHomePageContent()

usePageSeo({
  title: 'Fridolph Web',
  description: '个人内容展示站首页，承载个人简介、简历入口与项目展示入口。',
  path: '/'
})
</script>

<template>
  <WebPageContainer>
    <template v-if="pending">
      <UCard>
        <p class="text-sm text-muted">
          正在加载首页内容…
        </p>
      </UCard>
    </template>

    <template v-else-if="error || !pageData">
      <UAlert color="error" variant="subtle" title="首页内容加载失败" description="请稍后重试，或检查内容读取层实现。" />
    </template>

    <template v-else>
      <WebSectionIntro
        :badge="pageData.intro.badge"
        :title="pageData.intro.title"
        :description="pageData.intro.description"
      />

      <div class="grid gap-4 md:grid-cols-3">
        <WebStatCard
          v-for="stat in pageData.stats"
          :key="stat.label"
          :label="stat.label"
          :value="stat.value"
          :hint="stat.hint"
        />
      </div>

      <div class="grid gap-4 md:grid-cols-3">
        <WebFeatureCard
          v-for="card in pageData.features"
          :key="card.to"
          :title="card.title"
          :description="card.description"
          :to="card.to"
          :badge="card.badge"
        />
      </div>
    </template>
  </WebPageContainer>
</template>
