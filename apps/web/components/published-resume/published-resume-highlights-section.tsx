import { ResumeHighlightItem, ResumeLocale } from '../../lib/published-resume-types';
import { readLocalizedText, resumeLabels } from './published-resume-utils';

interface PublishedResumeHighlightsSectionProps {
  locale: ResumeLocale;
  highlights: ResumeHighlightItem[];
}

interface HighlightSignalPreset {
  accentClassName: string;
  badge: Record<ResumeLocale, string>;
  keywords: string[];
  signalTags: Record<ResumeLocale, string[]>;
}

const highlightSignalPresets: HighlightSignalPreset[] = [
  {
    accentClassName:
      'from-sky-500/18 via-cyan-500/12 to-transparent dark:from-sky-400/18 dark:via-cyan-400/10',
    badge: {
      zh: '前端架构',
      en: 'Frontend',
    },
    keywords: ['前端', 'frontend', 'ui', 'design system', '组件', 'web'],
    signalTags: {
      zh: ['设计系统', '交互体验', '组件抽象'],
      en: ['Design Systems', 'UI Delivery', 'Component Architecture'],
    },
  },
  {
    accentClassName:
      'from-emerald-500/18 via-teal-500/10 to-transparent dark:from-emerald-400/18 dark:via-teal-400/10',
    badge: {
      zh: '全栈交付',
      en: 'Full-Stack',
    },
    keywords: ['全栈', 'full-stack', 'node', 'nest', 'server', '交付'],
    signalTags: {
      zh: ['端到端交付', '接口协作', '发布链路'],
      en: ['End-to-End', 'API Collaboration', 'Release Flow'],
    },
  },
  {
    accentClassName:
      'from-fuchsia-500/16 via-indigo-500/10 to-transparent dark:from-fuchsia-400/18 dark:via-indigo-400/10',
    badge: {
      zh: 'AI 工程化',
      en: 'AI Ops',
    },
    keywords: ['ai', 'rag', '智能', 'analysis', 'prompt', 'automation'],
    signalTags: {
      zh: ['结构化分析', '自动化工作流', '可解释输出'],
      en: ['Structured Analysis', 'Automation', 'Explainable Output'],
    },
  },
  {
    accentClassName:
      'from-amber-500/18 via-orange-500/10 to-transparent dark:from-amber-400/18 dark:via-orange-400/12',
    badge: {
      zh: '工程质量',
      en: 'Quality',
    },
    keywords: ['测试', '质量', 'review', '工程化', 'performance', '性能', 'ci'],
    signalTags: {
      zh: ['测试基线', 'Code Review', '稳定发布'],
      en: ['Testing', 'Code Review', 'Stable Delivery'],
    },
  },
  {
    accentClassName:
      'from-rose-500/16 via-pink-500/10 to-transparent dark:from-rose-400/18 dark:via-pink-400/10',
    badge: {
      zh: '团队协作',
      en: 'Teamwork',
    },
    keywords: ['团队', '协作', 'lead', '分享', '管理', '沟通'],
    signalTags: {
      zh: ['跨角色协作', '团队建设', '节奏推进'],
      en: ['Cross-Team', 'Team Building', 'Execution Rhythm'],
    },
  },
  {
    accentClassName:
      'from-violet-500/16 via-slate-500/10 to-transparent dark:from-violet-400/18 dark:via-slate-400/12',
    badge: {
      zh: '写作开源',
      en: 'Writing',
    },
    keywords: ['写作', '博客', '文章', '开源', 'open source', 'tutorial', '分享'],
    signalTags: {
      zh: ['教程沉淀', '公共表达', '开源贡献'],
      en: ['Tutorials', 'Public Writing', 'Open Source'],
    },
  },
];

function resolveHighlightSignal(
  item: ResumeHighlightItem,
  locale: ResumeLocale,
  index: number,
) {
  const normalizedText = `${item.title.zh} ${item.title.en} ${item.description.zh} ${item.description.en}`.toLowerCase();
  const preset =
    highlightSignalPresets.find((candidate) =>
      candidate.keywords.some((keyword) => normalizedText.includes(keyword.toLowerCase())),
    ) ?? highlightSignalPresets[index % highlightSignalPresets.length];

  return {
    accentClassName: preset.accentClassName,
    badge: preset.badge[locale],
    tags: preset.signalTags[locale],
  };
}

