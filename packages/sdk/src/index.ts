import type {
  HomePageContent,
  ProjectDetailContent,
  ProjectsPageContent,
  ResumePageContent,
  WebLocale
} from '@repo/types'

const homeContentMap: Record<WebLocale, HomePageContent> = {
  'zh-CN': {
    intro: {
      badge: 'W5 i18n Ready',
      title: 'Fridolph Web',
      description: 'W5 已让 Web 页面具备前台语言切换能力，当前页面内容可以随 locale 切换为中文或英文。'
    },
    stats: [
      {
        label: '当前阶段',
        value: 'W5',
        hint: '前台 i18n 与主题系统已接入。'
      },
      {
        label: '支持语言',
        value: '2 种',
        hint: '当前支持简体中文与英文。'
      },
      {
        label: '内容来源',
        value: 'SDK Mock',
        hint: '后续可替换为后台 API 与文案管理结果。'
      }
    ],
    features: [
      {
        title: '在线简历',
        description: '通过结构化简历 DTO 与 locale 参数驱动章节展示。',
        to: '/resume',
        badge: 'Resume'
      },
      {
        title: '项目列表',
        description: '通过结构化项目 DTO 驱动项目卡片和详情页。',
        to: '/projects',
        badge: 'Projects'
      },
      {
        title: '多语言内容',
        description: '当前由 SDK mock 提供双语数据，后续可无缝切换到后台内容服务。',
        to: '/projects/i18n-content-hub',
        badge: 'i18n'
      }
    ]
  },
  'en-US': {
    intro: {
      badge: 'W5 i18n Ready',
      title: 'Fridolph Web',
      description: 'W5 adds frontend locale switching so the web app can now render structured content in English and Chinese.'
    },
    stats: [
      {
        label: 'Milestone',
        value: 'W5',
        hint: 'Frontend i18n and theme system are now available.'
      },
      {
        label: 'Locales',
        value: '2',
        hint: 'Simplified Chinese and English are supported.'
      },
      {
        label: 'Source',
        value: 'SDK Mock',
        hint: 'This can be replaced by admin APIs later.'
      }
    ],
    features: [
      {
        title: 'Resume',
        description: 'Resume sections are rendered from structured DTOs with locale-aware content.',
        to: '/resume',
        badge: 'Resume'
      },
      {
        title: 'Projects',
        description: 'Project cards and detail pages are rendered from structured project DTOs.',
        to: '/projects',
        badge: 'Projects'
      },
      {
        title: 'Localized Content',
        description: 'Dual-language mock content is ready to be replaced by the admin content service.',
        to: '/projects/i18n-content-hub',
        badge: 'i18n'
      }
    ]
  }
}

const resumeContentMap: Record<WebLocale, ResumePageContent> = {
  'zh-CN': {
    intro: {
      badge: 'Resume DTO',
      title: '在线简历',
      description: '当前简历页已经切换为由结构化数据驱动，后续后台只需返回统一 DTO 即可完成渲染。'
    },
    sections: [
      {
        title: '基础信息',
        description: '展示个人身份、目标岗位和核心介绍。',
        highlights: ['姓名', '岗位方向', '城市', '个人简介']
      },
      {
        title: '教育经历',
        description: '承载学历、学校与教育背景摘要。',
        highlights: ['学校', '学历', '时间范围']
      },
      {
        title: '工作经历',
        description: '承载公司经历、职责和项目摘要。',
        highlights: ['公司', '职位', '时间范围', '项目摘要']
      },
      {
        title: '技能亮点',
        description: '展示前端能力、工程化能力和跨端能力。',
        highlights: ['Vue / Nuxt', 'TypeScript', '工程化', '性能优化']
      },
      {
        title: '联系方式',
        description: '承载邮箱、社交账号和简历导出入口。',
        highlights: ['邮箱', 'GitHub', '下载链接']
      }
    ]
  },
  'en-US': {
    intro: {
      badge: 'Resume DTO',
      title: 'Resume',
      description: 'The resume page is now rendered from structured data so the backend can later provide the same DTO contract.'
    },
    sections: [
      {
        title: 'Profile',
        description: 'Shows identity, target role, and personal summary.',
        highlights: ['Name', 'Role Focus', 'Location', 'Summary']
      },
      {
        title: 'Education',
        description: 'Carries school, degree, and education summary.',
        highlights: ['School', 'Degree', 'Timeline']
      },
      {
        title: 'Experience',
        description: 'Carries company history, responsibilities, and project summaries.',
        highlights: ['Company', 'Role', 'Timeline', 'Project Summary']
      },
      {
        title: 'Skills',
        description: 'Highlights frontend, engineering, and cross-platform capabilities.',
        highlights: ['Vue / Nuxt', 'TypeScript', 'Engineering', 'Performance']
      },
      {
        title: 'Contact',
        description: 'Carries email, social accounts, and resume export entries.',
        highlights: ['Email', 'GitHub', 'Download Link']
      }
    ]
  }
}

