<script setup lang="ts">
const { t } = useWebLocale()
const { data: pageData, pending, error } = await useProjectsPageContent()

usePageSeo({
  title: t('page.projects.title'),
  description: t('page.projects.description'),
  path: '/projects'
})
</script>

<template>
  <WebPageContainer>
    <template v-if="pending">
      <UCard>
        <p class="text-sm text-muted">
          {{ t('state.loading.projects') }}
        </p>
      </UCard>
    </template>

    <template v-else-if="error || !pageData">
      <UAlert :title="t('state.error.projects.title')" :description="t('state.error.projects.description')" color="error" variant="subtle" />
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
