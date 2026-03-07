import type { TranslationRecord, WebLocale } from '@repo/types'

type WebCopyDictionary = Record<string, string>

const localeOptions = [
  { label: '中文', value: 'zh-CN' },
  { label: 'EN', value: 'en-US' }
] satisfies Array<{ label: string, value: WebLocale }>

const webMessages: Record<WebLocale, WebCopyDictionary> = {
  'zh-CN': {
    'app.name': 'Fridolph Web',
    'app.description': '个人内容展示站，承载主页、简历、项目与多语言内容。',
    'common.currentLocale': '当前语言',
    'common.currentTheme': '当前主题',
    'nav.home': '首页',
    'nav.resume': '简历',
    'nav.projects': '项目',
    'locale.label': '语言',
    'theme.label': '主题',
    'theme.system': '跟随系统',
    'theme.light': '浅色',
    'theme.dark': '深色',
    'footer.milestone': 'Web milestone W6 · SEO and Content Site Capability',
    'footer.description': '当前阶段已补齐站点级 SEO、canonical、robots、sitemap 与默认 OG 图能力。',
    'page.home.description': '个人内容展示站首页，承载个人简介、简历入口、项目展示入口与内容站 SEO 能力。',
    'page.resume.title': '在线简历 · Fridolph Web',
    'page.resume.description': '在线简历页面已接入结构化内容、语言切换能力与基础 SEO 信息。',
    'page.projects.title': '项目列表 · Fridolph Web',
    'page.projects.description': '项目列表页面已接入结构化内容、语言切换能力与基础 SEO 信息。',
    'page.projectDetail.description': '项目详情页已接入结构化内容、语言切换能力与基础 SEO 信息。',
    'state.loading.home': '正在加载首页内容…',
    'state.loading.resume': '正在加载简历内容…',
    'state.loading.projects': '正在加载项目内容…',
    'state.loading.projectDetail': '正在加载项目详情…',
    'state.error.home.title': '首页内容加载失败',
    'state.error.home.description': '请稍后重试，或检查内容读取层实现。',
    'state.error.resume.title': '简历内容加载失败',
    'state.error.resume.description': '请稍后重试，或检查简历数据读取逻辑。',
    'state.error.projects.title': '项目内容加载失败',
    'state.error.projects.description': '请稍后重试，或检查项目数据读取逻辑。',
    'state.error.projectDetail.title': '项目详情加载失败',
    'state.error.projectDetail.description': '请稍后重试，或检查详情数据读取逻辑。',
    'project.detail.summaryTitle': '页面说明',
    'project.detail.summaryDescription': '当前详情页已经改为数据驱动渲染，后续可以直接替换为后台项目详情响应。',
    'project.detail.back': '返回项目列表',
    'home.intro.badge': 'Public Content API',
    'home.intro.title': 'Fridolph Web',
    'home.intro.description': '首页已开始消费后台真实内容，公开站点与管理后台正在逐步打通。',
    'home.stats.projects.label': '已发布项目',
    'home.stats.projects.hint': '仅统计后台已发布项目。',
    'home.stats.locales.label': '公开语言',
    'home.stats.locales.hint': '当前公开站点支持的语言数量。',
    'home.stats.source.label': '内容来源',
    'home.stats.source.hint': '首页数据正在逐步切换到 API Server。',
    'home.features.resume.title': '在线简历',
    'home.features.resume.description': '前台简历页已读取后台真实简历文档。',
    'home.features.projects.title': '项目列表',
    'home.features.projects.description': '公开项目列表与详情页已切换到后台项目数据。',
    'home.features.i18n.title': '公开文案',
    'home.features.i18n.description': '站点公开文案开始支持后台翻译结果覆盖。'
  },
  'en-US': {
    'app.name': 'Fridolph Web',
    'app.description': 'A public content site for homepage, resume, projects, and localized content.',
    'common.currentLocale': 'Locale',
    'common.currentTheme': 'Theme',
    'nav.home': 'Home',
    'nav.resume': 'Resume',
    'nav.projects': 'Projects',
    'locale.label': 'Locale',
    'theme.label': 'Theme',
    'theme.system': 'System',
    'theme.light': 'Light',
    'theme.dark': 'Dark',
    'footer.milestone': 'Web milestone W6 · SEO and Content Site Capability',
    'footer.description': 'Site-level SEO, canonical URLs, robots, sitemap, and a default OG image are now in place.',
    'page.home.description': 'Homepage for personal introduction, resume entry, project entry points, and SEO-ready content delivery.',
    'page.resume.title': 'Resume · Fridolph Web',
    'page.resume.description': 'The resume page now supports structured content, locale switching, and baseline SEO metadata.',
    'page.projects.title': 'Projects · Fridolph Web',
    'page.projects.description': 'The projects page now supports structured content, locale switching, and baseline SEO metadata.',
    'page.projectDetail.description': 'The project detail page now supports structured content, locale switching, and baseline SEO metadata.',
    'state.loading.home': 'Loading homepage content…',
    'state.loading.resume': 'Loading resume content…',
    'state.loading.projects': 'Loading project content…',
    'state.loading.projectDetail': 'Loading project details…',
    'state.error.home.title': 'Failed to load homepage content',
    'state.error.home.description': 'Please retry later or inspect the content access layer.',
    'state.error.resume.title': 'Failed to load resume content',
    'state.error.resume.description': 'Please retry later or inspect the resume data layer.',
    'state.error.projects.title': 'Failed to load project content',
    'state.error.projects.description': 'Please retry later or inspect the project data layer.',
    'state.error.projectDetail.title': 'Failed to load project details',
    'state.error.projectDetail.description': 'Please retry later or inspect the detail data layer.',
    'project.detail.summaryTitle': 'Page Notes',
    'project.detail.summaryDescription': 'The detail page is now data-driven and can later switch directly to backend project responses.',
    'project.detail.back': 'Back to Projects',
    'home.intro.badge': 'Public Content API',
    'home.intro.title': 'Fridolph Web',
    'home.intro.description': 'The homepage now begins to consume real backend content, gradually connecting the public site with the admin system.',
    'home.stats.projects.label': 'Published Projects',
    'home.stats.projects.hint': 'Only published admin projects are counted.',
    'home.stats.locales.label': 'Public Locales',
    'home.stats.locales.hint': 'Number of locales currently available on the public site.',
    'home.stats.source.label': 'Content Source',
    'home.stats.source.hint': 'Homepage content is being migrated to the API Server.',
    'home.features.resume.title': 'Resume',
    'home.features.resume.description': 'The public resume page now reads the real admin resume document.',
    'home.features.projects.title': 'Projects',
    'home.features.projects.description': 'Public project list and detail pages now use real admin project data.',
    'home.features.i18n.title': 'Public Copy',
    'home.features.i18n.description': 'Public-facing copy now supports overrides from admin-managed translations.'
  }
}