export function PublishedResumeHighlightsSection({
  locale,
  highlights,
}: PublishedResumeHighlightsSectionProps) {
  const labels = resumeLabels[locale];

  if (highlights.length === 0) {
    return null;
  }

  const signalSummary = Array.from(
    new Set(highlights.map((item, index) => resolveHighlightSignal(item, locale, index).badge)),
  ).slice(0, 4);

  return (
    <section className="relative overflow-hidden rounded-[32px] border border-white/65 bg-white/88 px-5 py-6 shadow-[0_28px_80px_rgba(15,23,42,0.08)] dark:border-white/8 dark:bg-slate-950/82 sm:px-6 lg:px-7">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-40 bg-[radial-gradient(circle_at_top_left,rgba(14,165,233,0.16),transparent_52%),radial-gradient(circle_at_top_right,rgba(168,85,247,0.16),transparent_46%)] dark:bg-[radial-gradient(circle_at_top_left,rgba(56,189,248,0.18),transparent_52%),radial-gradient(circle_at_top_right,rgba(168,85,247,0.18),transparent_48%)]" />

      <div className="relative grid gap-6 lg:grid-cols-[minmax(0,0.7fr)_minmax(0,1.3fr)]">
        <div className="space-y-4">
          <div className="space-y-3">
            <p className="web-eyebrow">{labels.highlightsEyebrow}</p>
            <div className="space-y-2">
              <h2 className="text-2xl font-semibold tracking-tight text-slate-950 dark:text-white sm:text-[2rem]">
                {labels.highlightsTitle}
              </h2>
              <p className="max-w-xl text-base leading-7 text-slate-500 dark:text-slate-400">
                {labels.highlightsDescription}
              </p>
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            {signalSummary.map((signal) => (
              <span
                className="inline-flex items-center rounded-full border border-slate-200/80 bg-white/80 px-3 py-1 text-sm font-medium text-slate-600 shadow-sm dark:border-white/10 dark:bg-white/5 dark:text-slate-200"
                key={signal}
              >
                {signal}
              </span>
            ))}
          </div>

          <div className="rounded-[24px] border border-slate-200/75 bg-slate-50/90 px-4 py-4 dark:border-white/8 dark:bg-white/5">
            <p className="text-xs font-semibold uppercase tracking-[0.28em] text-slate-400">
              {locale === 'zh' ? '信号说明' : 'Signal Lens'}
            </p>
            <p className="mt-3 text-sm leading-7 text-slate-500 dark:text-slate-400">
              {locale === 'zh'
                ? '这一段不再重复讲“经历”，而是把前端、全栈、AI、工程质量、协作与写作这些招聘方更关心的能力信号直接提炼出来。'
                : 'This section no longer repeats chronology. Instead, it surfaces recruiter-facing signals around frontend craft, full-stack delivery, AI engineering, quality, collaboration, and technical writing.'}
            </p>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          {highlights.map((item, index) => {
            const signal = resolveHighlightSignal(item, locale, index);

            return (
              <article
                className="group relative overflow-hidden rounded-[28px] border border-slate-200/70 bg-slate-50/92 p-5 shadow-[0_18px_50px_rgba(15,23,42,0.06)] transition-transform duration-200 hover:-translate-y-1 dark:border-white/8 dark:bg-white/[0.03]"
                key={`${item.title.en}-${item.description.en}-${index}`}
              >
                <div
                  className={`pointer-events-none absolute inset-x-0 top-0 h-24 bg-gradient-to-br ${signal.accentClassName}`}
                />

                <div className="relative flex items-start justify-between gap-3">
                  <span className="inline-flex items-center rounded-full border border-white/70 bg-white/88 px-3 py-1 text-xs font-semibold uppercase tracking-[0.22em] text-slate-600 shadow-sm dark:border-white/10 dark:bg-white/8 dark:text-slate-200">
                    {signal.badge}
                  </span>
                  <span className="text-xs font-medium text-slate-300 dark:text-slate-600">
                    {String(index + 1).padStart(2, '0')}
                  </span>
                </div>

                <div className="relative mt-5 space-y-3">
                  <h3 className="text-xl font-semibold tracking-tight text-slate-950 dark:text-white">
                    {readLocalizedText(item.title, locale)}
                  </h3>
                  <p className="text-sm leading-7 text-slate-500 dark:text-slate-400">
                    {readLocalizedText(item.description, locale)}
                  </p>
                </div>

                <div className="relative mt-5 flex flex-wrap gap-2">
                  {signal.tags.map((tag) => (
                    <span
                      className="inline-flex items-center rounded-full border border-slate-200/80 bg-white/80 px-3 py-1 text-xs font-medium text-slate-600 dark:border-white/10 dark:bg-white/6 dark:text-slate-200"
                      key={`${item.title.en}-${tag}`}
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </article>
            );
          })}
        </div>
      </div>
    </section>
  );
}
