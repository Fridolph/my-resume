import type { WebLocale } from '@repo/types'

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
    'project.detail.back': '返回项目列表'
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
    'project.detail.back': 'Back to Projects'
  }
}

export function useWebLocale() {
  const localeCookie = useCookie<WebLocale>('web-locale', {
    default: () => 'zh-CN'
  })

  const locale = useState<WebLocale>('web-locale', () => localeCookie.value ?? 'zh-CN')

  if (locale.value !== localeCookie.value) {
    localeCookie.value = locale.value
  }

  if (import.meta.client) {
    const storedLocale = localStorage.getItem('web-locale') as WebLocale | null
    if (storedLocale === 'zh-CN' || storedLocale === 'en-US') {
      locale.value = storedLocale
    }
  }

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
    return webMessages[locale.value][key] ?? webMessages['zh-CN'][key] ?? key
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
