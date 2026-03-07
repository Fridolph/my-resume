<script setup lang="ts">
const { data: pageData, pending, error } = await useResumePageContent()

usePageSeo({
  title: '在线简历 · Fridolph Web',
  description: '在线简历页面骨架，后续将接入结构化简历数据与多语言内容。',
  path: '/resume'
})
</script>

<template>
  <WebPageContainer>
    <template v-if="pending">
      <UCard>
        <p class="text-sm text-muted">
          正在加载简历内容…
        </p>
      </UCard>
    </template>

    <template v-else-if="error || !pageData">
      <UAlert color="error" variant="subtle" title="简历内容加载失败" description="请稍后重试，或检查简历数据读取逻辑。" />
    </template>

    <template v-else>
      <WebSectionIntro
        :badge="pageData.intro.badge"
        :title="pageData.intro.title"
        :description="pageData.intro.description"
      />

      <div class="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        <WebResumeBlockCard
          v-for="section in pageData.sections"
          :key="section.title"
          :title="section.title"
          :description="section.description"
          :highlights="section.highlights"
        />
      </div>
    </template>
  </WebPageContainer>
</template>