const projectsContentMap: Record<WebLocale, ProjectsPageContent> = {
  'zh-CN': {
    intro: {
      badge: 'Projects DTO',
      title: '项目列表',
      description: '项目列表当前由统一 DTO 驱动，后续筛选、分页和多语言能力都可以在这层继续扩展。'
    },
    projects: [
      {
        title: 'Resume Platform',
        slug: 'resume-platform',
        description: 'Monorepo 个人内容平台，包含展示站与管理后台。',
        tags: ['Nuxt 4', 'Monorepo', 'Nuxt UI']
      },
      {
        title: 'Design System Draft',
        slug: 'design-system-draft',
        description: '预留 UI 设计系统沉淀方向。',
        tags: ['Design Tokens', 'Reusable UI', 'Theme']
      },
      {
        title: 'i18n Content Hub',
        slug: 'i18n-content-hub',
        description: '预留文案与内容管理中心方向。',
        tags: ['i18n', 'CMS', 'Content Workflow']
      }
    ]
  },
  'en-US': {
    intro: {
      badge: 'Projects DTO',
      title: 'Projects',
      description: 'The project list is now driven by a unified DTO and can later be extended with filters, pagination, and localization.'
    },
    projects: [
      {
        title: 'Resume Platform',
        slug: 'resume-platform',
        description: 'A monorepo content platform with a public site and admin console.',
        tags: ['Nuxt 4', 'Monorepo', 'Nuxt UI']
      },
      {
        title: 'Design System Draft',
        slug: 'design-system-draft',
        description: 'A reserved direction for design system documentation and reusable UI.',
        tags: ['Design Tokens', 'Reusable UI', 'Theme']
      },
      {
        title: 'i18n Content Hub',
        slug: 'i18n-content-hub',
        description: 'A reserved direction for translation workflow and content management.',
        tags: ['i18n', 'CMS', 'Content Workflow']
      }
    ]
  }
}

