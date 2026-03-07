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

const { data, pending, error, refresh } = await useFetch('/api/site-settings', {
  key: 'admin-site-settings-api'
})

const {
  settings,
  localeOptions,
  stats,
  replaceSettings,
  setDefaultLocale,
  addSocialLink,
  removeSocialLink,
  addDownloadLink,
  removeDownloadLink,
  validateSettings
} = useSiteSettingsManagement(data.value)

watch(data, (value) => {
  if (value) {
    replaceSettings(value)
  }
}, { immediate: true })

async function handleSaveSettings() {
  try {
    validateSettings()
    const saved = await $fetch('/api/site-settings', {
      method: 'PUT',
      body: settings.value
    })
    replaceSettings(saved)
    await refresh()
    toast.add({
      title: '站点配置已保存',
      description: '默认语言、社交链接、下载资源和 SEO 默认配置已写入真实数据层。',
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

function handleLocaleChange(locale: WebLocale) {
  setDefaultLocale(locale)
  toast.add({
    title: '默认语言已更新',
    description: `站点默认语言已切换为 ${locale}，请记得保存。`,
    color: 'success'
  })
}
</script>

<template>
  <UContainer class="py-10">
    <template v-if="pending">
      <UCard>
        <p class="text-sm text-muted">
          正在加载站点配置…
        </p>
      </UCard>
    </template>

    <template v-else-if="error || !data">
      <UAlert title="站点配置加载失败" description="请检查 P1 数据层或 API 路由实现。" color="error" variant="subtle" />
    </template>

    <template v-else>
      <div class="space-y-6">
        <div class="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div class="space-y-2">
            <UBadge label="A7 站点配置与收尾" variant="subtle" color="primary" class="w-fit" />
            <div class="space-y-1">
              <h1 class="text-2xl font-semibold text-highlighted">
                站点设置
              </h1>
              <p class="max-w-3xl text-sm text-muted">
                当前阶段已建立默认语言、社交链接、下载资源和 SEO 默认配置管理界面，并在 P1 中切换为真实 SQLite 数据层与 API 读写样板。
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
                当前页面已经切换到真实 API 读写，是第二阶段 P1 的第一个打通样板。
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
              <p>当前样板模块：站点配置。</p>
              <p>数据库方案：SQLite。</p>
              <p>数据访问层：Drizzle ORM。</p>
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
                    当前配置将通过真实数据层持久化到 SQLite。
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
                    当前配置将通过真实数据层持久化到 SQLite。
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
    </template>
  </UContainer>
</template>
