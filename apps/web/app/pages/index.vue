<script setup lang="ts">
const { t } = useWebLocale()
const { data: pageData, pending, error } = await useHomePageContent()

usePageSeo({
  title: 'Fridolph Web',
  description: t('page.home.description'),
  path: '/'
})
</script>

<template>
  <WebPageContainer>
    <template v-if="pending">
      <UCard>
        <p class="text-sm text-muted">
          {{ t('state.loading.home') }}
        </p>
      </UCard>
    </template>

    <template v-else-if="error || !pageData">
      <UAlert :title="t('state.error.home.title')" :description="t('state.error.home.description')" color="error" variant="subtle" />
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
