<script setup lang="ts">
import type { WebLocale } from '@repo/types'

definePageMeta({
  middleware: 'auth'
})

const toast = useToast()
const { hasPermission } = usePermissions()

if (!hasPermission('site.write')) {
  await navigateTo('/unauthorized')
}

const {
  settings,
  localeOptions,
  stats,
  setDefaultLocale,
  addSocialLink,
  removeSocialLink,
  addDownloadLink,
  removeDownloadLink,
  saveSettings
} = useSiteSettingsManagement()

function handleSaveSettings() {
  try {
    saveSettings()
    toast.add({
      title: '站点配置已保存',
      description: '默认语言、社交链接、下载资源和 SEO 默认配置已同步到本地管理状态。',
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

function handleLocaleChange(locale: WebLocale) {
  setDefaultLocale(locale)
  toast.add({
    title: '默认语言已更新',
    description: `站点默认语言已切换为 ${locale}。`,
    color: 'success'
  })
}
</script>

<template>
  <UContainer class="py-10">
    <div class="space-y-6">
      <div class="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div class="space-y-2">
          <UBadge label="A7 站点配置与收尾" variant="subtle" color="primary" class="w-fit" />
          <div class="space-y-1">
            <h1 class="text-2xl font-semibold text-highlighted">
              站点设置
            </h1>
            <p class="max-w-3xl text-sm text-muted">
              当前阶段已建立默认语言、社交链接、下载资源和 SEO 默认配置管理界面，并作为后台第一阶段的收尾模块。
            </p>
          </div>
        </div>

        <UButton label="保存站点配置" icon="i-lucide-save" @click="handleSaveSettings" />
      </div>

      <div class="grid gap-4 md:grid-cols-4">
        <UCard>
          <template #header>默认语言</template>
          <p class="text-2xl font-semibold text-highlighted">{{ stats.defaultLocale }}</p>
        </UCard>
        <UCard>
          <template #header>社交链接</template>
          <p class="text-2xl font-semibold text-highlighted">{{ stats.socialCount }}</p>
        </UCard>
        <UCard>
          <template #header>下载资源</template>
          <p class="text-2xl font-semibold text-highlighted">{{ stats.downloadCount }}</p>
        </UCard>
        <UCard>
          <template #header>SEO 字段</template>
          <p class="text-2xl font-semibold text-highlighted">{{ stats.seoFieldCount }}</p>
        </UCard>
      </div>

      <UCard>
        <template #header>
          <div class="space-y-1">
            <h2 class="text-base font-semibold text-highlighted">
              默认语言与阶段说明
            </h2>
            <p class="text-sm text-muted">
              用于管理公开站点的默认语言，并记录第一阶段模块闭环状态。
            </p>
          </div>
        </template>

        <div class="grid gap-4 lg:grid-cols-[1fr_1.4fr]">
          <UFormField label="站点默认语言">
            <select
              :value="settings.defaultLocale"
              class="w-full rounded-md border border-default bg-default px-3 py-2 text-sm text-default"
              @change="handleLocaleChange(($event.target as HTMLSelectElement).value as WebLocale)"
            >
              <option v-for="option in localeOptions" :key="option.value" :value="option.value">
                {{ option.label }}
              </option>
            </select>
          </UFormField>

          <div class="rounded-lg border border-default bg-elevated/40 p-4 text-sm text-muted space-y-2">
            <p>当前后台第一阶段已经完成用户、文案、简历、项目与站点配置管理。</p>
            <p>下一阶段可以继续进入真实 API 接入、版本流和更细化的审核流程。</p>
            <p>最后更新时间：{{ new Date(settings.updatedAt).toLocaleString() }}</p>
          </div>
        </div>
      </UCard>

      <div class="grid gap-6 xl:grid-cols-[1fr_1fr]">
        <UCard>
          <template #header>
            <div class="flex items-center justify-between gap-3">
              <div class="space-y-1">
                <h2 class="text-base font-semibold text-highlighted">
                  社交链接配置
                </h2>
                <p class="text-sm text-muted">
                  管理对外展示的社交平台入口，例如 GitHub、X 和 LinkedIn。
                </p>
              </div>

              <UButton label="新增社交链接" color="neutral" variant="subtle" @click="addSocialLink" />
            </div>
          </template>

          <div class="space-y-4">
            <UCard v-for="item in settings.socialLinks" :key="item.id">
              <div class="grid gap-4 md:grid-cols-2">
                <UFormField label="名称">
                  <UInput v-model="item.label" placeholder="例如 GitHub" />
                </UFormField>
                <UFormField label="链接">
                  <UInput v-model="item.url" placeholder="请输入社交链接地址" />
                </UFormField>
              </div>

              <template #footer>
                <div class="flex justify-end">
                  <UButton label="删除" color="error" variant="subtle" @click="removeSocialLink(item.id)" />
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
                  下载资源配置
                </h2>
                <p class="text-sm text-muted">
                  管理公开可下载资源，例如中英文简历文件或作品集压缩包。
                </p>
              </div>

              <UButton label="新增下载资源" color="neutral" variant="subtle" @click="addDownloadLink" />
            </div>
          </template>

          <div class="space-y-4">
            <UCard v-for="item in settings.downloadLinks" :key="item.id">
              <div class="grid gap-4 md:grid-cols-2">
                <UFormField label="名称">
                  <UInput v-model="item.label" placeholder="例如 中文简历 PDF" />
                </UFormField>
                <UFormField label="链接">
                  <UInput v-model="item.url" placeholder="请输入下载地址" />
                </UFormField>
              </div>

              <template #footer>
                <div class="flex justify-end">
                  <UButton label="删除" color="error" variant="subtle" @click="removeDownloadLink(item.id)" />
                </div>
              </template>
            </UCard>
          </div>
        </UCard>
      </div>

      <UCard>
        <template #header>
          <div class="space-y-1">
            <h2 class="text-base font-semibold text-highlighted">
              SEO 默认配置
            </h2>
            <p class="text-sm text-muted">
              用于统一管理公开站点的默认标题、描述、OG 图和站点域名。
            </p>
          </div>
        </template>

        <div class="grid gap-4 md:grid-cols-2">
          <UFormField label="站点标题">
            <UInput v-model="settings.seo.title" placeholder="请输入站点标题" />
          </UFormField>

          <UFormField label="站点域名">
            <UInput v-model="settings.seo.siteUrl" placeholder="请输入站点域名" />
          </UFormField>

          <UFormField label="默认描述" class="md:col-span-2">
            <UTextarea v-model="settings.seo.description" :rows="4" placeholder="请输入默认 SEO 描述" />
          </UFormField>

          <UFormField label="默认 OG 图地址" class="md:col-span-2">
            <UInput v-model="settings.seo.ogImage" placeholder="请输入 OG 图链接" />
          </UFormField>
        </div>
      </UCard>
    </div>
  </UContainer>
</template>
