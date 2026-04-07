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
  icon?: string;
}

export interface ResumeProfileInterestItem {
  label: LocalizedText;
  icon?: string;
}

export interface ResumeProfileHero {
  frontImageUrl: string;
  backImageUrl: string;
  linkUrl: string;
  slogans: LocalizedText[];
}

export interface ResumeProfile {
  fullName: LocalizedText;
  headline: LocalizedText;
  summary: LocalizedText;
  location: LocalizedText;
  email: string;
  phone: string;
  website: string;
  hero: ResumeProfileHero;
  links: ResumeProfileLink[];
  interests: ResumeProfileInterestItem[];
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
  coreFunctions: LocalizedText;
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

export function createDefaultResumeProfileHero(): ResumeProfileHero {
  return {
    frontImageUrl: '/img/avatar.jpg',
    backImageUrl: '/img/avatar2.jpg',
    linkUrl: 'https://github.com/Fridolph/my-resume',
    slogans: [
      createLocalizedText(
        '热爱Coding，生命不息，折腾不止',
        'Driven by coding, always building, always iterating',
      ),
      createLocalizedText(
        '羽毛球爱好者，快乐挥拍，球场飞翔',
        'Badminton lover, happy swings, full-court energy',
      ),
    ],
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
      hero: createDefaultResumeProfileHero(),
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
      headline: createLocalizedText(
        'JS 全栈 / AI Agent 开发工程师',
        'JavaScript Full-Stack / AI Agent Engineer',
      ),
      summary: createLocalizedText(
        '10 年 JavaScript 全栈开发经验，覆盖安全平台、SaaS、能源与内容社区等业务场景，擅长 Vue / React、Node.js、工程化和复杂业务建模，也在持续推进 AI Agent 工作流落地与知识沉淀。',
        'JavaScript full-stack engineer with 10 years of experience across security platforms, SaaS systems, energy products, and content communities. Strong in Vue, React, Node.js, engineering workflows, and complex business modeling, while actively applying AI Agent workflows in real projects.',
      ),
      location: createLocalizedText('中国 成都', 'Chengdu, China'),
      email: '249121486@qq.com',
      phone: '16602835945',
      website: 'https://resume.fridolph.top',
      hero: createDefaultResumeProfileHero(),
      links: [
        {
          label: createLocalizedText('GitHub', 'GitHub'),
          url: 'https://github.com/Fridolph',
          icon: 'ri:github-fill',
        },
        {
          label: createLocalizedText('技术博客', 'Tech Blog'),
          url: 'https://blog.fridolph.top',
          icon: 'ri:article-line',
        },
        {
          label: createLocalizedText('掘金', 'Juejin'),
          url: 'https://juejin.cn/user/3984288320609918',
          icon: 'ri:code-s-slash-line',
        },
      ],
      interests: [
        {
          label: createLocalizedText('羽毛球', 'Badminton'),
          icon: 'ri:dribbble-line',
        },
        {
          label: createLocalizedText('动漫', 'Anime'),
          icon: 'ri:sparkling-line',
        },
        {
          label: createLocalizedText('音乐', 'Music'),
          icon: 'ri:music-2-line',
        },
        {
          label: createLocalizedText('AI Agent 实践', 'AI Agent Practice'),
          icon: 'ri:robot-2-line',
        },
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
        location: createLocalizedText('四川 成都', 'Meishan, Sichuan'),
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
          '成都澳昇能源科技有限责任公司',
          'Chengdu Aosheng Energy Technology Co., Ltd.',
        ),
        role: createLocalizedText('前端开发工程师', 'Frontend Engineer'),
        employmentType: createLocalizedText('全职', 'Full-time'),
        startDate: '2024-08',
        endDate: '至今',
        location: createLocalizedText('成都', 'Chengdu'),
        summary: createLocalizedText(
          '负责 C 端核心业务开发，覆盖项目创建、设计、报价与展示链路，同时参与产品评审、技术方案与数据库设计，并推动 AI 工具进入团队协作流程。',
          'Owns core consumer-facing flows including project creation, design, quoting, and presentation, while contributing to product reviews, technical solution design, database modeling, and AI-assisted team workflows.',
        ),
        highlights: [
          createLocalizedText(
            '独立完成报价系统前端架构设计，支持复杂配置项的动态计算与多方案对比。',
            'Designed the frontend architecture for the quotation system, supporting complex configuration calculations and multi-scheme comparison.',
          ),
          createLocalizedText(
            '优化项目创建到报价展示的主链路，减少无效操作并提升关键转化体验。',
            'Optimized the main flow from project setup to quotation presentation, reducing redundant steps and improving conversion experience.',
          ),
          createLocalizedText(
            '引入 Coze 等 AI 工具与内部 Skill 库，帮助团队沉淀可复用开发流程。',
            'Introduced AI tools such as Coze and internal skill libraries to help the team build reusable delivery workflows.',
          ),
        ],
        technologies: [
          'Nuxt 4',
          'Vue 3',
          'TypeScript',
          'Pinia',
          'Nuxt UI',
          'i18n',
        ],
      },
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
          '负责需求规划、团队协作、技术升级与质量建设，推动前端体系化建设、Monorepo 工程化改造与知识沉淀。',
          'Led requirement planning, team collaboration, technical upgrades, and quality practices, while driving monorepo adoption and a more systematic frontend engineering workflow.',
        ),
        highlights: [
          createLocalizedText(
            '管理 10 人前端团队，制定 TypeScript、ESLint 与提交规范，推动协作方式统一。',
            'Managed a 10-person frontend team and introduced TypeScript, ESLint, and commit conventions to unify collaboration.',
          ),
          createLocalizedText(
            '推动部分项目从 Vue2 升级到 Vue3 + TypeScript，并配合组件库沉淀复用能力。',
            'Promoted Vue 2 to Vue 3 + TypeScript upgrades across projects while contributing reusable component patterns.',
          ),
          createLocalizedText(
            '从 0 建立企业内部知识库并定期组织 Code Review 与技术分享，提升团队质量氛围。',
            'Built the internal knowledge base from scratch and organized regular code reviews and sharing sessions to improve engineering quality.',
          ),
        ],
        technologies: [
          'Vue 3',
          'TypeScript',
          'pnpm',
          'Monorepo',
          'Ant Design Vue',
          'uni-app',
        ],
      },
      {
        companyName: createLocalizedText(
          '成都网思科平科技有限公司',
          'Chengdu Wangsikeping Technology Co., Ltd.',
        ),
        role: createLocalizedText('前端组长', 'Frontend Team Lead'),
        employmentType: createLocalizedText('全职', 'Full-time'),
        startDate: '2017-07',
        endDate: '2024-01',
        location: createLocalizedText('成都', 'Chengdu'),
        summary: createLocalizedText(
          '负责多个 ToB 安全与管理平台的前端架构、规范建设、跨端协作和重点模块交付，长期处理大数据量渲染、实时通信与复杂权限等问题。',
          'Led frontend architecture, engineering standards, cross-team collaboration, and key feature delivery across multiple ToB security and management platforms, with long-term ownership of heavy data rendering, real-time communication, and complex permissions.',
        ),
        highlights: [
          createLocalizedText(
            '搭建项目基础架构并沉淀详细文档、示例代码与开发规范，帮助团队形成稳定协作方式。',
            'Built project foundations with detailed documentation, sample code, and conventions to help the team form a stable collaboration model.',
          ),
          createLocalizedText(
            '处理实时通信、大表格、复杂筛选、导出与私有部署等高复杂度场景，持续优化交付质量。',
            'Handled complex scenarios such as realtime communication, large tables, advanced filtering, exporting, and private deployment to improve delivery quality.',
          ),
          createLocalizedText(
            '推行单元测试、Code Review 与资源共享，持续支持新人和团队规范化建设。',
            'Promoted unit testing, code review, and shared resources while continuously supporting onboarding and team standardization.',
          ),
        ],
        technologies: [
          'Vue 2',
          'Vue 3',
          'TypeScript',
          'ECharts',
          'WebSocket',
          'vxe-table',
          'D3.js',
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
          '参与官网与主项目页面开发，负责高精度还原、组件拆分、响应式适配与前后端联调，也经历了从 jQuery 到 React 工程化的早期转型。',
          'Worked on the company website and core product pages, focusing on precise implementation, componentization, responsive adaptation, and frontend-backend integration, while experiencing an early transition from jQuery to React engineering.',
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
        name: createLocalizedText('GreenSketch', 'GreenSketch'),
        role: createLocalizedText('核心前端开发', 'Core Frontend Engineer'),
        startDate: '2024-09',
        endDate: '至今',
        summary: createLocalizedText(
          '为全球光伏安装商提供在线项目设计与报价服务，支持多国家、多税率、多币种的复杂业务场景。',
          'An online design and quotation platform for global solar installers, supporting multi-country, multi-tax, and multi-currency business scenarios.',
        ),
        coreFunctions: createLocalizedText(
          '覆盖项目设计、报价生成、收益测算、地图选址与多国家业务规则适配等核心能力。',
          'Covers project design, quotation generation, revenue forecasting, map-based planning, and adaptation to multi-country business rules.',
        ),
        highlights: [
          createLocalizedText(
            '设计可扩展的配置计算与收益预测链路，支撑 10+ 配置项联动。',
            'Designed extensible configuration and revenue forecasting flows that support 10+ linked configuration inputs.',
          ),
          createLocalizedText(
            '通过 Web Worker、复杂表单状态管理与多方案对比，保证报价生成的稳定性与体验。',
            'Used Web Workers, complex form state management, and multi-scheme comparison to keep quotation generation stable and responsive.',
          ),
          createLocalizedText(
            '抽象国家策略层，支持税率、币种和法规的动态适配，帮助业务快速扩展到多国市场。',
            'Abstracted a country strategy layer for taxes, currency, and regulations to help the product expand quickly across markets.',
          ),
        ],
        technologies: [
          'Nuxt 4',
          'Vue 3',
          'TypeScript',
          'Nuxt UI',
          'Pinia',
          'ECharts',
          'Google Maps',
          'Web Worker',
        ],
        links: [
          {
            label: createLocalizedText('项目地址', 'Project URL'),
            url: 'https://c.greensketch.ai/au',
            icon: 'ri:external-link-line',
          },
        ],
      },
      {
        name: createLocalizedText('云药客 SaaS 系统', 'YYK SaaS Platform'),
        role: createLocalizedText('前端主管 / 核心前端开发', 'Frontend Lead / Core Frontend Engineer'),
        startDate: '2024-03',
        endDate: '2024-08',
        summary: createLocalizedText(
          '为药械企业提供推广与结算管理的 SaaS 方案，支持多组织、多任务与合规流程。',
          'A SaaS solution for pharmaceutical and medical device companies, supporting multi-organization task settlement and compliance workflows.',
        ),
        coreFunctions: createLocalizedText(
          '覆盖活动配置、任务执行、结算管理、权限协作与多组织业务流程编排。',
          'Covers campaign configuration, task execution, settlement management, permission collaboration, and multi-organization workflow orchestration.',
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
        coreFunctions: createLocalizedText(
          '覆盖安全概览、资产视图、告警处置、终端详情、进程链路与实时数据展示。',
          'Covers security overviews, asset views, alert handling, terminal details, process chains, and realtime data visualization.',
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
        coreFunctions: createLocalizedText(
          '覆盖用户与角色权限、菜单路由控制、子系统入口配置、主题能力与通用后台组件建设。',
          'Covers user and role permissions, menu and route controls, subsystem entry configuration, theming capabilities, and shared admin components.',
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
        coreFunctions: createLocalizedText(
          '覆盖安全态势总览、攻击链路展示、热力图分析、响应式大屏适配与图表联动。',
          'Covers security posture overviews, attack-chain visualizations, heatmap analysis, responsive large-screen layouts, and linked chart interactions.',
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
        technologies: ['Vue 3', 'TypeScript', 'ECharts', 'D3.js', 'Responsive Design'],
        links: [],
      },
      {
        name: createLocalizedText('my-resume 在线简历', 'my-resume Online Resume'),
        role: createLocalizedText('作者 / 维护者', 'Author / Maintainer'),
        startDate: '2024-02',
        endDate: '至今',
        summary: createLocalizedText(
          '围绕个人履历、全栈重构、AI 分析与教程写作持续迭代的在线简历项目，也是当前公开知识库与 RAG 实验的承载体。',
          'An online resume project continuously iterated around personal resume content, full-stack refactoring, AI analysis, and tutorial writing. It also serves as the public knowledge base and RAG playground.',
        ),
        coreFunctions: createLocalizedText(
          '覆盖公开简历展示、后台草稿编辑、发布导出、AI 分析、RAG 检索与教程化开发日志沉淀。',
          'Covers public resume presentation, admin draft editing, publish/export flows, AI analysis, RAG retrieval, and tutorial-style development logs.',
        ),
        highlights: [
          createLocalizedText(
            '记录从开发到部署的全过程，并沉淀为教程、开发日志与可复用模板。',
            'Documents the path from development to deployment and turns it into tutorials, devlogs, and reusable templates.',
          ),
          createLocalizedText(
            '作为当前 monorepo 重构、简历智能分析和知识库实验的统一内容基线。',
            'Acts as the single content baseline for the monorepo refactor, AI resume analysis, and knowledge-base experiments.',
          ),
        ],
        technologies: [
          'Next.js',
          'NestJS',
          'TypeScript',
          'VitePress',
          'AI Provider Adapter',
          'RAG',
        ],
        links: [
          {
            label: createLocalizedText('GitHub 仓库', 'GitHub Repository'),
            url: 'https://github.com/Fridolph/my-resume',
            icon: 'ri:github-fill',
          },
          {
            label: createLocalizedText('在线简历', 'Online Resume'),
            url: 'https://resume.fridolph.top',
            icon: 'ri:link-m',
          },
        ],
      },
    ],
    skills: [
      {
        name: createLocalizedText('前端核心能力', 'Frontend Core'),
        keywords: [
          'HTML',
          'CSS',
          'JavaScript',
          'TypeScript',
          'Vue',
          'Vue 3',
          'React',
          'Next.js',
          'Nuxt',
          'Tailwind CSS',
        ],
      },
      {
        name: createLocalizedText('全栈开发与工程化', 'Full-Stack & Engineering'),
        keywords: [
          'Node.js',
          'NestJS',
          'Vite',
          'Webpack',
          'pnpm',
          'Monorepo',
          'CI/CD',
          'Drizzle ORM',
          'SQLite',
          'MongoDB',
        ],
      },
      {
        name: createLocalizedText('AI Agent 开发', 'AI Agent Development'),
        keywords: [
          'AI Provider Adapter',
          'Prompt Engineering',
          'RAG',
          'Claude Code',
          'Cursor',
          'Codex',
          'Coze',
          'OpenClaw',
        ],
      },
      {
        name: createLocalizedText('质量、性能与安全', 'Quality, Performance & Security'),
        keywords: [
          'Unit Testing',
          'Vitest',
          'Performance Optimization',
          'Web Worker',
          'WebSocket',
          'Responsive Design',
          'Web Security',
          'Linux',
        ],
      },
    ],
    highlights: [
      {
        title: createLocalizedText('10 年全栈业务经验', '10 Years of Product Delivery'),
        description: createLocalizedText(
          '主导和参与安全、SaaS、能源与内容社区等多个业务场景的架构设计与核心模块交付，能在复杂约束下稳定推进落地。',
          'Led or contributed to architecture and core delivery across security, SaaS, energy, and content products, with stable execution under complex constraints.',
        ),
      },
      {
        title: createLocalizedText('AI 工程化实践', 'Applied AI Engineering'),
        description: createLocalizedText(
          '持续把 AI Agent 工作流、Prompt 模板与知识库实验带入真实开发流程，关注“为什么这样设计”和结果可追溯。',
          'Continuously brings AI Agent workflows, prompt templates, and knowledge-base experiments into real delivery flows, with strong attention to design rationale and traceability.',
        ),
      },
      {
        title: createLocalizedText('团队管理与规范建设', 'Team Leadership & Standards'),
        description: createLocalizedText(
          '有团队管理和规范建设经验，持续通过文档、Code Review、测试与分享提升团队协作效率和工程质量。',
          'Experienced in team leadership and engineering standards, continuously improving collaboration and quality through documentation, code review, testing, and sharing.',
        ),
      },
      {
        title: createLocalizedText('开源与技术输出', 'Open Source & Technical Writing'),
        description: createLocalizedText(
          '维护开源项目、技术博客与教程系列，把项目实践沉淀为知识资产，方便复盘、传播与后续产品化。',
          'Maintains open-source projects, technical blogs, and tutorial series, turning delivery experience into reusable knowledge assets for review, sharing, and future productization.',
        ),
      },
    ],
  };
}

function isStringArray(value: unknown): value is string[] {
  return Array.isArray(value) && value.every((item) => typeof item === 'string');
}

function normalizeResumeLink(value: unknown): ResumeProfileLink | null {
  if (!value || typeof value !== 'object') {
    return null;
  }

  const candidate = value as Record<string, unknown>;

  if (!isLocalizedText(candidate.label) || typeof candidate.url !== 'string') {
    return null;
  }

  return {
    label: candidate.label,
    url: candidate.url,
    icon: typeof candidate.icon === 'string' && candidate.icon.trim() ? candidate.icon : undefined,
  };
}

function normalizeResumeInterestItem(value: unknown): ResumeProfileInterestItem | null {
  if (isLocalizedText(value)) {
    return {
      label: value,
    };
  }

  if (!value || typeof value !== 'object') {
    return null;
  }

  const candidate = value as Record<string, unknown>;

  if (!isLocalizedText(candidate.label)) {
    return null;
  }

  return {
    label: candidate.label,
    icon: typeof candidate.icon === 'string' && candidate.icon.trim() ? candidate.icon : undefined,
  };
}

function normalizeResumeProfileHero(value: unknown): ResumeProfileHero {
  const defaults = createDefaultResumeProfileHero();

  if (!value || typeof value !== 'object') {
    return defaults;
  }

  const candidate = value as Record<string, unknown>;
  const slogans = Array.isArray(candidate.slogans)
    ? candidate.slogans.filter(isLocalizedText)
    : defaults.slogans;

  return {
    frontImageUrl:
      typeof candidate.frontImageUrl === 'string' && candidate.frontImageUrl.trim()
        ? candidate.frontImageUrl
        : defaults.frontImageUrl,
    backImageUrl:
      typeof candidate.backImageUrl === 'string' && candidate.backImageUrl.trim()
        ? candidate.backImageUrl
        : defaults.backImageUrl,
    linkUrl:
      typeof candidate.linkUrl === 'string' && candidate.linkUrl.trim()
        ? candidate.linkUrl
        : defaults.linkUrl,
    slogans: slogans.length > 0 ? slogans : defaults.slogans,
  };
}

export function normalizeStandardResume(resume: StandardResume): StandardResume {
  return {
    ...resume,
    profile: {
      ...resume.profile,
      hero: normalizeResumeProfileHero(
        (resume.profile as ResumeProfile & { hero?: ResumeProfileHero }).hero,
      ),
      links: Array.isArray(resume.profile.links)
        ? resume.profile.links
            .map((item) => normalizeResumeLink(item))
            .filter((item): item is ResumeProfileLink => item !== null)
        : [],
      interests: Array.isArray(resume.profile.interests)
        ? resume.profile.interests
            .map((item) => normalizeResumeInterestItem(item))
            .filter((item): item is ResumeProfileInterestItem => item !== null)
        : [],
    },
    education: Array.isArray(resume.education) ? resume.education : [],
    experiences: Array.isArray(resume.experiences) ? resume.experiences : [],
    projects: Array.isArray(resume.projects)
      ? resume.projects.map((item) => {
          if (!item || typeof item !== 'object') {
            return item as ResumeProjectItem;
          }

          const candidate = item as ResumeProjectItem;

          return {
            ...candidate,
            coreFunctions: isLocalizedText(candidate.coreFunctions)
              ? candidate.coreFunctions
              : createEmptyLocalizedText(),
          };
        })
      : [],
    skills: Array.isArray(resume.skills) ? resume.skills : [],
    highlights: Array.isArray(resume.highlights) ? resume.highlights : [],
  };
}

function validateLocalizedTextField(
  value: unknown,
  path: string,
  errors: string[],
) {
  if (!isLocalizedText(value)) {
    errors.push(`${path} must be a localized text object`);
  }
}

function validateLocalizedTextArray(
  value: unknown,
  path: string,
  errors: string[],
) {
  if (!Array.isArray(value)) {
    errors.push(`${path} must be an array`);
    return;
  }

  value.forEach((item, index) => {
    if (!isLocalizedText(item)) {
      errors.push(`${path}[${index}] must be a localized text object`);
    }
  });
}

function validateResumeLinks(
  value: unknown,
  path: string,
  errors: string[],
) {
  if (!Array.isArray(value)) {
    errors.push(`${path} must be an array`);
    return;
  }

  value.forEach((item, index) => {
    if (!item || typeof item !== 'object') {
      errors.push(`${path}[${index}] must be an object`);
      return;
    }

    const candidate = item as Record<string, unknown>;

    if (!isLocalizedText(candidate.label)) {
      errors.push(`${path}[${index}].label must be a localized text object`);
    }

    if (typeof candidate.url !== 'string') {
      errors.push(`${path}[${index}].url must be a string`);
    }

    if (
      typeof candidate.icon !== 'undefined' &&
      typeof candidate.icon !== 'string'
    ) {
      errors.push(`${path}[${index}].icon must be a string when provided`);
    }
  });
}

function validateResumeInterestItems(
  value: unknown,
  path: string,
  errors: string[],
) {
  if (!Array.isArray(value)) {
    errors.push(`${path} must be an array`);
    return;
  }

  value.forEach((item, index) => {
    if (isLocalizedText(item)) {
      return;
    }

    if (!item || typeof item !== 'object') {
      errors.push(`${path}[${index}] must be an object`);
      return;
    }

    const candidate = item as Record<string, unknown>;

    if (!isLocalizedText(candidate.label)) {
      errors.push(`${path}[${index}].label must be a localized text object`);
    }

    if (
      typeof candidate.icon !== 'undefined' &&
      typeof candidate.icon !== 'string'
    ) {
      errors.push(`${path}[${index}].icon must be a string when provided`);
    }
  });
}

export function validateStandardResume(
  resume: StandardResume,
): ResumeValidationResult {
  const errors: string[] = [];

  validateLocalizedTextField(resume.profile.fullName, 'profile.fullName', errors);
  validateLocalizedTextField(resume.profile.headline, 'profile.headline', errors);
  validateLocalizedTextField(resume.profile.summary, 'profile.summary', errors);
  validateLocalizedTextField(resume.profile.location, 'profile.location', errors);
  if (!resume.profile.hero || typeof resume.profile.hero !== 'object') {
    errors.push('profile.hero must be an object');
  } else {
    if (typeof resume.profile.hero.frontImageUrl !== 'string') {
      errors.push('profile.hero.frontImageUrl must be a string');
    }
    if (typeof resume.profile.hero.backImageUrl !== 'string') {
      errors.push('profile.hero.backImageUrl must be a string');
    }
    if (typeof resume.profile.hero.linkUrl !== 'string') {
      errors.push('profile.hero.linkUrl must be a string');
    }
    validateLocalizedTextArray(
      resume.profile.hero.slogans,
      'profile.hero.slogans',
      errors,
    );
  }
  validateResumeLinks(resume.profile.links, 'profile.links', errors);
  validateResumeInterestItems(resume.profile.interests, 'profile.interests', errors);

  if (!Array.isArray(resume.education)) {
    errors.push('education must be an array');
  } else {
    resume.education.forEach((item, index) => {
      validateLocalizedTextField(
        item.schoolName,
        `education[${index}].schoolName`,
        errors,
      );
      validateLocalizedTextField(item.degree, `education[${index}].degree`, errors);
      validateLocalizedTextField(
        item.fieldOfStudy,
        `education[${index}].fieldOfStudy`,
        errors,
      );
      validateLocalizedTextField(item.location, `education[${index}].location`, errors);
      validateLocalizedTextArray(
        item.highlights,
        `education[${index}].highlights`,
        errors,
      );
    });
  }

  if (!Array.isArray(resume.experiences)) {
    errors.push('experiences must be an array');
  } else {
    resume.experiences.forEach((item, index) => {
      validateLocalizedTextField(
        item.companyName,
        `experiences[${index}].companyName`,
        errors,
      );
      validateLocalizedTextField(item.role, `experiences[${index}].role`, errors);
      validateLocalizedTextField(
        item.employmentType,
        `experiences[${index}].employmentType`,
        errors,
      );
      validateLocalizedTextField(item.location, `experiences[${index}].location`, errors);
      validateLocalizedTextField(item.summary, `experiences[${index}].summary`, errors);
      validateLocalizedTextArray(
        item.highlights,
        `experiences[${index}].highlights`,
        errors,
      );

      if (!isStringArray(item.technologies)) {
        errors.push(`experiences[${index}].technologies must be a string array`);
      }
    });
  }

  if (!Array.isArray(resume.projects)) {
    errors.push('projects must be an array');
  } else {
    resume.projects.forEach((item, index) => {
      validateLocalizedTextField(item.name, `projects[${index}].name`, errors);
      validateLocalizedTextField(item.role, `projects[${index}].role`, errors);
      validateLocalizedTextField(item.summary, `projects[${index}].summary`, errors);
      validateLocalizedTextField(
        item.coreFunctions,
        `projects[${index}].coreFunctions`,
        errors,
      );
      validateLocalizedTextArray(
        item.highlights,
        `projects[${index}].highlights`,
        errors,
      );

      if (!isStringArray(item.technologies)) {
        errors.push(`projects[${index}].technologies must be a string array`);
      }

      validateResumeLinks(item.links, `projects[${index}].links`, errors);
    });
  }

  if (!Array.isArray(resume.skills)) {
    errors.push('skills must be an array');
  } else {
    resume.skills.forEach((item, index) => {
      validateLocalizedTextField(item.name, `skills[${index}].name`, errors);

      if (!isStringArray(item.keywords)) {
        errors.push(`skills[${index}].keywords must be a string array`);
      }
    });
  }

  if (!Array.isArray(resume.highlights)) {
    errors.push('highlights must be an array');
  } else {
    resume.highlights.forEach((item, index) => {
      validateLocalizedTextField(item.title, `highlights[${index}].title`, errors);
      validateLocalizedTextField(
        item.description,
        `highlights[${index}].description`,
        errors,
      );
    });
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}
