<script setup lang="ts">
const { t } = useWebLocale()
const { data: pageData, pending, error } = await useResumePageContent()

usePageSeo({
  title: t('page.resume.title'),
  description: t('page.resume.description'),
  path: '/resume'
})
</script>

<template>
  <WebPageContainer>
    <template v-if="pending">
      <UCard>
        <p class="text-sm text-muted">
          {{ t('state.loading.resume') }}
        </p>
      </UCard>
    </template>

    <template v-else-if="error || !pageData">
      <UAlert :title="t('state.error.resume.title')" :description="t('state.error.resume.description')" color="error" variant="subtle" />
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
