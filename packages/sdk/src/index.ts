import type {
  HomePageContent,
  ProjectDetailContent,
  ProjectsPageContent,
  ResumePageContent
} from '@repo/types'

const homeContent: HomePageContent = {
  intro: {
    badge: 'W4 内容读取层',
    title: 'Fridolph Web',
    description: 'W4 已开始将 Web 页面从静态模板切换为结构化内容驱动，后续这层数据可以替换为真实接口返回。'
  },
  stats: [
    {
      label: '当前阶段',
      value: 'W4',
      hint: '内容读取层开始接管页面。'
    },
    {
      label: '内容 DTO',
      value: '4 组',
      hint: '首页、简历页、项目页、项目详情页。'
    },
    {
      label: '数据来源',
      value: 'SDK Mock',
      hint: '后续可替换为后台 API。'
    }
  ],
  features: [
    {
      title: '在线简历',
      description: '通过结构化简历 DTO 驱动章节展示。',
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
      title: '内容平台',
      description: '当前由 SDK mock 提供数据，后续可无缝替换为后台服务。',
      to: '/projects/resume-platform',
      badge: 'Content'
    }
  ]
}

const resumeContent: ResumePageContent = {
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
}

const projectsContent: ProjectsPageContent = {
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
}

const projectDetailMap: Record<string, ProjectDetailContent> = {
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
}

async function simulateLatency() {
  await new Promise(resolve => setTimeout(resolve, 80))
}

export async function getHomePageContent() {
  await simulateLatency()
  return structuredClone(homeContent)
}

export async function getResumePageContent() {
  await simulateLatency()
  return structuredClone(resumeContent)
}

export async function getProjectsPageContent() {
  await simulateLatency()
  return structuredClone(projectsContent)
}

export async function getProjectDetailContent(slug: string) {
  await simulateLatency()
  return structuredClone(projectDetailMap[slug] ?? {
    slug,
    intro: {
      badge: 'Project Detail DTO',
      title: slug,
      description: `项目 ${slug} 的详情页数据暂未接入，当前使用默认 DTO 占位。`
    },
    stats: [
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
  })
}
