import type {
  SiteDownloadLink,
  SiteSettingsRecord,
  SiteSocialLink,
  WebLocale
} from '@repo/types'

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

const initialSiteSettings: SiteSettingsRecord = {
  id: 'site_settings_main',
  defaultLocale: 'zh-CN',
  socialLinks: [
    createSocialLink({
      id: 'social_github',
      label: 'GitHub',
      url: 'https://github.com/Fridolph'
    }),
    createSocialLink({
      id: 'social_x',
      label: 'X / Twitter',
      url: 'https://x.com/fridolph'
    })
  ],
  downloadLinks: [
    createDownloadLink({
      id: 'download_resume_pdf',
      label: '中文简历 PDF',
      url: 'https://fridolph.com/downloads/resume-zh.pdf'
    }),
    createDownloadLink({
      id: 'download_resume_en_pdf',
      label: 'English Resume PDF',
      url: 'https://fridolph.com/downloads/resume-en.pdf'
    })
  ],
  seo: {
    title: 'Fridolph Web',
    description: '个人内容展示站，承载主页、简历、项目与多语言内容。',
    ogImage: 'https://fridolph.com/og-default.svg',
    siteUrl: 'https://fridolph.com'
  },
  updatedAt: new Date().toISOString()
}

export function useSiteSettingsManagement() {
  const settings = useState<SiteSettingsRecord>('admin-site-settings', () => structuredClone(initialSiteSettings))

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

  function saveSettings() {
    if (!settings.value.seo.title.trim() || !settings.value.seo.siteUrl.trim()) {
      throw createError({
        statusCode: 400,
        statusMessage: '请至少填写站点标题和站点地址'
      })
    }

    touchSettings()
  }

  return {
    settings,
    localeOptions,
    stats,
    setDefaultLocale,
    addSocialLink,
    removeSocialLink,
    addDownloadLink,
    removeDownloadLink,
    saveSettings
  }
}
