<script setup lang="ts">
import type { PublishStatus, TranslationNamespace, TranslationRecord, TranslationVersionRecord, WebLocale } from '@repo/types'

const { getStatusColor, getStatusLabel, getSelectableStatusOptions, getPrimaryTransitionAction, getActorLabel, getPublishedAtLabel, getVersionChangeTypeLabel } = useContentWorkflow()
const { formatDateTime } = useDateTimeFormatter()

definePageMeta({
  middleware: 'auth'
})

const toast = useToast()
const { hasPermission } = usePermissions()

if (!hasPermission('translation.read')) {
  await navigateTo('/unauthorized')
}

const apiClient = usePlatformApiClient()

const { data, pending, error, refresh } = await useAsyncData('admin-translations-api', async () => {
  return await apiClient.listTranslations()
})

const canWriteTranslations = hasPermission('translation.write')
const namespaceOptions: Array<{ label: string, value: 'all' | TranslationNamespace }> = [
  { label: '全部命名空间', value: 'all' },
  { label: 'common', value: 'common' },
  { label: 'resume', value: 'resume' },
  { label: 'project', value: 'project' },
  { label: 'seo', value: 'seo' }
]
const localeOptions: Array<{ label: string, value: 'all' | WebLocale }> = [
  { label: '全部语言', value: 'all' },
  { label: 'zh-CN', value: 'zh-CN' },
  { label: 'en-US', value: 'en-US' }
]
const statusOptions: Array<{ label: string, value: 'all' | PublishStatus }> = [
  { label: '全部状态', value: 'all' },
  { label: '草稿', value: 'draft' },
  { label: '审核中', value: 'reviewing' },
  { label: '已发布', value: 'published' },
  { label: '已归档', value: 'archived' }
]

const {
  translations,
  filteredTranslations,
  keyword,
  selectedNamespace,
  selectedLocale,
  selectedStatus,
  stats,
  localeCoverage,
  isEditorOpen,
  editingId,
  form,
  replaceTranslations,
  openEditor,
  closeEditor,
  buildTranslationInput,
  upsertTranslation
} = useTranslationManagement(data.value)

watch(data, (value) => {
  if (value) {
    replaceTranslations(value)
  }
}, { immediate: true })

const editingRecord = computed(() => {
  return translations.value.find(record => record.id === editingId.value) ?? null
})

const editorStatusOptions = computed(() => {
  return getSelectableStatusOptions(editingRecord.value?.status ?? form.status)
})

const expandedVersionId = ref<string | null>(null)
const translationVersions = ref<Record<string, TranslationVersionRecord[]>>({})
const translationVersionsPending = ref<Record<string, boolean>>({})

async function toggleTranslationVersions(translationId: string) {
  if (expandedVersionId.value === translationId) {
    expandedVersionId.value = null
    return
  }

  expandedVersionId.value = translationId

  if (translationVersions.value[translationId]) {
    return
  }

  translationVersionsPending.value = { ...translationVersionsPending.value, [translationId]: true }

  try {
    translationVersions.value = {
      ...translationVersions.value,
      [translationId]: await apiClient.listTranslationVersions(translationId)
    }
  } finally {
    translationVersionsPending.value = { ...translationVersionsPending.value, [translationId]: false }
  }
}

async function handleRestoreTranslationVersion(record: TranslationRecord, versionId: string) {
  try {
    const restored = await apiClient.restoreTranslationVersion(record.id, versionId)
    upsertTranslation(restored)
    await refresh()
    translationVersions.value = {
      ...translationVersions.value,
      [record.id]: await apiClient.listTranslationVersions(record.id)
    }
    toast.add({
      title: '文案版本已恢复',
      description: `${record.key} 已恢复到所选历史版本。`,
      color: 'success'
    })
  } catch (restoreError) {
    const message = restoreError instanceof Error ? restoreError.message : '恢复失败，请稍后重试。'
    toast.add({
      title: '恢复失败',
      description: message,
      color: 'error'
    })
  }
}

async function handleSaveTranslation() {
  try {
    if (!editingId.value) {
      return
    }

    const payload = buildTranslationInput()
    const saved = await apiClient.updateTranslation(editingId.value, payload)
    upsertTranslation(saved)
    await refresh()
    translationVersions.value = {
      ...translationVersions.value,
      [editingId.value]: await apiClient.listTranslationVersions(editingId.value)
    }
    closeEditor()
    toast.add({
      title: '文案已保存',
      description: '当前翻译项内容和状态已同步到真实数据层。',
      color: 'success'
    })
  } catch (saveError) {
    const message = saveError instanceof Error ? saveError.message : '保存失败，请稍后重试。'
    toast.add({
      title: '保存失败',
      description: message,
      color: 'error'
    })
  }
}

