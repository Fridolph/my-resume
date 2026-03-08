<script setup lang="ts">
import type { ProjectRecord, ProjectVersionRecord, PublishStatus } from '@repo/types'

const { getStatusColor, getStatusLabel, getSelectableStatusOptions, getActorLabel, getPublishedAtLabel, getVersionChangeTypeLabel } = useContentWorkflow()
const { formatDateTime } = useDateTimeFormatter()
const { getProjectVersionInsights } = useContentVersionInsights()
const { createReadOnlyNotice, confirmOperation, getRestoreRestriction, getMoveRestriction } = useOperationGuidance()

definePageMeta({
  middleware: 'auth'
})

const toast = useToast()
const { hasPermission } = usePermissions()

if (!hasPermission('project.read')) {
  await navigateTo('/unauthorized')
}

const apiClient = usePlatformApiClient()

const { data, pending, error, refresh } = await useAsyncData('admin-projects-api', async () => {
  return await apiClient.listProjects()
})

const canWriteProjects = hasPermission('project.write')
const projectReadOnlyNotice = createReadOnlyNotice('项目模块')

const {
  projects,
  keyword,
  selectedLocale,
  selectedStatus,
  isEditorOpen,
  localeOptions,
  statusOptions,
  filteredProjects,
  stats,
  editorProject,
  editorLocaleContent,
  localeCoverage,
  selectProject,
  openCreateProject,
  closeEditor,
  replaceProjects,
  buildProjectInput,
  updateTags,
  setProjectStatus,
  moveProject,
  removeProjectLocally,
  upsertProject
} = useProjectManagement(data.value)

watch(data, (value) => {
  if (value) {
    replaceProjects(value)
  }
}, { immediate: true })

const projectStatusOptions = computed(() => {
  return editorProject.value ? getSelectableStatusOptions(editorProject.value.status) : []
})

const projectVersions = ref<ProjectVersionRecord[]>([])
const projectVersionsPending = ref(false)

function getProjectRestoreRestriction(version: ProjectVersionRecord) {
  if (!editorProject.value) {
    return getRestoreRestriction(false, '项目内容')
  }

  return getRestoreRestriction(getProjectVersionInsights(version, editorProject.value, selectedLocale.value).changed, '项目内容')
}

function getProjectMoveAction(projectId: string, direction: 'up' | 'down') {
  const orderedIds = [...projects.value]
    .sort((left, right) => left.sortOrder - right.sortOrder)
    .map(project => project.id)
  const index = orderedIds.indexOf(projectId)
  const isEdgeItem = direction === 'up' ? index <= 0 : index === orderedIds.length - 1

  return getMoveRestriction(isEdgeItem, direction)
}

async function loadProjectVersions(projectId: string) {
  projectVersionsPending.value = true

  try {
    projectVersions.value = await apiClient.listProjectVersions(projectId)
  } finally {
    projectVersionsPending.value = false
  }
}

watch(() => editorProject.value?.id, async (projectId) => {
  if (!projectId) {
    projectVersions.value = []
    return
  }

  await loadProjectVersions(projectId)
}, { immediate: true })

