<script setup lang="ts">
import type { ContentReleaseRecord } from '@repo/types'

definePageMeta({
  middleware: 'auth'
})

const toast = useToast()
const { formatDateTime } = useDateTimeFormatter()
const { hasPermission } = usePermissions()
const { createReadOnlyNotice, confirmOperation } = useOperationGuidance()

if (!hasPermission('site.read')) {
  await navigateTo('/unauthorized')
}

const canWriteReleases = hasPermission('site.write')
const releaseReadOnlyNotice = createReadOnlyNotice('统一发布中心')
const apiClient = usePlatformApiClient()

const { data, pending, error, refresh } = await useAsyncData('admin-content-releases', async () => {
  return await apiClient.listContentReleases()
})

const releases = computed<ContentReleaseRecord[]>(() => data.value ?? [])
const activeRelease = computed(() => releases.value.find(item => item.status === 'active') ?? null)
const archivedReleaseCount = computed(() => releases.value.filter(item => item.status === 'archived').length)
const latestActivatedAt = computed(() => {
  const activatedAtValues = releases.value
    .map(item => item.activatedAt)
    .filter((value): value is string => Boolean(value))
    .sort((left, right) => new Date(right).getTime() - new Date(left).getTime())

  return activatedAtValues[0] ?? null
})
const releaseSummaryItems = computed(() => {
  return [
    {
      label: '发布批次总数',
      value: String(releases.value.length),
      hint: '当前统一发布中心中已经创建的全部批次数量。'
    },
    {
      label: '当前激活批次',
      value: activeRelease.value?.name ?? '暂无',
      hint: '公开站点当前真正消费的内容批次。'
    },
    {
      label: '公开项目数量',
      value: String(activeRelease.value?.projectVersionIds.length ?? 0),
      hint: '当前激活批次中包含的公开项目版本数。'
    },
    {
      label: '公开文案数量',
      value: String(activeRelease.value?.translationVersionIds.length ?? 0),
      hint: '当前激活批次中包含的公开文案版本数。'
    },
    {
      label: '最近激活时间',
      value: formatDateTime(latestActivatedAt.value),
      hint: '最近一次切换公开站点激活批次的时间。'
    },
    {
      label: '历史归档批次',
      value: String(archivedReleaseCount.value),
      hint: '可作为回切候选的历史归档批次数量。'
    }
  ]
})

