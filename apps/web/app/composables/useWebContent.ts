import type {
  ProjectDetailContent,
  ProjectsPageContent,
  ProjectRecord,
  ResumeDocument,
  ResumePageContent,
  WebLocale,
  WebStatItem
} from '@repo/types'
import { getHomePageContent } from '@repo/sdk'

function buildResumeSections(document: ResumeDocument, locale: WebLocale): ResumePageContent {
  const content = document.locales[locale]

  return {
    intro: {
      badge: document.status === 'published' ? 'Resume API' : 'Resume API Preview',
      title: locale === 'zh-CN' ? '在线简历' : 'Resume',
      description: locale === 'zh-CN'
        ? '当前简历页已切换为读取 API Server 的真实简历文档，多语言内容直接来自后台管理数据。'
        : 'The resume page now loads the real resume document from the API Server, with locale-specific content managed in the admin app.'
    },
    sections: [
      {
        title: locale === 'zh-CN' ? '基础信息' : 'Profile',
        description: content.baseInfo.summary,
        highlights: [content.baseInfo.fullName, content.baseInfo.headline, content.baseInfo.location]
      },
      {
        title: locale === 'zh-CN' ? '教育经历' : 'Education',
        description: locale === 'zh-CN'
          ? `共 ${content.education.length} 段教育经历。`
          : `${content.education.length} education entries are currently available.`,
        highlights: content.education.map(item => `${item.school} · ${item.degree}`)
      },
      {
        title: locale === 'zh-CN' ? '工作经历' : 'Experience',
        description: locale === 'zh-CN'
          ? `共 ${content.experiences.length} 段工作经历。`
          : `${content.experiences.length} work experience entries are currently available.`,
        highlights: content.experiences.map(item => `${item.company} · ${item.role}`)
      },
      {
        title: locale === 'zh-CN' ? '技能分组' : 'Skill Groups',
        description: locale === 'zh-CN'
          ? '当前展示后台维护的技能分组结果。'
          : 'This section renders skill groups managed in the admin app.',
        highlights: content.skillGroups.flatMap(group => [group.title, ...group.items]).slice(0, 6)
      },
      {
        title: locale === 'zh-CN' ? '联系方式' : 'Contact',
        description: locale === 'zh-CN'
          ? '联系方式已从后台简历文档同步。'
          : 'Contact details are synced from the admin resume document.',
        highlights: content.contacts.map(item => `${item.label} · ${item.value}`)
      }
    ]
  }
}

function buildProjectsIntro(locale: WebLocale): ProjectsPageContent['intro'] {
  return {
    badge: 'Projects API',
    title: locale === 'zh-CN' ? '项目列表' : 'Projects',
    description: locale === 'zh-CN'
      ? '当前项目列表页已切换为读取后台项目模块的真实数据，公开列表仅展示已发布项目。'
      : 'The projects page now reads real project data from the admin project module and only shows published entries.'
  }
}

function buildProjectList(projects: ProjectRecord[], locale: WebLocale): ProjectsPageContent {
  const publishedProjects = projects
    .filter(project => project.status === 'published')
    .sort((left, right) => left.sortOrder - right.sortOrder)

  return {
    intro: buildProjectsIntro(locale),
    projects: publishedProjects.map(project => ({
      title: project.locales[locale].title,
      slug: project.slug,
      description: project.locales[locale].description,
      tags: project.tags
    }))
  }
}

function buildProjectStats(project: ProjectRecord, locale: WebLocale): WebStatItem[] {
  return [
    {
      label: locale === 'zh-CN' ? '当前状态' : 'Status',
      value: project.status,
      hint: locale === 'zh-CN' ? '来自后台项目管理模块。' : 'Synced from the admin project module.'
    },
    {
      label: locale === 'zh-CN' ? '排序值' : 'Sort Order',
      value: String(project.sortOrder),
      hint: locale === 'zh-CN' ? '由后台项目列表顺序控制。' : 'Controlled by the admin project order.'
    },
    {
      label: locale === 'zh-CN' ? '技术标签' : 'Tags',
      value: String(project.tags.length),
      hint: locale === 'zh-CN' ? project.tags.join(' / ') : project.tags.join(' / ')
    }
  ]
}

function buildProjectDetail(project: ProjectRecord, locale: WebLocale): ProjectDetailContent {
  return {
    slug: project.slug,
    intro: {
      badge: 'Project Detail API',
      title: project.locales[locale].title,
      description: project.locales[locale].description
    },
    stats: buildProjectStats(project, locale)
  }
}

export function useHomePageContent() {
  const { locale } = useWebLocale()

  return useAsyncData('web-home-content', () => getHomePageContent(locale.value), {
    watch: [locale]
  })
}

export function useResumePageContent() {
  const { locale } = useWebLocale()
  const apiClient = usePlatformApiClient()

  return useAsyncData('web-resume-content', async () => {
    const document = await apiClient.getResumeDocument()
    return buildResumeSections(document, locale.value)
  }, {
    watch: [locale]
  })
}

export function useProjectsPageContent() {
  const { locale } = useWebLocale()
  const apiClient = usePlatformApiClient()

  return useAsyncData('web-projects-content', async () => {
    const records = await apiClient.listProjects()
    return buildProjectList(records, locale.value)
  }, {
    watch: [locale]
  })
}

export function useProjectDetailContent(slug: string) {
  const { locale } = useWebLocale()
  const apiClient = usePlatformApiClient()

  return useAsyncData(`web-project-detail-${slug}`, async () => {
    const records = await apiClient.listProjects()
    const project = records.find(item => item.slug === slug && item.status === 'published')

    if (!project) {
      throw createError({
        statusCode: 404,
        statusMessage: locale.value === 'zh-CN' ? '项目不存在或尚未发布' : 'Project not found or not published'
      })
    }

    return buildProjectDetail(project, locale.value)
  }, {
    watch: [locale]
  })
}