async function handleSaveProject() {
  try {
    const payload = buildProjectInput()
    const saved = payload.id.startsWith('project_') && !data.value?.some(project => project.id === payload.id)
      ? await apiClient.createProject({
          slug: payload.slug,
          status: payload.status,
          sortOrder: payload.sortOrder,
          cover: payload.cover,
          externalUrl: payload.externalUrl,
          tags: payload.tags,
          locales: payload.locales
        })
      : await apiClient.updateProject(payload.id, {
          slug: payload.slug,
          status: payload.status,
          sortOrder: payload.sortOrder,
          cover: payload.cover,
          externalUrl: payload.externalUrl,
          tags: payload.tags,
          locales: payload.locales
        })

    upsertProject(saved)
    await Promise.all([refresh(), loadProjectVersions(saved.id)])
    toast.add({
      title: '项目已保存',
      description: `${selectedLocale.value} 语言下的项目内容已同步到真实数据层。`,
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

async function handleStatusChange(status: PublishStatus) {
  if (!editorProject.value) {
    return
  }

  const confirmed = await confirmOperation({
    title: '确认切换项目状态？',
    description: `${editorProject.value.slug} 将从${getStatusLabel(editorProject.value.status)}切换为${getStatusLabel(status)}。`
  })

  if (!confirmed) {
    return
  }

  const previousStatus = editorProject.value?.status
  setProjectStatus(status)

  try {
    const payload = buildProjectInput()
    const saved = await apiClient.updateProject(payload.id, {
      slug: payload.slug,
      status: payload.status,
      sortOrder: payload.sortOrder,
      cover: payload.cover,
      externalUrl: payload.externalUrl,
      tags: payload.tags,
      locales: payload.locales
    })
    upsertProject(saved)
    await Promise.all([refresh(), loadProjectVersions(saved.id)])
    toast.add({
      title: '项目状态已更新',
      description: `当前项目状态已切换为${getStatusLabel(status)}。`,
      color: 'success'
    })
  } catch (saveError) {
    if (previousStatus) {
      setProjectStatus(previousStatus)
    }
    const message = saveError instanceof Error ? saveError.message : '状态更新失败，请稍后重试。'
    toast.add({
      title: '项目状态更新失败',
      description: message,
      color: 'error'
    })
  }
}

async function handleMove(project: ProjectRecord, direction: 'up' | 'down') {
  const restriction = getProjectMoveAction(project.id, direction)

  if (restriction.disabled) {
    return
  }

  const moved = moveProject(project.id, direction)

  if (!moved) {
    return
  }

  await apiClient.updateProject(moved.current.id, {
    slug: moved.current.slug,
    status: moved.current.status,
    sortOrder: moved.current.sortOrder,
    cover: moved.current.cover,
    externalUrl: moved.current.externalUrl,
    tags: moved.current.tags,
    locales: moved.current.locales
  })
  await apiClient.updateProject(moved.target.id, {
    slug: moved.target.slug,
    status: moved.target.status,
    sortOrder: moved.target.sortOrder,
    cover: moved.target.cover,
    externalUrl: moved.target.externalUrl,
    tags: moved.target.tags,
    locales: moved.target.locales
  })
  await refresh()

  if (editorProject.value?.id === moved.current.id || editorProject.value?.id === moved.target.id) {
    await loadProjectVersions(editorProject.value.id)
  }

  toast.add({
    title: '项目顺序已更新',
    description: `${project.slug} 已完成排序调整。`,
    color: 'success'
  })
}

async function handleRemoveProject(project: ProjectRecord) {
  const confirmed = await confirmOperation({
    title: '确认删除当前项目？',
    description: `${project.slug} 会从后台项目列表中移除，当前操作不可直接撤销。`
  })

  if (!confirmed) {
    return
  }

  await apiClient.deleteProject(project.id)
  removeProjectLocally(project.id)
  await refresh()
  toast.add({
    title: '项目已移除',
    description: `${project.slug} 已从本地项目列表中删除。`,
    color: 'success'
  })
}

async function handleRestoreProjectVersion(version: ProjectVersionRecord) {
  if (!editorProject.value) {
    return
  }

  const restriction = getProjectRestoreRestriction(version)

  if (restriction.disabled) {
    return
  }

  const confirmed = await confirmOperation({
    title: '确认恢复此项目版本？',
    description: `恢复后会使用版本 v${version.version} 覆盖当前项目 ${editorProject.value.slug}，并生成新的恢复版本记录。`
  })

  if (!confirmed) {
    return
  }

  try {
    const restored = await apiClient.restoreProjectVersion(editorProject.value.id, version.id)
    upsertProject(restored)
    await Promise.all([refresh(), loadProjectVersions(restored.id)])
    toast.add({
      title: '项目版本已恢复',
      description: `${restored.slug} 已恢复到所选历史版本。`,
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
          正在加载项目列表…
        </p>
      </UCard>
    </template>

    <template v-else-if="error || !data">
      <UAlert
        title="项目列表加载失败"
        description="请检查 P3 项目模块 API 接入。"
        color="error"
        variant="subtle"
      />
    </template>

    <template v-else>
      <div class="space-y-6">
        <UAlert
          v-if="!canWriteProjects"
          :title="projectReadOnlyNotice.title"
          :description="projectReadOnlyNotice.description"
          color="warning"
          variant="subtle"
        />

        <div class="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div class="space-y-2">
            <UBadge
              label="P3 项目管理迁移"
              variant="subtle"
              color="primary"
              class="w-fit"
            />
            <div class="space-y-1">
              <h1 class="text-2xl font-semibold text-highlighted">
                项目管理
              </h1>
              <p class="max-w-3xl text-sm text-muted">
                当前阶段已切换为通过 API Server 维护项目列表，项目编辑、排序、删除、标签、多语言说明和发布状态都会进入真实持久化链路。
              </p>
            </div>
          </div>

          <UButton
            v-if="canWriteProjects"
            label="新建项目"
            icon="i-lucide-folder-plus"
            @click="openCreateProject"
          />
        </div>

        <div class="grid gap-4 md:grid-cols-4">
          <UCard>
            <template #header>
              项目总数
            </template>
            <p class="text-2xl font-semibold text-highlighted">
              {{ stats.total }}
            </p>
          </UCard>
          <UCard>
            <template #header>
              已发布
            </template>
            <p class="text-2xl font-semibold text-highlighted">
              {{ stats.published }}
            </p>
          </UCard>
          <UCard>
            <template #header>
              审核中
            </template>
            <p class="text-2xl font-semibold text-highlighted">
              {{ stats.reviewing }}
            </p>
          </UCard>
          <UCard>
            <template #header>
              草稿
            </template>
            <p class="text-2xl font-semibold text-highlighted">
              {{ stats.draft }}
            </p>
          </UCard>
        </div>

        <UCard>
          <template #header>
            <div class="space-y-1">
              <h2 class="text-base font-semibold text-highlighted">
                查询、语言与状态
              </h2>
              <p class="text-sm text-muted">
                用于验证项目管理页面的列表筛选、多语言切换和状态控制边界。
              </p>
            </div>
          </template>

          <div class="grid gap-4 lg:grid-cols-[1.6fr_1fr_1fr]">
            <UFormField label="关键字搜索">
              <UInput
                v-model="keyword"
                placeholder="按 slug、标题、描述或标签搜索"
                icon="i-lucide-search"
              />
            </UFormField>

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

            <UFormField label="状态筛选">
              <select
                v-model="selectedStatus"
                class="w-full rounded-md border border-default bg-default px-3 py-2 text-sm text-default"
              >
                <option
                  v-for="option in statusOptions"
                  :key="option.value"
                  :value="option.value"
                >
                  {{ option.label }}
                </option>
              </select>
            </UFormField>
          </div>
        </UCard>

        <div class="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
          <div class="space-y-4">
            <UCard
              v-for="project in filteredProjects"
              :key="project.id"
            >
              <template #header>
                <div class="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                  <div class="space-y-1">
                    <div class="flex flex-wrap items-center gap-2">
                      <h2 class="text-base font-semibold text-highlighted">
                        {{ project.locales[selectedLocale].title }}
                      </h2>
                      <UBadge
                        :label="project.slug"
                        color="neutral"
                        variant="subtle"
                      />
                      <UBadge
                        :label="getStatusLabel(project.status)"
                        :color="getStatusColor(project.status)"
                        variant="subtle"
                      />
                      <UBadge
                        :label="`排序 #${project.sortOrder}`"
                        color="neutral"
                        variant="subtle"
                      />
                    </div>
                    <p class="text-sm text-muted">
                      {{ project.locales[selectedLocale].description }}
                    </p>
                    <p class="text-xs text-muted">
                      更新时间：{{ formatDateTime(project.updatedAt) }}
                    </p>
                    <p class="text-xs text-muted">
                      更新人：{{ getActorLabel(project.updatedBy) }}
                    </p>
                  </div>

                  <div
                    v-if="canWriteProjects"
                    class="space-y-2"
                  >
                    <div class="flex flex-wrap gap-2">
                      <UButton
                        label="上移"
                        color="neutral"
                        variant="subtle"
                        :disabled="getProjectMoveAction(project.id, 'up').disabled"
                        @click="handleMove(project, 'up')"
                      />
                      <UButton
                        label="下移"
                        color="neutral"
                        variant="subtle"
                        :disabled="getProjectMoveAction(project.id, 'down').disabled"
                        @click="handleMove(project, 'down')"
                      />
                      <UButton
                        label="编辑"
                        color="neutral"
                        variant="subtle"
                        @click="selectProject(project.id)"
                      />
                    </div>
                    <p class="text-xs text-muted">
                      {{ getProjectMoveAction(project.id, 'up').disabled ? getProjectMoveAction(project.id, 'up').reason : getProjectMoveAction(project.id, 'down').reason }}
                    </p>
                  </div>
                </div>
              </template>

              <div class="space-y-3">
                <div class="flex flex-wrap gap-2">
                  <UBadge
                    v-for="tag in project.tags"
                    :key="tag"
                    :label="tag"
                    color="neutral"
                    variant="subtle"
                  />
                </div>
                <p class="text-sm text-muted">
                  {{ project.locales[selectedLocale].summary }}
                </p>
              </div>
            </UCard>
          </div>

          <UCard>
            <template #header>
              <div class="space-y-1">
                <h2 class="text-base font-semibold text-highlighted">
                  多语言覆盖概览
                </h2>
                <p class="text-sm text-muted">
                  用于快速查看每个项目在不同语言下的字段完整度。
                </p>
              </div>
            </template>

            <div class="space-y-3">
              <UCard
                v-for="coverage in localeCoverage"
                :key="coverage.id"
              >
                <template #header>
                  <div class="space-y-1">
                    <p class="font-medium text-default">
                      {{ coverage.slug }}
                    </p>
                  </div>
                </template>

                <div class="space-y-2 text-sm text-muted">
                  <div
                    v-for="localeInfo in coverage.localeMap"
                    :key="`${coverage.id}-${localeInfo.locale}`"
                    class="flex items-center justify-between gap-3"
                  >
                    <span>{{ localeInfo.locale }}</span>
                    <UBadge
                      :label="`${localeInfo.missingFields} 个缺失字段`"
                      :color="localeInfo.missingFields === 0 ? 'success' : 'warning'"
                      variant="subtle"
                    />
                  </div>
                </div>
              </UCard>
            </div>
          </UCard>
        </div>

        <UCard v-if="isEditorOpen && editorProject && editorLocaleContent && canWriteProjects">
          <template #header>
            <div class="space-y-1">
              <h2 class="text-base font-semibold text-highlighted">
                编辑项目
              </h2>
              <p class="text-sm text-muted">
                当前阶段已使用真实项目管理 API 维护项目内容，后续可继续扩展为项目详情与公开查询接口。
              </p>
            </div>
          </template>

          <div class="grid gap-6 xl:grid-cols-[1fr_1fr]">
            <div class="space-y-4">
              <UFormField label="Slug">
                <UInput
                  v-model="editorProject.slug"
                  placeholder="请输入项目 slug"
                />
              </UFormField>

              <UFormField label="当前语言标题">
                <UInput
                  v-model="editorLocaleContent.title"
                  placeholder="请输入项目标题"
                />
              </UFormField>

              <UFormField label="当前语言描述">
                <UTextarea
                  v-model="editorLocaleContent.description"
                  :rows="3"
                  placeholder="请输入项目描述"
                />
              </UFormField>

              <UFormField label="当前语言摘要">
                <UTextarea
                  v-model="editorLocaleContent.summary"
                  :rows="4"
                  placeholder="请输入项目摘要"
                />
              </UFormField>

              <UFormField label="项目标签 / 技术栈（每行一条）">
                <UTextarea
                  :model-value="editorProject.tags.join('\n')"
                  :rows="5"
                  placeholder="Nuxt 4\nMonorepo\nNuxt UI"
                  @update:model-value="updateTags(String($event))"
                />
              </UFormField>
            </div>

            <div class="space-y-4">
              <UFormField label="封面图链接">
                <UInput
                  v-model="editorProject.cover"
                  placeholder="请输入封面图链接"
                />
              </UFormField>

              <UFormField label="项目外链">
                <UInput
                  v-model="editorProject.externalUrl"
                  placeholder="请输入项目外链"
                />
              </UFormField>

              <UFormField label="发布状态">
                <select
                  :value="editorProject.status"
                  class="w-full rounded-md border border-default bg-default px-3 py-2 text-sm text-default"
                  @change="handleStatusChange(($event.target as HTMLSelectElement).value as PublishStatus)"
                >
                  <option
                    v-for="option in projectStatusOptions"
                    :key="option.value"
                    :value="option.value"
                  >
                    {{ option.label }}
                  </option>
                </select>
              </UFormField>

              <UFormField label="排序值">
                <UInput
                  v-model.number="editorProject.sortOrder"
                  type="number"
                  min="1"
                />
              </UFormField>

              <div class="rounded-lg border border-default bg-elevated/40 p-4 text-sm text-muted space-y-2">
                <p>当前语言：{{ selectedLocale }}</p>
                <p>更新时间：{{ formatDateTime(editorProject.updatedAt) }}</p>
                <p>更新人：{{ getActorLabel(editorProject.updatedBy) }}</p>
                <p>审核人：{{ getActorLabel(editorProject.reviewedBy) }}</p>
                <p>发布时间：{{ getPublishedAtLabel(editorProject.publishedAt) }}</p>
                <p>封面图：{{ editorProject.cover || '未填写' }}</p>
              </div>

              <UCard>
                <template #header>
                  <div class="space-y-1">
                    <h3 class="text-base font-semibold text-highlighted">
                      版本历史
                    </h3>
                    <p class="text-sm text-muted">
                      查看当前项目的历史快照，为后续回滚能力做准备。
                    </p>
                  </div>
                </template>

                <div
                  v-if="projectVersionsPending"
                  class="text-sm text-muted"
                >
                  正在加载项目版本…
                </div>

                <div
                  v-else
                  class="space-y-3"
                >
                  <UCard
                    v-for="version in projectVersions"
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
                          :label="getProjectVersionInsights(version, editorProject, selectedLocale).changeLabel"
                          :color="getProjectVersionInsights(version, editorProject, selectedLocale).changeColor"
                          variant="subtle"
                        />
                        <UBadge
                          v-for="highlight in getProjectVersionInsights(version, editorProject, selectedLocale).highlights"
                          :key="highlight"
                          :label="highlight"
                          color="warning"
                          variant="subtle"
                        />
                      </div>

                      <div class="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
                        <div
                          v-for="item in getProjectVersionInsights(version, editorProject, selectedLocale).summaryItems"
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
                        <p>历史标题（{{ selectedLocale }}）：{{ version.snapshot.locales[selectedLocale]?.title || '暂无' }}</p>
                        <p>当前标题（{{ selectedLocale }}）：{{ editorProject.locales[selectedLocale]?.title || '暂无' }}</p>
                      </div>

                      <div class="flex flex-col items-end gap-2">
                        <UButton
                          label="恢复此版本"
                          color="warning"
                          variant="subtle"
                          :disabled="getProjectRestoreRestriction(version).disabled"
                          @click="handleRestoreProjectVersion(version)"
                        />
                        <p class="text-xs text-muted">
                          {{ getProjectRestoreRestriction(version).reason }}
                        </p>
                      </div>
                    </div>
                  </UCard>
                </div>
              </UCard>
            </div>
          </div>

          <template #footer>
            <div class="flex flex-wrap gap-3">
              <UButton
                label="保存项目"
                icon="i-lucide-save"
                @click="handleSaveProject"
              />
              <UButton
                label="删除项目"
                color="error"
                variant="subtle"
                @click="handleRemoveProject(editorProject)"
              />
              <UButton
                label="关闭编辑区"
                color="neutral"
                variant="subtle"
                @click="closeEditor"
              />
            </div>
          </template>
        </UCard>
      </div>
    </template>
  </UContainer>
</template>
