<script setup lang="ts">
import type { PublishStatus, ResumeVersionRecord } from '@repo/types'

const { getStatusColor, getStatusLabel, getSelectableStatusOptions, getActorLabel, getPublishedAtLabel, getVersionChangeTypeLabel } = useContentWorkflow()
const { formatDateTime } = useDateTimeFormatter()
const { getResumeVersionInsights } = useContentVersionInsights()

definePageMeta({
  middleware: 'auth'
})

const toast = useToast()
const { hasPermission } = usePermissions()

if (!hasPermission('resume.read')) {
  await navigateTo('/unauthorized')
}

const apiClient = usePlatformApiClient()

const { data, pending, error, refresh } = await useAsyncData('admin-resume-api', async () => {
  return await apiClient.getResumeDocument()
})

const { data: versionData, pending: versionsPending, refresh: refreshVersions } = await useAsyncData('admin-resume-versions', async () => {
  return await apiClient.listResumeVersions()
})

const resumeVersions = computed<ResumeVersionRecord[]>(() => versionData.value ?? [])

const canWriteResume = hasPermission('resume.write')

const {
  resumeDocument,
  selectedLocale,
  localeOptions,
  currentLocaleContent,
  stats,
  localeCoverage,
  setPublishStatus,
  addEducation,
  removeEducation,
  addExperience,
  removeExperience,
  addSkillGroup,
  removeSkillGroup,
  setSkillGroupItems,
  addContact,
  removeContact,
  replaceResumeDocument,
  buildResumeDocument
} = useResumeManagement(data.value)

watch(data, (value) => {
  if (value) {
    replaceResumeDocument(value)
  }
}, { immediate: true })

const resumeStatusOptions = computed(() => {
  return getSelectableStatusOptions(resumeDocument.value.status)
})