function buildRemoteMessageMap(records: TranslationRecord[]) {
  return records.reduce<Record<WebLocale, WebCopyDictionary>>((accumulator, record) => {
    const locale = record.locale as WebLocale
    if (locale !== 'zh-CN' && locale !== 'en-US') {
      return accumulator
    }

    if (!accumulator[locale]) {
      accumulator[locale] = {}
    }

    accumulator[locale][record.key] = record.value
    return accumulator
  }, {
    'zh-CN': {},
    'en-US': {}
  })
}

export function useWebLocale() {
  const localeCookie = useCookie<WebLocale>('web-locale', {
    default: () => 'zh-CN'
  })

  const locale = useState<WebLocale>('web-locale', () => localeCookie.value ?? 'zh-CN')
  const remoteTranslations = useState<TranslationRecord[]>('web-public-translations', () => [])

  if (locale.value !== localeCookie.value) {
    localeCookie.value = locale.value
  }

  if (import.meta.client) {
    const storedLocale = localStorage.getItem('web-locale') as WebLocale | null
    if (storedLocale === 'zh-CN' || storedLocale === 'en-US') {
      locale.value = storedLocale
    }
  }

  const remoteMessageMap = computed(() => buildRemoteMessageMap(remoteTranslations.value))

  function setLocale(value: WebLocale) {
    locale.value = value
    localeCookie.value = value
    if (import.meta.client) {
      localStorage.setItem('web-locale', value)
      document.documentElement.lang = value
    }
  }

  function toggleLocale() {
    setLocale(locale.value === 'zh-CN' ? 'en-US' : 'zh-CN')
  }

  function t(key: string) {
    return remoteMessageMap.value[locale.value][key]
      ?? webMessages[locale.value][key]
      ?? webMessages['zh-CN'][key]
      ?? key
  }

  const currentLocaleLabel = computed(() => {
    return localeOptions.find(item => item.value === locale.value)?.label ?? locale.value
  })

  return {
    locale,
    localeOptions,
    currentLocaleLabel,
    setLocale,
    toggleLocale,
    t
  }
}
