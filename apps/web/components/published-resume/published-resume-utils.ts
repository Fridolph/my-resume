import {
  LocalizedText,
  ResumeEducationItem,
  ResumeExperienceItem,
  ResumeLocale,
  ResumeProjectItem,
} from '../../lib/published-resume-types';

export function readLocalizedText(
  value: LocalizedText,
  locale: ResumeLocale,
): string {
  return value[locale];
}

export function formatPeriod(
  item: ResumeProjectItem | ResumeExperienceItem | ResumeEducationItem,
): string {
  return `${item.startDate} - ${item.endDate}`;
}

export function formatPublishedAt(
  publishedAt: string,
  locale: ResumeLocale,
): string {
  return new Date(publishedAt).toLocaleString(
    locale === 'zh' ? 'zh-CN' : 'en-US',
    {
      hour12: false,
    },
  );
}

export const resumeLabels = {
  zh: {
    pageEyebrow: '公开简历',
    emptyTitle: '当前还没有已发布的公开简历内容。',
    emptyDescription:
      '请先通过后台更新草稿并执行发布动作，公开站才会读取到最新已发布版本。',
    publishedAt: '已发布于',
    exportMarkdown: '导出 Markdown',
    exportPdf: '导出 PDF',
    experienceEyebrow: '工作经历',
    experienceTitle: '职业经历',
    experienceDescription: '聚焦过往公司的职责范围、业务场景与关键成果。',
    projectsEyebrow: '项目经历',
    projectsTitle: '代表项目',
    projectsDescription: '按标准模型展示项目背景、职责、亮点与技术栈。',
    educationEyebrow: '教育经历',
    educationTitle: '教育背景',
    educationDescription: '保留稳定学历信息，避免和项目型内容混排。',
    skillsEyebrow: '技能清单',
    skillsTitle: '技能结构',
    skillsDescription: '按类别聚合技术关键词，便于后续主题化展示。',
    highlightsEyebrow: '亮点',
    highlightsTitle: '补充亮点',
    highlightsDescription: '沉淀个人项目、开源参与与团队建设等补充信息。',
    interestsEyebrow: '兴趣方向',
    interestsTitle: '个人兴趣',
  },
  en: {
    pageEyebrow: 'Published Resume',
    emptyTitle: 'There is no published resume content yet.',
    emptyDescription:
      'Please update the draft and publish it from the admin dashboard before the public site can read the latest version.',
    publishedAt: 'Published at',
    exportMarkdown: 'Export Markdown',
    exportPdf: 'Export PDF',
    experienceEyebrow: 'Experience',
    experienceTitle: 'Work Experience',
    experienceDescription:
      'Highlights company scope, responsibilities, delivery context, and key outcomes.',
    projectsEyebrow: 'Projects',
    projectsTitle: 'Selected Projects',
    projectsDescription:
      'Shows project background, role, highlights, and technology stack from the standard model.',
    educationEyebrow: 'Education',
    educationTitle: 'Education',
    educationDescription:
      'Keeps stable academic information separated from project-focused content.',
    skillsEyebrow: 'Skills',
    skillsTitle: 'Skill Structure',
    skillsDescription:
      'Groups technical keywords by category for future theme and template expansion.',
    highlightsEyebrow: 'Highlights',
    highlightsTitle: 'Additional Highlights',
    highlightsDescription:
      'Captures personal projects, open-source work, and team-building achievements.',
    interestsEyebrow: 'Interests',
    interestsTitle: 'Personal Interests',
  },
} as const;