async function handleSaveResume() {
  try {
    const saved = await apiClient.updateResumeDocument(buildResumeDocument())
    replaceResumeDocument(saved)
    await Promise.all([refresh(), refreshVersions()])
    toast.add({
      title: '简历内容已保存',
      description: `${selectedLocale.value} 的简历内容已同步到真实数据层。`,
      color: 'success'
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : '保存失败，请稍后重试。'
    toast.add({
      title: '保存失败',
      description: message,
      color: 'error'
    })
  }
}

async function handlePublishStatusChange(status: PublishStatus) {
  const previousStatus = resumeDocument.value.status
  setPublishStatus(status)

  try {
    const saved = await apiClient.updateResumeDocument(buildResumeDocument())
    replaceResumeDocument(saved)
    await Promise.all([refresh(), refreshVersions()])
    toast.add({
      title: '发布状态已更新',
      description: `当前简历状态已切换为${getStatusLabel(status)}。`,
      color: 'success'
    })
  } catch (saveError) {
    setPublishStatus(previousStatus)
    const message = saveError instanceof Error ? saveError.message : '状态更新失败，请稍后重试。'
    toast.add({
      title: '状态更新失败',
      description: message,
      color: 'error'
    })
  }
}

async function handleRestoreResumeVersion(versionId: string) {
  try {
    const restored = await apiClient.restoreResumeVersion(versionId)
    replaceResumeDocument(restored)
    await Promise.all([refresh(), refreshVersions()])
    toast.add({
      title: '简历版本已恢复',
      description: '当前简历已恢复到所选历史版本。',
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
</script>

<template>
  <UContainer class="py-10">
    <template v-if="pending">
      <UCard>
        <p class="text-sm text-muted">
          正在加载简历文档…
        </p>
      </UCard>
    </template>

    <template v-else-if="error || !data">
      <UAlert
        title="简历文档加载失败"
        description="请检查 P3 简历模块 API 接入。"
        color="error"
        variant="subtle"
      />
    </template>

    <template v-else>
      <div class="space-y-6">
        <div class="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div class="space-y-2">
            <UBadge
              label="P3 简历管理迁移"
              variant="subtle"
              color="primary"
              class="w-fit"
            />
            <div class="space-y-1">
              <h1 class="text-2xl font-semibold text-highlighted">
                简历管理
              </h1>
              <p class="max-w-3xl text-sm text-muted">
                当前阶段已切换为通过 API Server 维护简历文档，基础信息、多语言内容、发布状态和结构化条目都会进入真实持久化链路。
              </p>
            </div>
          </div>

          <div class="flex flex-wrap items-center gap-3">
            <UBadge
              :label="getStatusLabel(resumeDocument.status)"
              :color="getStatusColor(resumeDocument.status)"
              variant="subtle"
            />
            <UButton
              v-if="canWriteResume"
              label="保存当前语言内容"
              icon="i-lucide-save"
              @click="handleSaveResume"
            />
          </div>
        </div>

        <div class="grid gap-4 md:grid-cols-5">
          <UCard>
            <template #header>
              语言数
            </template>
            <p class="text-2xl font-semibold text-highlighted">
              {{ stats.localeCount }}
            </p>
          </UCard>
          <UCard>
            <template #header>
              教育经历
            </template>
            <p class="text-2xl font-semibold text-highlighted">
              {{ stats.educationCount }}
            </p>
          </UCard>
          <UCard>
            <template #header>
              工作经历
            </template>
            <p class="text-2xl font-semibold text-highlighted">
              {{ stats.experienceCount }}
            </p>
          </UCard>
          <UCard>
            <template #header>
              技能分组
            </template>
            <p class="text-2xl font-semibold text-highlighted">
              {{ stats.skillGroupCount }}
            </p>
          </UCard>
          <UCard>
            <template #header>
              联系方式
            </template>
            <p class="text-2xl font-semibold text-highlighted">
              {{ stats.contactCount }}
            </p>
          </UCard>
        </div>

        <UCard>
          <template #header>
            <div class="space-y-1">
              <h2 class="text-base font-semibold text-highlighted">
                多语言与发布状态
              </h2>
              <p class="text-sm text-muted">
                当前阶段先采用统一简历文档 + locale 切换的方式维护多语言内容，后续可继续接入版本管理与审核流。
              </p>
            </div>
          </template>

          <div class="grid gap-4 lg:grid-cols-[1fr_1fr_1.2fr]">
            <UFormField label="编辑语言">
              <select
                v-model="selectedLocale"
                class="w-full rounded-md border border-default bg-default px-3 py-2 text-sm text-default"
              >
                <option
                  v-for="option in localeOptions"
                  :key="option.value"
                  :value="option.value"
                >
                  {{ option.label }}
                </option>
              </select>
            </UFormField>

            <UFormField label="发布状态">
              <select
                :value="resumeDocument.status"
                class="w-full rounded-md border border-default bg-default px-3 py-2 text-sm text-default"
                @change="handlePublishStatusChange(($event.target as HTMLSelectElement).value as PublishStatus)"
              >
                <option
                  v-for="option in resumeStatusOptions"
                  :key="option.value"
                  :value="option.value"
                >
                  {{ option.label }}
                </option>
              </select>
            </UFormField>

            <div class="grid gap-4 xl:grid-cols-[1.2fr_1fr]">
              <div class="grid gap-2 md:grid-cols-2">
                <UCard
                  v-for="coverage in localeCoverage"
                  :key="coverage.locale"
                >
                  <template #header>
                    <div class="flex items-center justify-between gap-2">
                      <p class="font-medium text-default">
                        {{ coverage.locale }}
                      </p>
                      <UBadge
                        :label="`${coverage.missingFields} 个缺失项`"
                        :color="coverage.missingFields === 0 ? 'success' : 'warning'"
                        variant="subtle"
                      />
                    </div>
                  </template>

                  <div class="space-y-1 text-sm text-muted">
                    <p>教育经历：{{ coverage.educationCount }}</p>
                    <p>工作经历：{{ coverage.experienceCount }}</p>
                    <p>技能分组：{{ coverage.skillGroupCount }}</p>
                    <p>联系方式：{{ coverage.contactCount }}</p>
                  </div>
                </UCard>
              </div>

              <UCard>
                <template #header>
                  <div class="space-y-1">
                    <h3 class="text-base font-semibold text-highlighted">
                      审计信息
                    </h3>
                    <p class="text-sm text-muted">
                      用于追踪最近更新人、审核人与发布时间。
                    </p>
                  </div>
                </template>

                <div class="space-y-2 text-sm text-muted">
                  <p>最近更新人：{{ getActorLabel(resumeDocument.updatedBy) }}</p>
                  <p>审核人：{{ getActorLabel(resumeDocument.reviewedBy) }}</p>
                  <p>发布时间：{{ getPublishedAtLabel(resumeDocument.publishedAt) }}</p>
                  <p>最后更新时间：{{ formatDateTime(resumeDocument.updatedAt) }}</p>
                </div>
              </UCard>
            </div>
          </div>
        </UCard>

        <UCard>
          <template #header>
            <div class="space-y-1">
              <h2 class="text-base font-semibold text-highlighted">
                版本历史
              </h2>
              <p class="text-sm text-muted">
                当前展示简历文档的历史快照，用于支撑后续回滚与审计能力。
              </p>
            </div>
          </template>

          <div
            v-if="versionsPending"
            class="text-sm text-muted"
          >
            正在加载版本历史…
          </div>

          <div
            v-else
            class="space-y-3"
          >
            <UCard
              v-for="version in resumeVersions"
              :key="version.id"
            >
              <template #header>
                <div class="flex flex-wrap items-center gap-2">
                  <UBadge
                    :label="`版本 v${version.version}`"
                    color="primary"
                    variant="subtle"
                  />
                  <UBadge
                    :label="getStatusLabel(version.status)"
                    :color="getStatusColor(version.status)"
                    variant="subtle"
                  />
                  <UBadge
                    :label="getVersionChangeTypeLabel(version.changeType)"
                    color="neutral"
                    variant="subtle"
                  />
                </div>
              </template>

              <div class="space-y-3 text-sm text-muted">
                <div class="flex flex-wrap items-center gap-2">
                  <UBadge
                    :label="getResumeVersionInsights(version, resumeDocument, selectedLocale).changeLabel"
                    :color="getResumeVersionInsights(version, resumeDocument, selectedLocale).changeColor"
                    variant="subtle"
                  />
                  <UBadge
                    v-for="highlight in getResumeVersionInsights(version, resumeDocument, selectedLocale).highlights"
                    :key="highlight"
                    :label="highlight"
                    color="warning"
                    variant="subtle"
                  />
                </div>

                <div class="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
                  <div
                    v-for="item in getResumeVersionInsights(version, resumeDocument, selectedLocale).summaryItems"
                    :key="item.label"
                    class="rounded-md border border-default bg-elevated/30 p-3"
                  >
                    <p class="text-xs text-muted">
                      {{ item.label }}
                    </p>
                    <p class="font-medium text-default">
                      {{ item.value }}
                    </p>
                    <p class="text-xs text-muted">
                      {{ item.hint }}
                    </p>
                  </div>
                </div>

                <div class="space-y-1">
                  <p>创建人：{{ getActorLabel(version.createdBy) }}</p>
                  <p>创建时间：{{ formatDateTime(version.createdAt) }}</p>
                  <p>历史标题（{{ selectedLocale }}）：{{ version.snapshot.locales[selectedLocale]?.baseInfo.headline || '暂无' }}</p>
                  <p>当前标题（{{ selectedLocale }}）：{{ resumeDocument.locales[selectedLocale]?.baseInfo.headline || '暂无' }}</p>
                </div>

                <div
                  v-if="canWriteResume"
                  class="flex justify-end"
                >
                  <UButton
                    label="恢复此版本"
                    color="warning"
                    variant="subtle"
                    @click="handleRestoreResumeVersion(version.id)"
                  />
                </div>
              </div>
            </UCard>
          </div>
        </UCard>

        <UCard>
          <template #header>
            <div class="space-y-1">
              <h2 class="text-base font-semibold text-highlighted">
                基础信息
              </h2>
              <p class="text-sm text-muted">
                用于维护简历页顶部的个人身份、岗位方向和简介内容。
              </p>
            </div>
          </template>

          <div class="grid gap-4 md:grid-cols-2">
            <UFormField label="姓名">
              <UInput
                v-model="currentLocaleContent.baseInfo.fullName"
                :disabled="!canWriteResume"
                placeholder="请输入姓名"
              />
            </UFormField>

            <UFormField label="岗位标题">
              <UInput
                v-model="currentLocaleContent.baseInfo.headline"
                :disabled="!canWriteResume"
                placeholder="请输入岗位标题"
              />
            </UFormField>

            <UFormField label="所在地区">
              <UInput
                v-model="currentLocaleContent.baseInfo.location"
                :disabled="!canWriteResume"
                placeholder="请输入地区"
              />
            </UFormField>

            <div />

            <UFormField
              label="个人简介"
              class="md:col-span-2"
            >
              <UTextarea
                v-model="currentLocaleContent.baseInfo.summary"
                :disabled="!canWriteResume"
                :rows="4"
                placeholder="请输入简历简介"
              />
            </UFormField>
          </div>
        </UCard>

        <UCard>
          <template #header>
            <div class="flex items-center justify-between gap-3">
              <div class="space-y-1">
                <h2 class="text-base font-semibold text-highlighted">
                  教育经历
                </h2>
                <p class="text-sm text-muted">
                  维护学校、学历、时间范围与教育摘要。
                </p>
              </div>

              <UButton
                v-if="canWriteResume"
                label="新增教育经历"
                color="neutral"
                variant="subtle"
                @click="addEducation"
              />
            </div>
          </template>

          <div class="space-y-4">
            <UCard
              v-for="item in currentLocaleContent.education"
              :key="item.id"
            >
              <div class="grid gap-4 md:grid-cols-2">
                <UFormField label="学校">
                  <UInput
                    v-model="item.school"
                    :disabled="!canWriteResume"
                    placeholder="请输入学校"
                  />
                </UFormField>
                <UFormField label="学历/专业">
                  <UInput
                    v-model="item.degree"
                    :disabled="!canWriteResume"
                    placeholder="请输入学历或专业"
                  />
                </UFormField>
                <UFormField label="时间范围">
                  <UInput
                    v-model="item.period"
                    :disabled="!canWriteResume"
                    placeholder="例如 2016 - 2020"
                  />
                </UFormField>
                <div />
                <UFormField
                  label="摘要"
                  class="md:col-span-2"
                >
                  <UTextarea
                    v-model="item.summary"
                    :disabled="!canWriteResume"
                    :rows="3"
                    placeholder="请输入教育摘要"
                  />
                </UFormField>
              </div>

              <template #footer>
                <div class="flex justify-end">
                  <UButton
                    v-if="canWriteResume"
                    label="删除"
                    color="error"
                    variant="subtle"
                    @click="removeEducation(item.id)"
                  />
                </div>
              </template>
            </UCard>
          </div>
        </UCard>

        <UCard>
          <template #header>
            <div class="flex items-center justify-between gap-3">
              <div class="space-y-1">
                <h2 class="text-base font-semibold text-highlighted">
                  工作经历
                </h2>
                <p class="text-sm text-muted">
                  维护公司、职位、时间范围与工作摘要。
                </p>
              </div>

              <UButton
                v-if="canWriteResume"
                label="新增工作经历"
                color="neutral"
                variant="subtle"
                @click="addExperience"
              />
            </div>
          </template>

          <div class="space-y-4">
            <UCard
              v-for="item in currentLocaleContent.experiences"
              :key="item.id"
            >
              <div class="grid gap-4 md:grid-cols-2">
                <UFormField label="公司">
                  <UInput
                    v-model="item.company"
                    :disabled="!canWriteResume"
                    placeholder="请输入公司名称"
                  />
                </UFormField>
                <UFormField label="职位">
                  <UInput
                    v-model="item.role"
                    :disabled="!canWriteResume"
                    placeholder="请输入职位"
                  />
                </UFormField>
                <UFormField label="时间范围">
                  <UInput
                    v-model="item.period"
                    :disabled="!canWriteResume"
                    placeholder="例如 2020 - 至今"
                  />
                </UFormField>
                <div />
                <UFormField
                  label="摘要"
                  class="md:col-span-2"
                >
                  <UTextarea
                    v-model="item.summary"
                    :disabled="!canWriteResume"
                    :rows="3"
                    placeholder="请输入工作摘要"
                  />
                </UFormField>
              </div>

              <template #footer>
                <div class="flex justify-end">
                  <UButton
                    v-if="canWriteResume"
                    label="删除"
                    color="error"
                    variant="subtle"
                    @click="removeExperience(item.id)"
                  />
                </div>
              </template>
            </UCard>
          </div>
        </UCard>

        <div class="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
          <UCard>
            <template #header>
              <div class="flex items-center justify-between gap-3">
                <div class="space-y-1">
                  <h2 class="text-base font-semibold text-highlighted">
                    技能分组
                  </h2>
                  <p class="text-sm text-muted">
                    维护技能标题和技能项，技能项使用每行一条的形式输入。
                  </p>
                </div>

                <UButton
                  v-if="canWriteResume"
                  label="新增技能分组"
                  color="neutral"
                  variant="subtle"
                  @click="addSkillGroup"
                />
              </div>
            </template>

            <div class="space-y-4">
              <UCard
                v-for="group in currentLocaleContent.skillGroups"
                :key="group.id"
              >
                <div class="space-y-4">
                  <UFormField label="分组标题">
                    <UInput
                      v-model="group.title"
                      :disabled="!canWriteResume"
                      placeholder="例如 核心技术"
                    />
                  </UFormField>

                  <UFormField label="技能项（每行一条）">
                    <UTextarea
                      :model-value="group.items.join('\n')"
                      :disabled="!canWriteResume"
                      :rows="5"
                      placeholder="Vue 3\nNuxt 4\nTypeScript"
                      @update:model-value="setSkillGroupItems(group.id, String($event))"
                    />
                  </UFormField>
                </div>

                <template #footer>
                  <div class="flex justify-end">
                    <UButton
                      v-if="canWriteResume"
                      label="删除分组"
                      color="error"
                      variant="subtle"
                      @click="removeSkillGroup(group.id)"
                    />
                  </div>
                </template>
              </UCard>
            </div>
          </UCard>

          <UCard>
            <template #header>
              <div class="flex items-center justify-between gap-3">
                <div class="space-y-1">
                  <h2 class="text-base font-semibold text-highlighted">
                    联系方式
                  </h2>
                  <p class="text-sm text-muted">
                    维护邮箱、社交链接和其他公开联系入口。
                  </p>
                </div>

                <UButton
                  v-if="canWriteResume"
                  label="新增联系方式"
                  color="neutral"
                  variant="subtle"
                  @click="addContact"
                />
              </div>
            </template>

            <div class="space-y-4">
              <UCard
                v-for="item in currentLocaleContent.contacts"
                :key="item.id"
              >
                <div class="space-y-4">
                  <UFormField label="标签">
                    <UInput
                      v-model="item.label"
                      :disabled="!canWriteResume"
                      placeholder="例如 邮箱"
                    />
                  </UFormField>
                  <UFormField label="展示值">
                    <UInput
                      v-model="item.value"
                      :disabled="!canWriteResume"
                      placeholder="请输入展示值"
                    />
                  </UFormField>
                  <UFormField label="链接">
                    <UInput
                      v-model="item.href"
                      :disabled="!canWriteResume"
                      placeholder="例如 https://github.com/..."
                    />
                  </UFormField>
                </div>

                <template #footer>
                  <div class="flex justify-end">
                    <UButton
                      v-if="canWriteResume"
                      label="删除"
                      color="error"
                      variant="subtle"
                      @click="removeContact(item.id)"
                    />
                  </div>
                </template>
              </UCard>
            </div>
          </UCard>
        </div>
      </div>
    </template>
  </UContainer>
</template>
