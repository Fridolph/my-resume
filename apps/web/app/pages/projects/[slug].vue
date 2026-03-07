<script setup lang="ts">
const route = useRoute()
const slug = String(route.params.slug || 'unknown-project')
const { t } = useWebLocale()
const { data: pageData, pending, error } = await useProjectDetailContent(slug)

usePageSeo({
  title: `${slug} · Fridolph Web`,
  description: t('page.projectDetail.description'),
  path: `/projects/${slug}`
})
</script>

<template>
  <WebPageContainer size="narrow">
    <template v-if="pending">
      <UCard>
        <p class="text-sm text-muted">
          {{ t('state.loading.projectDetail') }}
        </p>
      </UCard>
    </template>

    <template v-else-if="error || !pageData">
      <UAlert :title="t('state.error.projectDetail.title')" :description="t('state.error.projectDetail.description')" color="error" variant="subtle" />
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
              {{ t('project.detail.summaryTitle') }}
            </h2>
            <p class="text-sm text-muted">
              {{ t('project.detail.summaryDescription') }}
            </p>
          </div>
        </template>

        <template #footer>
          <UButton to="/projects" :label="t('project.detail.back')" variant="subtle" color="neutral" />
        </template>
      </UCard>
    </template>
  </WebPageContainer>
</template>
