<script setup lang="ts">
import type { ContentReleaseRecord } from '@repo/types'

definePageMeta({
  middleware: 'auth'
})

const toast = useToast()
const { formatDateTime } = useDateTimeFormatter()
const { hasPermission } = usePermissions()

if (!hasPermission('site.read')) {
  await navigateTo('/unauthorized')
}

const canWriteReleases = hasPermission('site.write')
const apiClient = usePlatformApiClient()

const { data, pending, error, refresh } = await useAsyncData('admin-content-releases', async () => {
  return await apiClient.listContentReleases()
})

const releases = computed<ContentReleaseRecord[]>(() => data.value ?? [])
const activeRelease = computed(() => releases.value.find(item => item.status === 'active') ?? null)

async function handlePublishRelease() {
  try {
    await apiClient.publishContentRelease()
    await refresh()
    toast.add({
      title: '统一发布已完成',
      description: '新的公开发布批次已创建并激活。',
      color: 'success'
    })
  } catch (publishError) {
    const message = publishError instanceof Error ? publishError.message : '统一发布失败，请稍后重试。'
    toast.add({
      title: '统一发布失败',
      description: message,
      color: 'error'
    })
  }
}

async function handleActivateRelease(releaseId: string) {
  try {
    await apiClient.activateContentRelease(releaseId)
    await refresh()
    toast.add({
      title: '发布批次已切换',
      description: '当前公开站点已切换到所选发布批次。',
      color: 'success'
    })
  } catch (activateError) {
    const message = activateError instanceof Error ? activateError.message : '激活失败，请稍后重试。'
    toast.add({
      title: '激活失败',
      description: message,
      color: 'error'
    })
  }
}
</script>

<template>
  <UContainer class="py-10">
    <template v-if="pending">
      <UCard>
        <p class="text-sm text-muted">正在加载统一发布批次…</p>
      </UCard>
    </template>

    <template v-else-if="error">
      <UAlert title="统一发布批次加载失败" description="请检查 P6-5 发布中心 API 链路。" color="error" variant="subtle" />
    </template>

    <template v-else>
      <div class="space-y-6">
        <div class="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div class="space-y-2">
            <UBadge label="P6-5 统一发布策略" color="primary" variant="subtle" class="w-fit" />
            <div class="space-y-1">
              <h1 class="text-2xl font-semibold text-highlighted">统一发布中心</h1>
              <p class="max-w-3xl text-sm text-muted">当前页面用于管理公开站点真正生效的发布批次，让前台读取同一组一致的公开内容版本。</p>
            </div>
          </div>

          <UButton v-if="canWriteReleases" label="创建并激活新批次" icon="i-lucide-rocket" @click="handlePublishRelease" />
        </div>

        <UCard v-if="activeRelease">
          <template #header>
            <div class="space-y-1">
              <h2 class="text-base font-semibold text-highlighted">当前激活批次</h2>
              <p class="text-sm text-muted">公开站点当前正在消费这一批次的内容版本。</p>
            </div>
          </template>

          <div class="space-y-2 text-sm text-muted">
            <p>名称：{{ activeRelease.name }}</p>
            <p>状态：{{ activeRelease.status }}</p>
            <p>简历版本：{{ activeRelease.resumeVersionId }}</p>
            <p>文案数量：{{ activeRelease.translationVersionIds.length }}</p>
            <p>项目数量：{{ activeRelease.projectVersionIds.length }}</p>
            <p>创建时间：{{ formatDateTime(activeRelease.createdAt) }}</p>
            <p>激活时间：{{ formatDateTime(activeRelease.activatedAt) }}</p>
          </div>
        </UCard>

        <div class="grid gap-4">
          <UCard v-for="release in releases" :key="release.id">
            <template #header>
              <div class="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                <div class="space-y-1">
                  <div class="flex flex-wrap items-center gap-2">
                    <h2 class="text-base font-semibold text-highlighted">{{ release.name }}</h2>
                    <UBadge :label="release.status" :color="release.status === 'active' ? 'success' : 'neutral'" variant="subtle" />
                  </div>
                  <p class="text-xs text-muted">ID：{{ release.id }}</p>
                </div>

                <div v-if="canWriteReleases && release.status !== 'active'" class="flex gap-2">
                  <UButton label="激活该批次" color="warning" variant="subtle" @click="handleActivateRelease(release.id)" />
                </div>
              </div>
            </template>

            <div class="space-y-2 text-sm text-muted">
              <p>简历版本：{{ release.resumeVersionId }}</p>
              <p>文案数量：{{ release.translationVersionIds.length }}</p>
              <p>项目数量：{{ release.projectVersionIds.length }}</p>
              <p>创建人：{{ release.createdBy?.name || '暂无' }}</p>
              <p>激活人：{{ release.activatedBy?.name || '暂无' }}</p>
              <p>创建时间：{{ formatDateTime(release.createdAt) }}</p>
              <p>更新时间：{{ formatDateTime(release.updatedAt) }}</p>
            </div>
          </UCard>
        </div>
      </div>
    </template>
  </UContainer>
</template>
