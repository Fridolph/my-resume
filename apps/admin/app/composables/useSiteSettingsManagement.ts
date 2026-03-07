import type {
  SiteDownloadLink,
  SiteSettingsRecord,
  SiteSocialLink,
  WebLocale
} from '@repo/types'

function createEmptySettings(): SiteSettingsRecord {
  return {
    id: 'site_settings_main',
    defaultLocale: 'zh-CN',
    socialLinks: [],
    downloadLinks: [],
    seo: {
      title: '',
      description: '',
      ogImage: '',
      siteUrl: ''
    },
    updatedAt: new Date().toISOString()
  }
}

function createSocialLink(input?: Partial<SiteSocialLink>): SiteSocialLink {
  return {
    id: input?.id ?? `social_${crypto.randomUUID()}`,
    label: input?.label ?? '',
    url: input?.url ?? ''
  }
}

function createDownloadLink(input?: Partial<SiteDownloadLink>): SiteDownloadLink {
  return {
    id: input?.id ?? `download_${crypto.randomUUID()}`,
    label: input?.label ?? '',
    url: input?.url ?? ''
  }
}

export function useSiteSettingsManagement(initialSettings?: SiteSettingsRecord | null) {
  const settings = useState<SiteSettingsRecord>('admin-site-settings', () => structuredClone(initialSettings ?? createEmptySettings()))

  const localeOptions: Array<{ label: string, value: WebLocale }> = [
    { label: '简体中文', value: 'zh-CN' },
    { label: 'English', value: 'en-US' }
  ]

  const stats = computed(() => ({
    socialCount: settings.value.socialLinks.length,
    downloadCount: settings.value.downloadLinks.length,
    seoFieldCount: 4,
    defaultLocale: settings.value.defaultLocale
  }))

  function replaceSettings(nextSettings: SiteSettingsRecord) {
    settings.value = structuredClone(nextSettings)
  }

  function touchSettings() {
    settings.value.updatedAt = new Date().toISOString()
  }

  function setDefaultLocale(locale: WebLocale) {
    settings.value.defaultLocale = locale
    touchSettings()
  }

  function addSocialLink() {
    settings.value.socialLinks.push(createSocialLink())
    touchSettings()
  }

  function removeSocialLink(id: string) {
    settings.value.socialLinks = settings.value.socialLinks.filter(item => item.id !== id)
    touchSettings()
  }

  function addDownloadLink() {
    settings.value.downloadLinks.push(createDownloadLink())
    touchSettings()
  }

  function removeDownloadLink(id: string) {
    settings.value.downloadLinks = settings.value.downloadLinks.filter(item => item.id !== id)
    touchSettings()
  }

  function validateSettings() {
    if (!settings.value.seo.title.trim() || !settings.value.seo.siteUrl.trim()) {
      throw createError({
        statusCode: 400,
        statusMessage: '请至少填写站点标题和站点地址'
      })
    }
  }

  return {
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
  }
}