const projectDetailMap: Record<WebLocale, Record<string, ProjectDetailContent>> = {
  'zh-CN': {
    'resume-platform': {
      slug: 'resume-platform',
      intro: {
        badge: 'Project Detail DTO',
        title: 'resume-platform',
        description: '项目 resume-platform 的详情页当前由统一 DTO 驱动，后续可直接接后台项目详情接口。'
      },
      stats: [
        {
          label: '页面类型',
          value: '动态详情页',
          hint: '用于承载项目详情内容。'
        },
        {
          label: '当前 slug',
          value: 'resume-platform',
          hint: '来自 SDK 数据。'
        },
        {
          label: '下阶段能力',
          value: '接入真实数据',
          hint: '后续对接后台项目内容。'
        }
      ]
    },
    'design-system-draft': {
      slug: 'design-system-draft',
      intro: {
        badge: 'Project Detail DTO',
        title: 'design-system-draft',
        description: '设计系统草案页用于验证动态详情内容的可扩展承载。'
      },
      stats: [
        {
          label: '页面类型',
          value: '动态详情页',
          hint: '用于承载项目详情内容。'
        },
        {
          label: '当前 slug',
          value: 'design-system-draft',
          hint: '来自 SDK 数据。'
        },
        {
          label: '下阶段能力',
          value: '设计系统说明',
          hint: '后续可承载组件库和 token 说明。'
        }
      ]
    },
    'i18n-content-hub': {
      slug: 'i18n-content-hub',
      intro: {
        badge: 'Project Detail DTO',
        title: 'i18n-content-hub',
        description: '内容中心页用于验证文案、内容和项目详情页的统一数据组织。'
      },
      stats: [
        {
          label: '页面类型',
          value: '动态详情页',
          hint: '用于承载项目详情内容。'
        },
        {
          label: '当前 slug',
          value: 'i18n-content-hub',
          hint: '来自 SDK 数据。'
        },
        {
          label: '下阶段能力',
          value: '多语言内容',
          hint: '后续可承载翻译与内容管理结果。'
        }
      ]
    }
  },
  'en-US': {
    'resume-platform': {
      slug: 'resume-platform',
      intro: {
        badge: 'Project Detail DTO',
        title: 'resume-platform',
        description: 'The resume-platform detail page is now rendered from a unified DTO and can later connect to admin project APIs.'
      },
      stats: [
        {
          label: 'Page Type',
          value: 'Dynamic Detail',
          hint: 'Used to carry project detail content.'
        },
        {
          label: 'Current Slug',
          value: 'resume-platform',
          hint: 'Resolved from SDK data.'
        },
        {
          label: 'Next Step',
          value: 'Connect Real Data',
          hint: 'Later powered by admin project content.'
        }
      ]
    },
    'design-system-draft': {
      slug: 'design-system-draft',
      intro: {
        badge: 'Project Detail DTO',
        title: 'design-system-draft',
        description: 'This page validates how a detail page can carry design-system-oriented content.'
      },
      stats: [
        {
          label: 'Page Type',
          value: 'Dynamic Detail',
          hint: 'Used to carry project detail content.'
        },
        {
          label: 'Current Slug',
          value: 'design-system-draft',
          hint: 'Resolved from SDK data.'
        },
        {
          label: 'Next Step',
          value: 'Design System Docs',
          hint: 'Can later carry tokens and component documentation.'
        }
      ]
    },
    'i18n-content-hub': {
      slug: 'i18n-content-hub',
      intro: {
        badge: 'Project Detail DTO',
        title: 'i18n-content-hub',
        description: 'This page validates how translations, content, and project detail data can share one contract.'
      },
      stats: [
        {
          label: 'Page Type',
          value: 'Dynamic Detail',
          hint: 'Used to carry project detail content.'
        },
        {
          label: 'Current Slug',
          value: 'i18n-content-hub',
          hint: 'Resolved from SDK data.'
        },
        {
          label: 'Next Step',
          value: 'Localized Content',
          hint: 'Can later carry translation workflow results.'
        }
      ]
    }
  }
}

async function simulateLatency() {
  await new Promise(resolve => setTimeout(resolve, 80))
}

export async function getHomePageContent(locale: WebLocale = 'zh-CN') {
  await simulateLatency()
  return structuredClone(homeContentMap[locale])
}

export async function getResumePageContent(locale: WebLocale = 'zh-CN') {
  await simulateLatency()
  return structuredClone(resumeContentMap[locale])
}

export async function getProjectsPageContent(locale: WebLocale = 'zh-CN') {
  await simulateLatency()
  return structuredClone(projectsContentMap[locale])
}

export async function getProjectDetailContent(slug: string, locale: WebLocale = 'zh-CN') {
  await simulateLatency()
  return structuredClone(projectDetailMap[locale][slug] ?? {
    slug,
    intro: {
      badge: 'Project Detail DTO',
      title: slug,
      description: locale === 'zh-CN'
        ? `项目 ${slug} 的详情页数据暂未接入，当前使用默认 DTO 占位。`
        : `Detail data for ${slug} is not connected yet, so a fallback DTO is rendered.`
    },
    stats: locale === 'zh-CN'
      ? [
          {
            label: '页面类型',
            value: '动态详情页',
            hint: '用于承载项目详情内容。'
          },
          {
            label: '当前 slug',
            value: slug,
            hint: '来自动态路由参数。'
          },
          {
            label: '下阶段能力',
            value: '等待接入',
            hint: '后续由后台项目管理模块提供详情内容。'
          }
        ]
      : [
          {
            label: 'Page Type',
            value: 'Dynamic Detail',
            hint: 'Used to carry project detail content.'
          },
          {
            label: 'Current Slug',
            value: slug,
            hint: 'Resolved from route params.'
          },
          {
            label: 'Next Step',
            value: 'Waiting for API',
            hint: 'The admin project module will provide detail content later.'
          }
        ]
  })
}

export * from './site-settings.js'