async function handlePublishRelease() {
  const confirmed = await confirmOperation({
    title: '确认创建并激活新批次？',
    description: '系统会基于当前公开内容生成新的统一发布批次，并立即切换 Web 站点读取目标。'
  })

  if (!confirmed) {
    return
  }

  try {
    await apiClient.publishContentRelease()
    await refresh()
    toast.add({
      title: '统一发布已完成',
      description: '新的公开发布批次已创建并激活，页面摘要和当前激活批次信息已同步刷新。',
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
  const confirmed = await confirmOperation({
    title: '确认切换公开批次？',
    description: '切换后，Web 公开站点会立即改为读取所选批次的简历、项目和文案版本。'
  })

  if (!confirmed) {
    return
  }

  try {
    await apiClient.activateContentRelease(releaseId)
    await refresh()
    toast.add({
      title: '发布批次已切换',
      description: '当前公开站点已切换到所选发布批次，页面摘要与当前激活信息已同步更新。',
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
        <p class="text-sm text-muted">
          正在加载统一发布批次…
        </p>
      </UCard>
    </template>

    <template v-else-if="error">
      <UAlert
        title="统一发布批次加载失败"
        description="请检查 P6-5 发布中心 API 链路。"
        color="error"
        variant="subtle"
      />
    </template>

    <template v-else>
      <div class="space-y-6">
        <UAlert
          v-if="!canWriteReleases"
          :title="releaseReadOnlyNotice.title"
          :description="releaseReadOnlyNotice.description"
          color="warning"
          variant="subtle"
        />

        <div class="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div class="space-y-2">
            <UBadge
              label="T3-1 发布中心增强"
              color="primary"
              variant="subtle"
              class="w-fit"
            />
            <div class="space-y-1">
              <h1 class="text-2xl font-semibold text-highlighted">
                统一发布中心
              </h1>
              <p class="max-w-3xl text-sm text-muted">
                当前页面用于管理公开站点真正生效的发布批次，并更直观地展示当前公开站点到底正在消费哪一批内容版本。
              </p>
            </div>
          </div>

          <UButton
            v-if="canWriteReleases"
            label="创建并激活新批次"
            icon="i-lucide-rocket"
            @click="handlePublishRelease"
          />
        </div>

        <UAlert
          title="当前批次切换会直接影响 Web 公开内容读取"
          description="发布中心不会自动创建内容，只会切换公开站点当前读取的简历、项目与文案版本组合。"
          color="info"
          variant="subtle"
        />

        <div class="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          <UCard
            v-for="item in releaseSummaryItems"
            :key="item.label"
          >
            <div class="space-y-1">
              <p class="text-sm text-muted">
                {{ item.label }}
              </p>
              <p class="text-xl font-semibold text-highlighted">
                {{ item.value }}
              </p>
              <p class="text-xs text-muted">
                {{ item.hint }}
              </p>
            </div>
          </UCard>
        </div>

        <UCard
          v-if="activeRelease"
          class="border border-primary/30"
        >
          <template #header>
            <div class="space-y-1">
              <div class="flex flex-wrap items-center gap-2">
                <h2 class="text-base font-semibold text-highlighted">
                  当前激活批次
                </h2>
                <UBadge
                  label="公开站点正在使用"
                  color="success"
                  variant="subtle"
                />
              </div>
              <p class="text-sm text-muted">
                当前 Web 公开站点正在消费这一批次的内容版本，切换批次后首页、简历页、项目页与公开文案都会跟着变化。
              </p>
            </div>
          </template>

          <div class="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <div class="space-y-1 text-sm text-muted">
              <p class="text-xs">
                批次名称
              </p>
              <p class="font-medium text-default">
                {{ activeRelease.name }}
              </p>
            </div>
            <div class="space-y-1 text-sm text-muted">
              <p class="text-xs">
                简历版本
              </p>
              <p class="font-medium text-default">
                {{ activeRelease.resumeVersionId }}
              </p>
            </div>
            <div class="space-y-1 text-sm text-muted">
              <p class="text-xs">
                公开项目数量
              </p>
              <p class="font-medium text-default">
                {{ activeRelease.projectVersionIds.length }}
              </p>
            </div>
            <div class="space-y-1 text-sm text-muted">
              <p class="text-xs">
                公开文案数量
              </p>
              <p class="font-medium text-default">
                {{ activeRelease.translationVersionIds.length }}
              </p>
            </div>
          </div>

          <USeparator class="my-4" />

          <div class="grid gap-4 md:grid-cols-2 xl:grid-cols-3 text-sm text-muted">
            <p>状态：{{ activeRelease.status }}</p>
            <p>创建时间：{{ formatDateTime(activeRelease.createdAt) }}</p>
            <p>激活时间：{{ formatDateTime(activeRelease.activatedAt) }}</p>
            <p>创建人：{{ activeRelease.createdBy?.name || '暂无' }}</p>
            <p>激活人：{{ activeRelease.activatedBy?.name || '暂无' }}</p>
            <p>ID：{{ activeRelease.id }}</p>
          </div>
        </UCard>

        <div class="grid gap-4">
          <UCard
            v-for="release in releases"
            :key="release.id"
          >
            <template #header>
              <div class="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                <div class="space-y-1">
                  <div class="flex flex-wrap items-center gap-2">
                    <h2 class="text-base font-semibold text-highlighted">
                      {{ release.name }}
                    </h2>
                    <UBadge
                      :label="release.status === 'active' ? '当前激活' : release.status === 'archived' ? '历史归档' : release.status"
                      :color="release.status === 'active' ? 'success' : 'neutral'"
                      variant="subtle"
                    />
                  </div>
                  <p class="text-xs text-muted">
                    ID：{{ release.id }}
                  </p>
                </div>

                <div
                  v-if="canWriteReleases"
                  class="flex gap-2"
                >
                  <UButton
                    v-if="release.status !== 'active'"
                    label="切换为当前公开批次"
                    color="warning"
                    variant="subtle"
                    @click="handleActivateRelease(release.id)"
                  />
                  <UButton
                    v-else
                    label="当前已生效"
                    color="success"
                    variant="subtle"
                    disabled
                  />
                </div>
              </div>
            </template>

            <div class="grid gap-4 md:grid-cols-2 xl:grid-cols-4 text-sm text-muted">
              <div class="space-y-1">
                <p class="text-xs">
                  简历版本
                </p>
                <p class="text-default">
                  {{ release.resumeVersionId }}
                </p>
              </div>
              <div class="space-y-1">
                <p class="text-xs">
                  项目版本数
                </p>
                <p class="text-default">
                  {{ release.projectVersionIds.length }}
                </p>
              </div>
              <div class="space-y-1">
                <p class="text-xs">
                  文案版本数
                </p>
                <p class="text-default">
                  {{ release.translationVersionIds.length }}
                </p>
              </div>
              <div class="space-y-1">
                <p class="text-xs">
                  最近更新时间
                </p>
                <p class="text-default">
                  {{ formatDateTime(release.updatedAt) }}
                </p>
              </div>
            </div>

            <USeparator class="my-4" />

            <div class="grid gap-4 md:grid-cols-2 xl:grid-cols-4 text-sm text-muted">
              <p>创建人：{{ release.createdBy?.name || '暂无' }}</p>
              <p>激活人：{{ release.activatedBy?.name || '暂无' }}</p>
              <p>创建时间：{{ formatDateTime(release.createdAt) }}</p>
              <p>激活时间：{{ formatDateTime(release.activatedAt) }}</p>
            </div>
          </UCard>
        </div>
      </div>
    </template>
  </UContainer>
</template>