async function handlePrimaryTransition(record: TranslationRecord) {
  const action = getPrimaryTransitionAction(record.status)

  if (!action) {
    return
  }

  try {
    const saved = await apiClient.updateTranslation(record.id, {
      namespace: record.namespace,
      key: record.key,
      locale: record.locale as WebLocale,
      value: record.value,
      status: action.to
    })
    upsertTranslation(saved)
    await refresh()
    translationVersions.value = {
      ...translationVersions.value,
      [record.id]: await apiClient.listTranslationVersions(record.id)
    }
    toast.add({
      title: '状态已更新',
      description: `${record.key} 已进入${getStatusLabel(action.to)}。`,
      color: 'success'
    })
  } catch (saveError) {
    const message = saveError instanceof Error ? saveError.message : '状态更新失败，请稍后重试。'
    toast.add({
      title: '状态更新失败',
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
          正在加载翻译列表…
        </p>
      </UCard>
    </template>

    <template v-else-if="error || !data">
      <UAlert title="文案列表加载失败" description="请检查 P3 文案模块 API 接入。" color="error" variant="subtle" />
    </template>

    <template v-else>
      <div class="space-y-6">
        <div class="space-y-2">
          <UBadge label="P3 i18n 文案迁移" variant="subtle" color="primary" class="w-fit" />
          <div class="space-y-1">
            <h1 class="text-2xl font-semibold text-highlighted">
              文案管理
            </h1>
            <p class="max-w-3xl text-sm text-muted">
              当前阶段已将后台文案模块切换到 API Server + SQLite + Drizzle ORM，文案查询、编辑和发布状态切换都会进入真实持久化链路。
            </p>
          </div>
        </div>

        <div class="grid gap-4 md:grid-cols-4">
          <UCard>
            <template #header>总文案数</template>
            <p class="text-2xl font-semibold text-highlighted">{{ stats.total }}</p>
          </UCard>
          <UCard>
            <template #header>缺失项</template>
            <p class="text-2xl font-semibold text-highlighted">{{ stats.missing }}</p>
          </UCard>
          <UCard>
            <template #header>草稿</template>
            <p class="text-2xl font-semibold text-highlighted">{{ stats.draft }}</p>
          </UCard>
          <UCard>
            <template #header>已发布</template>
            <p class="text-2xl font-semibold text-highlighted">{{ stats.published }}</p>
          </UCard>
        </div>

        <UCard>
          <template #header>
            <div class="space-y-1">
              <h2 class="text-base font-semibold text-highlighted">
                查询与筛选
              </h2>
              <p class="text-sm text-muted">
                当前列表已经由真实 API 驱动，用于验证 namespace、locale 和状态三个核心筛选维度。
              </p>
            </div>
          </template>

          <div class="grid gap-4 lg:grid-cols-[2fr_1fr_1fr_1fr]">
            <UFormField label="关键字搜索">
              <UInput v-model="keyword" icon="i-lucide-search" placeholder="按 key 或 value 搜索" />
            </UFormField>

            <UFormField label="命名空间">
              <select v-model="selectedNamespace" class="w-full rounded-md border border-default bg-default px-3 py-2 text-sm text-default">
                <option v-for="option in namespaceOptions" :key="option.value" :value="option.value">
                  {{ option.label }}
                </option>
              </select>
            </UFormField>

            <UFormField label="语言">
              <select v-model="selectedLocale" class="w-full rounded-md border border-default bg-default px-3 py-2 text-sm text-default">
                <option v-for="option in localeOptions" :key="option.value" :value="option.value">
                  {{ option.label }}
                </option>
              </select>
            </UFormField>

            <UFormField label="状态">
              <select v-model="selectedStatus" class="w-full rounded-md border border-default bg-default px-3 py-2 text-sm text-default">
                <option v-for="option in statusOptions" :key="option.value" :value="option.value">
                  {{ option.label }}
                </option>
              </select>
            </UFormField>
          </div>
        </UCard>

        <UCard>
          <template #header>
            <div class="space-y-1">
              <h2 class="text-base font-semibold text-highlighted">
                语言覆盖率
              </h2>
              <p class="text-sm text-muted">
                用于快速识别每种语言当前的缺失翻译数量。
              </p>
            </div>
          </template>

          <div class="grid gap-4 md:grid-cols-2">
            <UCard v-for="coverage in localeCoverage" :key="coverage.locale">
              <template #header>
                <div class="flex items-center justify-between gap-3">
                  <h3 class="text-base font-semibold text-highlighted">
                    {{ coverage.locale }}
                  </h3>
                  <UBadge :label="coverage.missing ? `缺失 ${coverage.missing}` : '已覆盖'" :color="coverage.missing ? 'warning' : 'success'" variant="subtle" />
                </div>
              </template>

              <p class="text-sm text-muted">
                共 {{ coverage.total }} 条翻译记录。
              </p>
            </UCard>
          </div>
        </UCard>

        <div class="grid gap-4">
          <UCard v-for="record in filteredTranslations" :key="record.id">
            <template #header>
              <div class="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                <div class="space-y-1">
                  <div class="flex flex-wrap items-center gap-2">
                    <h2 class="text-base font-semibold text-highlighted">
                      {{ record.key }}
                    </h2>
                    <UBadge :label="record.namespace" color="neutral" variant="subtle" />
                    <UBadge :label="record.locale" color="neutral" variant="subtle" />
                    <UBadge :label="getStatusLabel(record.status)" :color="getStatusColor(record.status)" variant="subtle" />
                    <UBadge v-if="record.missing" label="缺失" color="error" variant="subtle" />
                  </div>
                  <p class="text-xs text-muted">
                    更新时间：{{ formatDateTime(record.updatedAt) }}
                  </p>
                  <p class="text-xs text-muted">
                    更新人：{{ getActorLabel(record.updatedBy) }}
                  </p>
                  <p class="text-xs text-muted">
                    审核人：{{ getActorLabel(record.reviewedBy) }} · 发布时间：{{ getPublishedAtLabel(record.publishedAt) }}
                  </p>
                </div>

                <div class="flex flex-wrap gap-2">
                  <UButton label="查看版本" color="neutral" variant="subtle" @click="toggleTranslationVersions(record.id)" />
                  <template v-if="canWriteTranslations">
                    <UButton label="编辑文案" color="neutral" variant="subtle" @click="openEditor(record)" />
                    <UButton
                      v-if="getPrimaryTransitionAction(record.status)"
                      :label="getPrimaryTransitionAction(record.status)?.label"
                      color="neutral"
                      variant="subtle"
                      @click="handlePrimaryTransition(record)"
                    />
                  </template>
                </div>
              </div>
            </template>

            <div class="space-y-3">
              <div class="space-y-2">
                <p class="text-sm font-medium text-default">
                  当前文案
                </p>
                <p class="rounded-md border border-default bg-elevated/40 px-3 py-3 text-sm text-muted">
                  {{ record.value || '当前语言暂无文案，等待补充。' }}
                </p>
              </div>

              <div v-if="expandedVersionId === record.id" class="space-y-3 rounded-md border border-default bg-elevated/20 p-4">
                <p class="text-sm font-medium text-default">版本历史</p>

                <p v-if="translationVersionsPending[record.id]" class="text-sm text-muted">
                  正在加载文案版本…
                </p>

                <div v-else class="space-y-3">
                  <UCard v-for="version in translationVersions[record.id] ?? []" :key="version.id">
                    <template #header>
                      <div class="flex flex-wrap items-center gap-2">
                        <UBadge :label="`版本 v${version.version}`" color="primary" variant="subtle" />
                        <UBadge :label="getStatusLabel(version.status)" :color="getStatusColor(version.status)" variant="subtle" />
                        <UBadge :label="getVersionChangeTypeLabel(version.changeType)" color="neutral" variant="subtle" />
                      </div>
                    </template>

                    <div class="space-y-3 text-sm text-muted">
                      <div class="space-y-1">
                        <p>创建人：{{ getActorLabel(version.createdBy) }}</p>
                        <p>创建时间：{{ formatDateTime(version.createdAt) }}</p>
                        <p>版本文案：{{ version.snapshot.value || '暂无' }}</p>
                      </div>

                      <div v-if="canWriteTranslations" class="flex justify-end">
                        <UButton label="恢复此版本" color="warning" variant="subtle" @click="handleRestoreTranslationVersion(record, version.id)" />
                      </div>
                    </div>
                  </UCard>
                </div>
              </div>
            </div>
          </UCard>
        </div>

        <UCard v-if="isEditorOpen && canWriteTranslations">
          <template #header>
            <div class="space-y-1">
              <h2 class="text-base font-semibold text-highlighted">
                编辑文案
              </h2>
              <p class="text-sm text-muted">
                当前阶段先验证真实数据编辑流程，后续可替换为侧边抽屉或更完整的表单编辑器。
              </p>
            </div>
          </template>

          <div class="space-y-4">
            <UFormField label="文案内容">
              <UTextarea v-model="form.value" :rows="5" placeholder="请输入翻译内容" />
            </UFormField>

            <UFormField label="发布状态">
              <select v-model="form.status" class="w-full rounded-md border border-default bg-default px-3 py-2 text-sm text-default">
                <option v-for="option in editorStatusOptions" :key="option.value" :value="option.value">
                  {{ option.label }}
                </option>
              </select>
            </UFormField>
          </div>

          <template #footer>
            <div class="flex gap-3">
              <UButton label="保存文案" @click="handleSaveTranslation" />
              <UButton label="取消" color="neutral" variant="subtle" @click="closeEditor" />
            </div>
          </template>
        </UCard>
      </div>
    </template>
  </UContainer>
</template>
