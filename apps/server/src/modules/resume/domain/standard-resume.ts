export type ResumeLocale = 'zh' | 'en';

export interface LocalizedText {
  zh: string;
  en: string;
}

export interface ResumeMeta {
  slug: 'standard-resume';
  version: 1;
  defaultLocale: ResumeLocale;
  locales: ResumeLocale[];
}

export interface ResumeProfileLink {
  label: LocalizedText;
  url: string;
}

export interface ResumeProfile {
  fullName: LocalizedText;
  headline: LocalizedText;
  summary: LocalizedText;
  location: LocalizedText;
  email: string;
  phone: string;
  website: string;
  links: ResumeProfileLink[];
  interests: LocalizedText[];
}

export interface ResumeEducationItem {
  schoolName: LocalizedText;
  degree: LocalizedText;
  fieldOfStudy: LocalizedText;
  startDate: string;
  endDate: string;
  location: LocalizedText;
  highlights: LocalizedText[];
}

export interface ResumeExperienceItem {
  companyName: LocalizedText;
  role: LocalizedText;
  employmentType: LocalizedText;
  startDate: string;
  endDate: string;
  location: LocalizedText;
  summary: LocalizedText;
  highlights: LocalizedText[];
  technologies: string[];
}

export interface ResumeProjectItem {
  name: LocalizedText;
  role: LocalizedText;
  startDate: string;
  endDate: string;
  summary: LocalizedText;
  highlights: LocalizedText[];
  technologies: string[];
  links: ResumeProfileLink[];
}

export interface ResumeSkillGroup {
  name: LocalizedText;
  keywords: string[];
}

export interface ResumeHighlightItem {
  title: LocalizedText;
  description: LocalizedText;
}

export interface StandardResume {
  meta: ResumeMeta;
  profile: ResumeProfile;
  education: ResumeEducationItem[];
  experiences: ResumeExperienceItem[];
  projects: ResumeProjectItem[];
  skills: ResumeSkillGroup[];
  highlights: ResumeHighlightItem[];
}

const STANDARD_RESUME_MODULE_KEYS = [
  'profile',
  'education',
  'experiences',
  'projects',
  'skills',
  'highlights',
] as const;

type StandardResumeModuleKey = (typeof STANDARD_RESUME_MODULE_KEYS)[number];

export interface ResumeValidationResult {
  valid: boolean;
  errors: string[];
}

export function getStandardResumeModuleKeys(): StandardResumeModuleKey[] {
  return [...STANDARD_RESUME_MODULE_KEYS];
}

export function createEmptyLocalizedText(): LocalizedText {
  return {
    zh: '',
    en: '',
  };
}

export function createLocalizedText(zh: string, en: string): LocalizedText {
  return {
    zh,
    en,
  };
}

export function isLocalizedText(value: unknown): value is LocalizedText {
  if (!value || typeof value !== 'object') {
    return false;
  }

  const candidate = value as Record<string, unknown>;
  const keys = Object.keys(candidate).sort();

  return (
    keys.length === 2 &&
    keys[0] === 'en' &&
    keys[1] === 'zh' &&
    typeof candidate.zh === 'string' &&
    typeof candidate.en === 'string'
  );
}

export function createEmptyStandardResume(): StandardResume {
  return {
    meta: {
      slug: 'standard-resume',
      version: 1,
      defaultLocale: 'zh',
      locales: ['zh', 'en'],
    },
    profile: {
      fullName: createEmptyLocalizedText(),
      headline: createEmptyLocalizedText(),
      summary: createEmptyLocalizedText(),
      location: createEmptyLocalizedText(),
      email: '',
      phone: '',
      website: '',
      links: [],
      interests: [],
    },
    education: [],
    experiences: [],
    projects: [],
    skills: [],
    highlights: [],
  };
}

