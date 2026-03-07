<script setup lang="ts">
import type { PublishStatus, TranslationNamespace, TranslationRecord } from '@repo/types'

definePageMeta({
  middleware: 'auth'
})

const toast = useToast()
const { hasPermission } = usePermissions()

if (!hasPermission('translation.read')) {
  await navigateTo('/unauthorized')
}

const canWriteTranslations = hasPermission('translation.write')
const namespaceOptions: Array<{ label: string, value: 'all' | TranslationNamespace }> = [
  { label: '全部命名空间', value: 'all' },
  { label: 'common', value: 'common' },
  { label: 'resume', value: 'resume' },
  { label: 'project', value: 'project' },
  { label: 'seo', value: 'seo' }
]
const localeOptions = [
  { label: '全部语言', value: 'all' },
  { label: 'zh-CN', value: 'zh-CN' },
  { label: 'en-US', value: 'en-US' }
] as const
const statusOptions: Array<{ label: string, value: 'all' | PublishStatus }> = [
  { label: '全部状态', value: 'all' },
  { label: 'draft', value: 'draft' },
  { label: 'reviewing', value: 'reviewing' },
  { label: 'published', value: 'published' },
  { label: 'archived', value: 'archived' }
]

const {
  filteredTranslations,
  keyword,
  selectedNamespace,
  selectedLocale,
  selectedStatus,
  stats,
  localeCoverage,
  isEditorOpen,
  form,
  openEditor,
  closeEditor,
  saveTranslation,
  toggleStatus
} = useTranslationManagement()

function handleSaveTranslation() {
  saveTranslation()
  toast.add({
    title: '文案已保存',
    description: '当前翻译项内容和状态已更新。',
    color: 'success'
  })
}

function handleToggleStatus(record: TranslationRecord) {
  toggleStatus(record.id)
  toast.add({
    title: '状态已更新',
    description: `${record.key} 已切换发布状态。`,
    color: 'success'
  })
}
</script>

<template>
  <UContainer class="py-10">
    <div class="space-y-6">
      <div class="space-y-2">
        <UBadge label="A4 i18n 文案管理模块" variant="subtle" color="primary" class="w-fit" />
        <div class="space-y-1">
          <h1 class="text-2xl font-semibold text-highlighted">
            文案管理
          </h1>
          <p class="max-w-3xl text-sm text-muted">
            当前阶段已建立 namespace、locale、状态维度的文案管理页面，并支持缺失文案识别、状态切换和抽屉式编辑。
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
              文案管理页优先验证 namespace、locale 和状态这三个核心筛选维度。
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
                  <UBadge :label="record.status" :color="record.status === 'published' ? 'success' : 'warning'" variant="subtle" />
                  <UBadge v-if="record.missing" label="缺失" color="error" variant="subtle" />
                </div>
                <p class="text-xs text-muted">
                  更新时间：{{ new Date(record.updatedAt).toLocaleString() }}
                </p>
              </div>

              <div v-if="canWriteTranslations" class="flex flex-wrap gap-2">
                <UButton label="编辑文案" color="neutral" variant="subtle" @click="openEditor(record)" />
                <UButton
                  :label="record.status === 'published' ? '转为草稿' : '发布'"
                  color="neutral"
                  variant="subtle"
                  @click="handleToggleStatus(record)"
                />
              </div>
            </div>
          </template>

          <div class="space-y-2">
            <p class="text-sm font-medium text-default">
              当前文案
            </p>
            <p class="rounded-md border border-default bg-elevated/40 px-3 py-3 text-sm text-muted">
              {{ record.value || '当前语言暂无文案，等待补充。' }}
            </p>
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
              当前阶段先验证抽屉式编辑流程，后续可替换为侧边抽屉或弹窗表单。
            </p>
          </div>
        </template>

        <div class="space-y-4">
          <UFormField label="文案内容">
            <UTextarea v-model="form.value" :rows="5" placeholder="请输入翻译内容" />
          </UFormField>

          <UFormField label="发布状态">
            <select v-model="form.status" class="w-full rounded-md border border-default bg-default px-3 py-2 text-sm text-default">
              <option value="draft">draft</option>
              <option value="reviewing">reviewing</option>
              <option value="published">published</option>
              <option value="archived">archived</option>
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
  </UContainer>
</template>
