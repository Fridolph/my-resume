import type { ResumePublishedSnapshot } from '../../lib/published-resume-types';

export const publishedResumeFixture: ResumePublishedSnapshot = {
  status: 'published' as const,
  publishedAt: '2026-03-25T00:00:00.000Z',
  resume: {
    meta: {
      slug: 'standard-resume' as const,
      version: 1 as const,
      defaultLocale: 'zh' as const,
      locales: ['zh', 'en'] as const,
    },
    profile: {
      fullName: {
        zh: '付寅生',
        en: 'Yinsheng Fu',
      },
      headline: {
        zh: '全栈开发工程师',
        en: 'Full-Stack Engineer',
      },
      summary: {
        zh: '专注前端工程化与 Node.js 后端。',
        en: 'Focused on frontend engineering and Node.js backend development.',
      },
      location: {
        zh: '上海',
        en: 'Shanghai',
      },
      email: 'demo@example.com',
      phone: '+86 13800000000',
      website: 'https://example.com',
      links: [
        {
          label: {
            zh: 'GitHub',
            en: 'GitHub',
          },
          url: 'https://github.com/Fridolph',
        },
      ],
      interests: [
        {
          zh: '羽毛球',
          en: 'Badminton',
        },
      ],
    },
    projects: [
      {
        name: {
          zh: 'my-resume 在线简历',
          en: 'my-resume Online Resume',
        },
        role: {
          zh: '作者 / 维护者',
          en: 'Author / Maintainer',
        },
        startDate: '2024-02',
        endDate: '至今',
        summary: {
          zh: '使用 Vite、Vue3、TypeScript 与 TailwindCSS 搭建的在线简历项目。',
          en: 'An online resume project built with Vite, Vue 3, TypeScript, and Tailwind CSS.',
        },
        highlights: [
          {
            zh: '持续以教程和开源形式迭代。',
            en: 'Iterated publicly through tutorials and open source.',
          },
        ],
        technologies: ['Next.js', 'NestJS'],
        links: [],
      },
    ],
    education: [
      {
        schoolName: {
          zh: '四川大学锦江学院',
          en: 'Sichuan University Jinjiang College',
        },
        degree: {
          zh: '本科',
          en: 'Bachelor',
        },
        fieldOfStudy: {
          zh: '通信工程',
          en: 'Communication Engineering',
        },
        startDate: '2012-09',
        endDate: '2016-06',
        location: {
          zh: '四川 眉山',
          en: 'Meishan, Sichuan',
        },
        highlights: [],
      },
    ],
    experiences: [
      {
        companyName: {
          zh: '成都一蟹科技有限公司',
          en: 'Chengdu Yixie Technology Co., Ltd.',
        },
        role: {
          zh: '前端主管',
          en: 'Frontend Lead',
        },
        employmentType: {
          zh: '全职',
          en: 'Full-time',
        },
        startDate: '2024-03',
        endDate: '2024-08',
        location: {
          zh: '成都',
          en: 'Chengdu',
        },
        summary: {
          zh: '负责需求规划、团队协作、技术升级与质量建设。',
          en: 'Led requirement planning, team collaboration, technical upgrades, and quality practices.',
        },
        highlights: [
          {
            zh: '定期组织 Code Review 和技术分享。',
            en: 'Organized regular code reviews and technical sharing sessions.',
          },
        ],
        technologies: ['Vue 3', 'TypeScript'],
      },
    ],
    skills: [
      {
        name: {
          zh: '前端工程化',
          en: 'Frontend Engineering',
        },
        keywords: ['TypeScript', 'React'],
      },
    ],
    highlights: [
      {
        title: {
          zh: '前端架构落地',
          en: 'Frontend Architecture Delivery',
        },
        description: {
          zh: '持续把展示组件、主题和信息结构整理成可复用的前端表达。',
          en: 'Continuously turns visual systems, themes, and information architecture into reusable frontend patterns.',
        },
      },
      {
        title: {
          zh: 'AI 工程化实践',
          en: 'AI Engineering Practice',
        },
        description: {
          zh: '把简历分析、结构化草稿和知识库问答逐步收成可解释、可验证的工程链路。',
          en: 'Shapes resume analysis, structured drafts, and knowledge-base Q&A into explainable engineering workflows.',
        },
      },
      {
        title: {
          zh: '技术写作与开源',
          en: 'Technical Writing and Open Source',
        },
        description: {
          zh: '持续沉淀教程、文章和开源项目，把经验公开成可复用的知识资产。',
          en: 'Continuously packages tutorials, articles, and open-source work into reusable public knowledge assets.',
        },
      },
    ],
  },
};