export function createExampleStandardResume(): StandardResume {
  return {
    meta: {
      slug: 'standard-resume',
      version: 1,
      defaultLocale: 'zh',
      locales: ['zh', 'en'],
    },
    profile: {
      fullName: createLocalizedText('付寅生', 'Yinsheng Fu'),
      headline: createLocalizedText('前端工程师 / 前端负责人', 'Frontend Engineer / Frontend Lead'),
      summary: createLocalizedText(
        '8 年前端开发经验，经历 ToB 安全平台、综合管理后台、SaaS 与小程序项目，擅长 Vue3、TypeScript、前端工程化与团队协作，也在持续补齐 React、Next.js、NestJS 与 AI 工具链能力。',
        'Frontend engineer with 8 years of experience across ToB security platforms, integrated admin systems, SaaS products, and mini-program projects. Strong in Vue 3, TypeScript, frontend engineering, and team collaboration, while actively expanding into React, Next.js, NestJS, and AI workflows.',
      ),
      location: createLocalizedText('中国 成都', 'Chengdu, China'),
      email: '249121486@qq.com',
      phone: '16602835945',
      website: 'https://resume.fridolph.top',
      links: [
        {
          label: createLocalizedText('GitHub', 'GitHub'),
          url: 'https://github.com/Fridolph',
        },
        {
          label: createLocalizedText('技术博客', 'Tech Blog'),
          url: 'https://blog.fridolph.top',
        },
        {
          label: createLocalizedText('掘金', 'Juejin'),
          url: 'https://juejin.cn/user/3984288320609918',
        },
      ],
      interests: [
        createLocalizedText('羽毛球', 'Badminton'),
        createLocalizedText('动漫', 'Anime'),
        createLocalizedText('音乐', 'Music'),
        createLocalizedText('开源', 'Open Source'),
      ],
    },
    education: [
      {
        schoolName: createLocalizedText(
          '四川大学锦江学院',
          'Sichuan University Jinjiang College',
        ),
        degree: createLocalizedText('本科', 'Bachelor'),
        fieldOfStudy: createLocalizedText('通信工程', 'Communication Engineering'),
        startDate: '2012-09',
        endDate: '2016-06',
        location: createLocalizedText('四川 眉山', 'Meishan, Sichuan'),
        highlights: [
          createLocalizedText(
            '完成通信工程本科学习，系统接触通信原理、计算机基础与工程实践。',
            'Completed undergraduate study in Communication Engineering with systematic exposure to communication principles, computer fundamentals, and engineering practice.',
          ),
        ],
      },
    ],
    experiences: [
      {
        companyName: createLocalizedText(
          '成都一蟹科技有限公司',
          'Chengdu Yixie Technology Co., Ltd.',
        ),
        role: createLocalizedText('前端主管', 'Frontend Lead'),
        employmentType: createLocalizedText('全职', 'Full-time'),
        startDate: '2024-03',
        endDate: '2024-08',
        location: createLocalizedText('成都', 'Chengdu'),
        summary: createLocalizedText(
          '负责需求规划、团队协作、技术升级与质量建设，推动前端体系化建设和知识沉淀。',
          'Led requirement planning, team collaboration, technical upgrades, and quality practices, while promoting a more systematic frontend engineering workflow and knowledge sharing.',
        ),
        highlights: [
          createLocalizedText(
            '规划并实施 2024 年二、三季度计划，推动团队整体绩效提升。',
            'Planned and executed Q2 and Q3 goals for 2024, improving overall team effectiveness.',
          ),
          createLocalizedText(
            '建立并丰富语雀知识库，沉淀团队协作、规范与复盘材料。',
            'Built and enriched the internal knowledge base to capture collaboration rules, standards, and project learnings.',
          ),
          createLocalizedText(
            '定期组织 Code Review 和技术分享，改善质量保障与团队交流氛围。',
            'Organized regular code reviews and sharing sessions to improve code quality and team communication.',
          ),
        ],
        technologies: ['Vue 3', 'TypeScript', 'uni-app', 'pnpm', 'Monorepo'],
      },
      {
        companyName: createLocalizedText(
          '成都网思科平科技有限公司',
          'OneScorpion Technology Co., Ltd.',
        ),
        role: createLocalizedText('前端组长', 'Frontend Team Lead'),
        employmentType: createLocalizedText('全职', 'Full-time'),
        startDate: '2017-07',
        endDate: '2024-01',
        location: createLocalizedText('成都', 'Chengdu'),
        summary: createLocalizedText(
          '负责多个 ToB 安全与管理平台的前端架构、规范建设、跨端协作和重点模块交付。',
          'Led frontend architecture, engineering standards, cross-team collaboration, and key feature delivery across multiple ToB security and management platforms.',
        ),
        highlights: [
          createLocalizedText(
            '主导前端架构搭建、技术选型与开发规范落地，推动团队形成稳定协作方式。',
            'Led frontend architecture, technical choices, and engineering conventions, helping the team build a stable collaboration model.',
          ),
          createLocalizedText(
            '参与需求梳理、接口约定、单元测试与 Code Review，持续优化交付质量。',
            'Participated in requirement refinement, API contracts, unit testing, and code review to continuously improve delivery quality.',
          ),
          createLocalizedText(
            '承担团队 Leader 角色，推动资源共享、知识沉淀和新人支持。',
            'Acted as team lead to promote shared resources, knowledge accumulation, and onboarding support.',
          ),
        ],
        technologies: [
          'Vue',
          'Vue 3',
          'TypeScript',
          'ECharts',
          'WebSocket',
          'vxe-table',
        ],
      },
      {
        companyName: createLocalizedText(
          '四川爱礼科技有限公司',
          'Sichuan Aili Technology Co., Ltd.',
        ),
        role: createLocalizedText('Web 开发 / 移动端 WebView', 'Web Developer / Mobile WebView Developer'),
        employmentType: createLocalizedText('全职', 'Full-time'),
        startDate: '2016-01',
        endDate: '2017-07',
        location: createLocalizedText('成都', 'Chengdu'),
        summary: createLocalizedText(
          '参与官网与主项目页面开发，负责高精度还原、组件拆分、响应式适配与前后端联调。',
          'Worked on the company website and core product pages, focusing on precise implementation, componentization, responsive adaptation, and frontend-backend integration.',
        ),
        highlights: [
          createLocalizedText(
            '完成页面模块拆分与复用，提升开发效率和维护性。',
            'Split pages into reusable modules to improve development efficiency and maintainability.',
          ),
          createLocalizedText(
            '适配主流移动设备与浏览器，保障一致的浏览体验。',
            'Adapted pages for mainstream mobile devices and browsers to ensure a consistent browsing experience.',
          ),
          createLocalizedText(
            '在架构升级阶段接触 React、Webpack 与工程化开发模式。',
            'Got hands-on experience with React, Webpack, and an early frontend engineering workflow during the architecture upgrade.',
          ),
        ],
        technologies: ['React', 'Webpack', 'Redux', 'jQuery', 'Bootstrap'],
      },
    ],
    projects: [
      {
        name: createLocalizedText('云药客 SaaS 系统', 'YYK SaaS Platform'),
        role: createLocalizedText('核心前端开发', 'Core Frontend Engineer'),
        startDate: '2024-03',
        endDate: '2024-08',
        summary: createLocalizedText(
          '为药械企业提供推广与结算管理的 SaaS 方案，支持多组织、多任务与合规流程。',
          'A SaaS solution for pharmaceutical and medical device companies, supporting multi-organization task settlement and compliance workflows.',
        ),
        highlights: [
          createLocalizedText(
            '将系统中的 Vue2 代码和组件重构到 Vue3 + TypeScript，并升级 antdVue 版本。',
            'Refactored legacy Vue 2 code and components to Vue 3 + TypeScript and upgraded antdVue.',
          ),
          createLocalizedText(
            '引入 pnpm 与 monorepo 思路，改善分支与依赖管理效率。',
            'Introduced pnpm and monorepo practices to improve dependency and branch management.',
          ),
          createLocalizedText(
            '设计组合式卡片、模式入口、组合搜索等可复用业务组件。',
            'Designed reusable business components such as composite cards, mode entry points, and combined search.',
          ),
        ],
        technologies: ['Vue 3', 'TypeScript', 'Ant Design Vue', 'Pinia', 'pnpm'],
        links: [],
      },
      {
        name: createLocalizedText('悬壶医讯', 'XuanHu News'),
        role: createLocalizedText('小程序前端开发', 'Mini Program Frontend Engineer'),
        startDate: '2024-03',
        endDate: '2024-08',
        summary: createLocalizedText(
          '面向医生的互动交流平台，负责真实世界 RWS、抽奖活动等模块迭代，并推进 uni-app 重构方案。',
          'An interaction platform for doctors, where I worked on RWS, lottery modules, and the uni-app migration plan.',
        ),
        highlights: [
          createLocalizedText(
            '负责真实世界 RWS 和抽奖活动模块的开发与优化。',
            'Developed and optimized the RWS and lottery modules in the mini program.',
          ),
          createLocalizedText(
            '参与 Vue3 + TypeScript + Tailwind + uView UI 的 uni-app 重构调研与推进。',
            'Participated in researching and promoting a uni-app refactor based on Vue 3, TypeScript, Tailwind, and uView UI.',
          ),
        ],
        technologies: ['uni-app', 'Vue 3', 'TypeScript', 'Tailwind CSS', 'uView UI'],
        links: [],
      },
      {
        name: createLocalizedText(
          'EDR - 终端威胁侦测与响应平台',
          'EDR - Endpoint Detection and Response Platform',
        ),
        role: createLocalizedText('前端负责人', 'Frontend Lead'),
        startDate: '2019-01',
        endDate: '2024-01',
        summary: createLocalizedText(
          '面向政企安全场景的终端侦测与响应平台，聚焦资产、告警、终端与进程的可视化管理与实时响应。',
          'A security platform for enterprise environments that visualizes assets, alerts, terminals, and processes for real-time response.',
        ),
        highlights: [
          createLocalizedText(
            '主导前端架构、基础模块和示例文档建设，引导团队遵循最佳实践。',
            'Led frontend architecture, base modules, and example documentation to guide the team toward best practices.',
          ),
          createLocalizedText(
            '完成安全概览、资产详情、WebSocket 实时展示及多类业务组件封装。',
            'Delivered the security overview, asset detail pages, WebSocket-based realtime views, and several reusable business components.',
          ),
          createLocalizedText(
            '为大数据量场景设计前端过滤、预缓存与 Web Worker 方案，优化加载性能。',
            'Designed client-side filtering, pre-caching, and Web Worker strategies for heavy data scenarios to improve performance.',
          ),
        ],
        technologies: ['Vue', 'iView', 'vxe-table', 'ECharts', 'D3.js', 'WebSocket'],
        links: [],
      },
      {
        name: createLocalizedText('Admin - 综合管理后台', 'Admin - Integrated Management System'),
        role: createLocalizedText('核心前端开发 / 架构升级', 'Core Frontend Engineer / Architecture Upgrade'),
        startDate: '2022-01',
        endDate: '2024-01',
        summary: createLocalizedText(
          '公司核心综合管理后台，用于统一管理用户权限、子系统入口与定制模块展示。',
          'The company’s integrated admin platform used to manage user permissions, subsystem access, and customized module visibility.',
        ),
        highlights: [
          createLocalizedText(
            '主导项目升级到 Vue3，完善构建配置和开发规范。',
            'Led the upgrade to Vue 3 and improved the build configuration and development conventions.',
          ),
          createLocalizedText(
            '定义主题变量和组件规范，封装通用表单、上传、高级搜索等能力。',
            'Defined theme variables and component conventions, and encapsulated common forms, uploads, and advanced search.',
          ),
          createLocalizedText(
            '设计并开发路由权限、菜单权限与多角色能力边界。',
            'Designed and implemented route permissions, menu permissions, and multi-role capability boundaries.',
          ),
        ],
        technologies: ['Vue 3', 'TypeScript', 'Naive UI', 'ECharts', 'vue-i18n'],
        links: [],
      },
      {
        name: createLocalizedText('LC 安全分析大屏', 'LC Security Analytics Dashboard'),
        role: createLocalizedText('前端开发', 'Frontend Engineer'),
        startDate: '2021-01',
        endDate: '2024-01',
        summary: createLocalizedText(
          '结合安全数据做态势感知与可视化展示，帮助用户快速理解整体安全状态。',
          'A security visualization dashboard built on top of platform data to help users quickly understand the overall security situation.',
        ),
        highlights: [
          createLocalizedText(
            '通过 CSS、SVG、响应式布局和 ATT&CK 热力图优化大屏体验。',
            'Improved the large-screen experience through CSS, SVG, responsive layout, and ATT&CK heatmap visualizations.',
          ),
          createLocalizedText(
            '针对首屏白屏、图表更新与多尺寸设备展示做性能优化。',
            'Optimized first-screen loading, chart updates, and display across multiple screen sizes.',
          ),
        ],
        technologies: ['Vue 3', 'TypeScript', 'ECharts', 'D3.js'],
        links: [],
      },
      {
        name: createLocalizedText('环球礼仪知识平台', 'Global Etiquette Knowledge Platform'),
        role: createLocalizedText('Web 开发', 'Web Developer'),
        startDate: '2016-01',
        endDate: '2017-07',
        summary: createLocalizedText(
          '传统内容社区网站，在平台升级阶段从多页面模式过渡到 Webpack + React + Redux 的工程化模式。',
          'A traditional content community website that evolved from a multi-page setup to a Webpack + React + Redux engineering workflow.',
        ),
        highlights: [
          createLocalizedText(
            '负责静态页面与样式编码，兼顾视觉还原和用户体验。',
            'Implemented static pages and styles with a strong focus on design fidelity and user experience.',
          ),
          createLocalizedText(
            '封装滚动、全屏特效、工具栏与动画等工具模块，提升页面复用度。',
            'Encapsulated utility modules for scrolling, fullscreen effects, toolbars, and animations to improve reuse.',
          ),
          createLocalizedText(
            '完成多端适配和兼容性处理，适应早期前端工程化转型。',
            'Handled responsive adaptation and browser compatibility during the team’s transition to frontend engineering.',
          ),
        ],
        technologies: ['React', 'Webpack', 'Redux', 'jQuery', 'Bootstrap'],
        links: [],
      },
      {
        name: createLocalizedText('my-resume 在线简历', 'my-resume Online Resume'),
        role: createLocalizedText('作者 / 维护者', 'Author / Maintainer'),
        startDate: '2024-02',
        endDate: '至今',
        summary: createLocalizedText(
          '使用 Vite、Vue3、TypeScript 与 TailwindCSS 搭建的在线简历项目，并持续以教程和开源形式迭代。',
          'An online resume project built with Vite, Vue 3, TypeScript, and Tailwind CSS, iterated publicly through tutorials and open source.',
        ),
        highlights: [
          createLocalizedText(
            '完整记录从开发到上线的过程，并沉淀为文章与可复用模板。',
            'Documented the full path from development to deployment and turned it into articles and reusable templates.',
          ),
          createLocalizedText(
            '作为当前 monorepo 重构的内容来源与迁移基线。',
            'Serves as the source content and migration baseline for the current monorepo refactor.',
          ),
        ],
        technologies: ['Vite', 'Vue 3', 'TypeScript', 'Tailwind CSS'],
        links: [
          {
            label: createLocalizedText('GitHub 仓库', 'GitHub Repository'),
            url: 'https://github.com/Fridolph/my-resume',
          },
          {
            label: createLocalizedText('在线简历', 'Online Resume'),
            url: 'https://resume.fridolph.top',
          },
        ],
      },
    ],
    skills: [
      {
        name: createLocalizedText('前端基础与框架', 'Frontend Fundamentals & Frameworks'),
        keywords: [
          'HTML',
          'CSS',
          'JavaScript',
          'TypeScript',
          'Vue',
          'Vue 3',
          'React',
          'uni-app',
        ],
      },
      {
        name: createLocalizedText('工程化与质量', 'Engineering & Quality'),
        keywords: [
          'Vite',
          'Webpack',
          'pnpm',
          'Monorepo',
          'JSDoc',
          'Unit Testing',
          'GitLab CI',
          'Jenkins',
        ],
      },
      {
        name: createLocalizedText('UI 与可视化', 'UI & Visualization'),
        keywords: [
          'Tailwind CSS',
          'Naive UI',
          'Ant Design Vue',
          'Element UI',
          'ECharts',
          'D3.js',
          'vxe-table',
        ],
      },
      {
        name: createLocalizedText('服务端与安全', 'Backend & Security'),
        keywords: [
          'Node.js',
          'Koa',
          'NestJS',
          'Linux',
          'Web Security',
          'WebSocket',
          'Responsive Design',
        ],
      },
    ],
    highlights: [
      {
        title: createLocalizedText('个人项目与知识沉淀', 'Personal Projects & Knowledge Sharing'),
        description: createLocalizedText(
          '长期维护 `my-element-plus`、`my-program`、`FE-prepare-interview`、`fridolph` 等仓库，持续整理前端学习资料、项目经验与教程输出。',
          'Maintains repositories such as `my-element-plus`, `my-program`, `FE-prepare-interview`, and `fridolph`, continuously organizing frontend learning materials, project experience, and tutorial content.',
        ),
      },
      {
        title: createLocalizedText('开源参与', 'Open Source Contributions'),
        description: createLocalizedText(
          '参与 MDN 感知性能文章翻译、`hexo-theme-butterfly` 优化以及简历项目开源分享，强调可复用与可传播。',
          'Contributed to MDN perceived performance translation, improvements in `hexo-theme-butterfly`, and open-sourced the resume project with a focus on reusability and knowledge sharing.',
        ),
      },
      {
        title: createLocalizedText('团队建设与规范实践', 'Team Building & Engineering Standards'),
        description: createLocalizedText(
          '通过团队文档、UI 规范、代码规范、Code Review 与技术分享，持续提升协作效率与项目可维护性。',
          'Improved collaboration efficiency and maintainability through team documentation, UI standards, coding conventions, code reviews, and technical sharing.',
        ),
      },
    ],
  };
}

export function validateStandardResume(
  resume: StandardResume,
): ResumeValidationResult {
  const errors: string[] = [];

  if (!isLocalizedText(resume.profile.fullName)) {
    errors.push('profile.fullName must be a localized text object');
  }

  if (!isLocalizedText(resume.profile.headline)) {
    errors.push('profile.headline must be a localized text object');
  }

  if (!isLocalizedText(resume.profile.summary)) {
    errors.push('profile.summary must be a localized text object');
  }

  if (!isLocalizedText(resume.profile.location)) {
    errors.push('profile.location must be a localized text object');
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}
