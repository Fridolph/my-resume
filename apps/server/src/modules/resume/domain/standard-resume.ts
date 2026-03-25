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
      fullName: {
        zh: '付寅生',
        en: 'Yinsheng Fu',
      },
      headline: {
        zh: '全栈开发工程师',
        en: 'Full-Stack Engineer',
      },
      summary: {
        zh: '专注于前端工程化、Node.js 后端与 AI 工具链落地。',
        en: 'Focused on frontend engineering, Node.js backend development, and AI workflow integration.',
      },
      location: {
        zh: '中国 上海',
        en: 'Shanghai, China',
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
          zh: '开源项目',
          en: 'Open Source',
        },
      ],
    },
    education: [
      {
        schoolName: {
          zh: '示例大学',
          en: 'Example University',
        },
        degree: {
          zh: '本科',
          en: 'Bachelor',
        },
        fieldOfStudy: {
          zh: '软件工程',
          en: 'Software Engineering',
        },
        startDate: '2016-09',
        endDate: '2020-06',
        location: {
          zh: '中国',
          en: 'China',
        },
        highlights: [
          {
            zh: '主修软件工程与分布式系统',
            en: 'Focused on software engineering and distributed systems.',
          },
        ],
      },
    ],
    experiences: [
      {
        companyName: {
          zh: '示例科技',
          en: 'Example Tech',
        },
        role: {
          zh: '前端负责人',
          en: 'Frontend Lead',
        },
        employmentType: {
          zh: '全职',
          en: 'Full-time',
        },
        startDate: '2022-01',
        endDate: '至今',
        location: {
          zh: '上海',
          en: 'Shanghai',
        },
        summary: {
          zh: '负责中后台平台前端架构与研发规范建设。',
          en: 'Led frontend architecture and engineering standards for internal platforms.',
        },
        highlights: [
          {
            zh: '推动 monorepo 与组件标准化',
            en: 'Promoted monorepo adoption and UI component standardization.',
          },
        ],
        technologies: ['Vue 3', 'React', 'TypeScript', 'NestJS'],
      },
    ],
    projects: [
      {
        name: {
          zh: '个人简历 Monorepo',
          en: 'Personal Resume Monorepo',
        },
        role: {
          zh: '作者 / 维护者',
          en: 'Author / Maintainer',
        },
        startDate: '2026-03',
        endDate: '进行中',
        summary: {
          zh: '以教程型方式逐步构建 admin / web / server 三端项目。',
          en: 'Building an admin / web / server monorepo incrementally as a tutorial-driven project.',
        },
        highlights: [
          {
            zh: '落地鉴权、AI Provider 适配器与内容建模',
            en: 'Implemented authentication, AI provider adapters, and content modeling.',
          },
        ],
        technologies: ['Next.js', 'NestJS', 'pnpm workspace', 'Turborepo'],
        links: [],
      },
    ],
    skills: [
      {
        name: {
          zh: '前端工程化',
          en: 'Frontend Engineering',
        },
        keywords: ['Vue 3', 'React', 'TypeScript', 'Vite'],
      },
    ],
    highlights: [
      {
        title: {
          zh: '教程型开源实践',
          en: 'Tutorial-driven Open Source Practice',
        },
        description: {
          zh: '强调小步提交、开发日志与里程碑教程沉淀。',
          en: 'Focused on small commits, dev logs, and milestone-based tutorial outputs.',
        },
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
