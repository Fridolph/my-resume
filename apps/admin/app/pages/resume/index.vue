<script setup lang="ts">
import type { PublishStatus } from '@repo/types'

definePageMeta({
  middleware: 'auth'
})

const toast = useToast()
const { hasPermission } = usePermissions()

if (!hasPermission('resume.read')) {
  await navigateTo('/unauthorized')
}

const canWriteResume = hasPermission('resume.write')

const {
  resumeDocument,
  selectedLocale,
  localeOptions,
  publishStatusOptions,
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
  saveResume
} = useResumeManagement()

function handleSaveResume() {
  try {
    saveResume()
    toast.add({
      title: '简历内容已保存',
      description: `${selectedLocale.value} 的简历内容已同步到本地管理状态。`,
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

function handlePublishStatusChange(status: PublishStatus) {
  setPublishStatus(status)
  toast.add({
    title: '发布状态已更新',
    description: `当前简历状态已切换为 ${status}。`,
    color: 'success'
  })
}
</script>

<template>
  <UContainer class="py-10">
    <div class="space-y-6">
      <div class="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div class="space-y-2">
          <UBadge label="A5 简历管理模块" variant="subtle" color="primary" class="w-fit" />
          <div class="space-y-1">
            <h1 class="text-2xl font-semibold text-highlighted">
              简历管理
            </h1>
            <p class="max-w-3xl text-sm text-muted">
              当前阶段已建立基础信息、教育经历、工作经历、技能分组、联系方式、多语言切换和发布状态的统一管理界面，用于承接前台简历内容的数据来源。
            </p>
          </div>
        </div>

        <div class="flex flex-wrap items-center gap-3">
          <UBadge :label="resumeDocument.status" :color="resumeDocument.status === 'published' ? 'success' : 'warning'" variant="subtle" />
          <UButton v-if="canWriteResume" label="保存当前语言内容" icon="i-lucide-save" @click="handleSaveResume" />
        </div>
      </div>

      <div class="grid gap-4 md:grid-cols-5">
        <UCard>
          <template #header>语言数</template>
          <p class="text-2xl font-semibold text-highlighted">{{ stats.localeCount }}</p>
        </UCard>
        <UCard>
          <template #header>教育经历</template>
          <p class="text-2xl font-semibold text-highlighted">{{ stats.educationCount }}</p>
        </UCard>
        <UCard>
          <template #header>工作经历</template>
          <p class="text-2xl font-semibold text-highlighted">{{ stats.experienceCount }}</p>
        </UCard>
        <UCard>
          <template #header>技能分组</template>
          <p class="text-2xl font-semibold text-highlighted">{{ stats.skillGroupCount }}</p>
        </UCard>
        <UCard>
          <template #header>联系方式</template>
          <p class="text-2xl font-semibold text-highlighted">{{ stats.contactCount }}</p>
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
            <select v-model="selectedLocale" class="w-full rounded-md border border-default bg-default px-3 py-2 text-sm text-default">
              <option v-for="option in localeOptions" :key="option.value" :value="option.value">
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
              <option v-for="option in publishStatusOptions" :key="option.value" :value="option.value">
                {{ option.label }}
              </option>
            </select>
          </UFormField>

          <div class="grid gap-2 md:grid-cols-2">
            <UCard v-for="coverage in localeCoverage" :key="coverage.locale">
              <template #header>
                <div class="flex items-center justify-between gap-2">
                  <p class="font-medium text-default">{{ coverage.locale }}</p>
                  <UBadge :label="`${coverage.missingFields} 个缺失项`" :color="coverage.missingFields === 0 ? 'success' : 'warning'" variant="subtle" />
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
            <UInput v-model="currentLocaleContent.baseInfo.fullName" :disabled="!canWriteResume" placeholder="请输入姓名" />
          </UFormField>

          <UFormField label="岗位标题">
            <UInput v-model="currentLocaleContent.baseInfo.headline" :disabled="!canWriteResume" placeholder="请输入岗位标题" />
          </UFormField>

          <UFormField label="所在地区">
            <UInput v-model="currentLocaleContent.baseInfo.location" :disabled="!canWriteResume" placeholder="请输入地区" />
          </UFormField>

          <div />

          <UFormField label="个人简介" class="md:col-span-2">
            <UTextarea v-model="currentLocaleContent.baseInfo.summary" :disabled="!canWriteResume" :rows="4" placeholder="请输入简历简介" />
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

            <UButton v-if="canWriteResume" label="新增教育经历" color="neutral" variant="subtle" @click="addEducation" />
          </div>
        </template>

        <div class="space-y-4">
          <UCard v-for="item in currentLocaleContent.education" :key="item.id">
            <div class="grid gap-4 md:grid-cols-2">
              <UFormField label="学校">
                <UInput v-model="item.school" :disabled="!canWriteResume" placeholder="请输入学校" />
              </UFormField>
              <UFormField label="学历/专业">
                <UInput v-model="item.degree" :disabled="!canWriteResume" placeholder="请输入学历或专业" />
              </UFormField>
              <UFormField label="时间范围">
                <UInput v-model="item.period" :disabled="!canWriteResume" placeholder="例如 2016 - 2020" />
              </UFormField>
              <div />
              <UFormField label="摘要" class="md:col-span-2">
                <UTextarea v-model="item.summary" :disabled="!canWriteResume" :rows="3" placeholder="请输入教育摘要" />
              </UFormField>
            </div>

            <template #footer>
              <div class="flex justify-end">
                <UButton v-if="canWriteResume" label="删除" color="error" variant="subtle" @click="removeEducation(item.id)" />
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

            <UButton v-if="canWriteResume" label="新增工作经历" color="neutral" variant="subtle" @click="addExperience" />
          </div>
        </template>

        <div class="space-y-4">
          <UCard v-for="item in currentLocaleContent.experiences" :key="item.id">
            <div class="grid gap-4 md:grid-cols-2">
              <UFormField label="公司">
                <UInput v-model="item.company" :disabled="!canWriteResume" placeholder="请输入公司名称" />
              </UFormField>
              <UFormField label="职位">
                <UInput v-model="item.role" :disabled="!canWriteResume" placeholder="请输入职位" />
              </UFormField>
              <UFormField label="时间范围">
                <UInput v-model="item.period" :disabled="!canWriteResume" placeholder="例如 2020 - 至今" />
              </UFormField>
              <div />
              <UFormField label="摘要" class="md:col-span-2">
                <UTextarea v-model="item.summary" :disabled="!canWriteResume" :rows="3" placeholder="请输入工作摘要" />
              </UFormField>
            </div>

            <template #footer>
              <div class="flex justify-end">
                <UButton v-if="canWriteResume" label="删除" color="error" variant="subtle" @click="removeExperience(item.id)" />
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

              <UButton v-if="canWriteResume" label="新增技能分组" color="neutral" variant="subtle" @click="addSkillGroup" />
            </div>
          </template>

          <div class="space-y-4">
            <UCard v-for="group in currentLocaleContent.skillGroups" :key="group.id">
              <div class="space-y-4">
                <UFormField label="分组标题">
                  <UInput v-model="group.title" :disabled="!canWriteResume" placeholder="例如 核心技术" />
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
                  <UButton v-if="canWriteResume" label="删除分组" color="error" variant="subtle" @click="removeSkillGroup(group.id)" />
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

              <UButton v-if="canWriteResume" label="新增联系方式" color="neutral" variant="subtle" @click="addContact" />
            </div>
          </template>

          <div class="space-y-4">
            <UCard v-for="item in currentLocaleContent.contacts" :key="item.id">
              <div class="space-y-4">
                <UFormField label="标签">
                  <UInput v-model="item.label" :disabled="!canWriteResume" placeholder="例如 邮箱" />
                </UFormField>
                <UFormField label="展示值">
                  <UInput v-model="item.value" :disabled="!canWriteResume" placeholder="请输入展示值" />
                </UFormField>
                <UFormField label="链接">
                  <UInput v-model="item.href" :disabled="!canWriteResume" placeholder="例如 https://github.com/..." />
                </UFormField>
              </div>

              <template #footer>
                <div class="flex justify-end">
                  <UButton v-if="canWriteResume" label="删除" color="error" variant="subtle" @click="removeContact(item.id)" />
                </div>
              </template>
            </UCard>
          </div>
        </UCard>
      </div>
    </div>
  </UContainer>
</template>
