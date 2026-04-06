'use client';

import { Button, Tooltip } from '@heroui/react';
import { useThemeMode } from '@my-resume/ui/theme';
import * as echarts from 'echarts';
import { useEffect, useMemo, useRef, useState } from 'react';

import {
  ResumeLocale,
  ResumeSkillGroup,
} from '../../lib/published-resume-types';
import { readLocalizedText, resumeLabels } from './published-resume-utils';
import { PublishedResumeSectionCard } from './published-resume-section-card';
import {
  buildPieChartOption,
  buildRadarChartOption,
  buildSkillCloudTokens,
  getSkillChartPalette,
  normalizeSkillGroups,
  rankSkillGroups,
} from './published-resume-skills-utils';

interface PublishedResumeSkillsSectionProps {
  locale: ResumeLocale;
  skills: ResumeSkillGroup[];
}

type SkillViewMode = 'structure' | 'tag-cloud' | 'chart';
type SkillChartMode = 'radar' | 'pie';

const skillViewLabels = {
  zh: {
    structure: '结构',
    tagCloud: '词云',
    chart: '图表',
    radar: '雷达图',
    pie: '饼图',
    itemCount: '条',
    points: '个技能点',
    radarCaption: '按技能组条目数生成的覆盖轮廓',
    pieCaption: '按技能组条目数生成的分布关系',
  },
  en: {
    structure: 'Structure',
    tagCloud: 'Tag Cloud',
    chart: 'Chart',
    radar: 'Radar',
    pie: 'Pie',
    itemCount: 'items',
    points: 'capability points',
    radarCaption: 'Coverage contour based on item counts per group',
    pieCaption: 'Distribution based on item counts per group',
  },
} as const;

function SkillChartCanvas({
  ariaLabel,
  option,
}: {
  ariaLabel: string;
  option: echarts.EChartsOption;
}) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const isJsdom =
    typeof navigator !== 'undefined' && /jsdom/i.test(navigator.userAgent);

  useEffect(() => {
    if (!containerRef.current || isJsdom) {
      return;
    }

    const chart = echarts.init(containerRef.current, undefined, {
      renderer: 'svg',
    });

    chart.setOption(option);

    const handleResize = () => chart.resize();
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      chart.dispose();
    };
  }, [isJsdom, option]);

  return <div aria-label={ariaLabel} className="skills-echart-canvas" ref={containerRef} role="img" />;
}

export function PublishedResumeSkillsSection({
  locale,
  skills,
}: PublishedResumeSkillsSectionProps) {
  const labels = resumeLabels[locale];
  const localLabels = skillViewLabels[locale];
  const [viewMode, setViewMode] = useState<SkillViewMode>('structure');
  const [chartMode, setChartMode] = useState<SkillChartMode>('radar');
  const { theme: themeMode } = useThemeMode();

  const normalizedGroups = useMemo(
    () => normalizeSkillGroups(skills),
    [skills],
  );
  const chartGroups = useMemo(
    () => rankSkillGroups(normalizedGroups, locale),
    [locale, normalizedGroups],
  );
  const cloudTokens = useMemo(
    () => buildSkillCloudTokens(normalizedGroups, locale),
    [locale, normalizedGroups],
  );

  const radarOption = useMemo(
    () => buildRadarChartOption(chartGroups, locale, themeMode),
    [chartGroups, locale, themeMode],
  );
  const pieOption = useMemo(
    () => buildPieChartOption(chartGroups, locale, themeMode),
    [chartGroups, locale, themeMode],
  );

  if (skills.length === 0) {
    return null;
  }

  const toolbar = (
    <div className="skills-toolbar">
      <div className="skills-toolbar-controls">
        <div className="inline-flex rounded-full border border-slate-200/80 bg-slate-50/90 p-1 dark:border-white/10 dark:bg-white/[0.04]">
          {([
            ['structure', localLabels.structure],
            ['tag-cloud', localLabels.tagCloud],
            ['chart', localLabels.chart],
          ] as const).map(([mode, label]) => (
            <Button
              className="rounded-full px-4"
              key={mode}
              onClick={() => setViewMode(mode)}
              size="sm"
              type="button"
              variant={viewMode === mode ? 'primary' : 'ghost'}
            >
              {label}
            </Button>
          ))}
        </div>
      </div>

      {viewMode === 'chart' ? (
        <div className="skills-toolbar-controls">
          <div className="inline-flex rounded-full border border-slate-200/80 bg-slate-50/90 p-1 dark:border-white/10 dark:bg-white/[0.04]">
            {([
              ['radar', localLabels.radar],
              ['pie', localLabels.pie],
            ] as const).map(([mode, label]) => (
              <Button
                className="rounded-full px-4"
                key={mode}
                onClick={() => setChartMode(mode)}
                size="sm"
                type="button"
                variant={chartMode === mode ? 'primary' : 'ghost'}
              >
                {label}
              </Button>
            ))}
          </div>
        </div>
      ) : null}
    </div>
  );

  return (
    <PublishedResumeSectionCard
      action={toolbar}
      description={labels.skillsDescription}
      eyebrow={labels.skillsEyebrow}
      title={labels.skillsTitle}
    >
      {viewMode === 'structure' ? (
        <div className="grid gap-4 xl:grid-cols-2">
          {normalizedGroups.map((group) => (
            <article
              className="rounded-[26px] border border-slate-200/70 bg-slate-50/82 p-5 dark:border-white/10 dark:bg-white/[0.035]"
              key={`${group.name.en}-${group.keywords.join('-')}`}
            >
              <div className="flex items-center justify-between gap-3">
                <h3 className="text-lg font-semibold tracking-tight text-slate-900 dark:text-white">
                  {readLocalizedText(group.name, locale)}
                </h3>
                <span className="rounded-full border border-slate-200/80 bg-white/80 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-slate-500 dark:border-white/10 dark:bg-white/6 dark:text-slate-300">
                  {group.parsedKeywords.length}
                </span>
              </div>

              <ul className="mt-4 grid gap-3">
                {group.parsedKeywords.map((item) => (
                  <li
                    className="rounded-2xl border border-slate-200/70 bg-white/84 px-4 py-3.5 text-sm text-slate-600 dark:border-white/10 dark:bg-white/[0.05] dark:text-slate-200"
                    key={`${group.name.en}-${item.raw}`}
                  >
                    {item.label ? (
                      <div className="grid gap-1.5">
                        <strong className="text-sm font-semibold leading-6 text-slate-900 dark:text-white">
                          {item.label}
                        </strong>
                        <span className="text-[0.96rem] leading-7 text-slate-600 dark:text-slate-200">
                          {item.content}
                        </span>
                      </div>
                    ) : (
                      <span className="block text-[0.96rem] leading-7">{item.content}</span>
                    )}
                  </li>
                ))}
              </ul>
            </article>
          ))}
        </div>
      ) : null}

      {viewMode === 'tag-cloud' ? (
        <div className="skills-cloud-surface">
          <div className="skills-cloud-wall">
            {cloudTokens.map((token) => (
              <Tooltip key={token.id}>
                <Tooltip.Trigger>
                  <span
                    className={[
                      'skills-cloud-token',
                      token.sizeClassName,
                      token.rotateClassName,
                    ].join(' ')}
                    data-tone={token.toneIndex % 6}
                  >
                    {token.label}
                  </span>
                </Tooltip.Trigger>
                <Tooltip.Content offset={10} placement="top">
                  <div className="max-w-xs space-y-1">
                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
                      {token.groupLabel}
                    </p>
                    <p className="text-sm leading-6">{token.raw}</p>
                  </div>
                </Tooltip.Content>
              </Tooltip>
            ))}
          </div>
        </div>
      ) : null}

      {viewMode === 'chart' ? (
        <div className="skills-chart-layout">
          <article className="skills-chart-surface">
            <div className="space-y-1">
              <h3 className="text-lg font-semibold tracking-tight text-slate-900 dark:text-white">
                {chartMode === 'radar' ? localLabels.radar : localLabels.pie}
              </h3>
              <p className="text-sm leading-6 text-slate-500 dark:text-slate-400">
                {chartMode === 'radar' ? localLabels.radarCaption : localLabels.pieCaption}
              </p>
            </div>

            <div className="skills-chart-visual">
              <SkillChartCanvas
                ariaLabel={chartMode === 'radar'
                  ? locale === 'zh'
                    ? '技能雷达图'
                    : 'Skill radar chart'
                  : locale === 'zh'
                    ? '技能饼图'
                    : 'Skill pie chart'}
                option={chartMode === 'radar' ? radarOption : pieOption}
              />
            </div>
          </article>

          <div className="grid gap-3">
            {chartGroups.map((group, index) => {
              const count = group.parsedKeywords.length;
              const featuredLabels = group.parsedKeywords
                .map((item) => item.label ?? item.content)
                .slice(0, 4);

              return (
                <article
                  className="rounded-[24px] border border-slate-200/70 bg-slate-50/80 p-4 dark:border-white/10 dark:bg-white/[0.04]"
                  key={`${group.name.en}-legend-card`}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span
                          aria-hidden="true"
                          className="h-3 w-3 rounded-full"
                          style={{ backgroundColor: getSkillChartPalette(index) }}
                        />
                        <h4 className="text-sm font-semibold text-slate-900 dark:text-white">
                          {group.displayName}
                        </h4>
                      </div>
                      <p className="text-sm text-slate-500 dark:text-slate-400">
                        {count} {localLabels.points}
                      </p>
                    </div>
                    <span className="text-2xl font-semibold text-slate-900 dark:text-white">
                      {count}
                    </span>
                  </div>

                  <div className="mt-3 flex flex-wrap gap-2">
                    {featuredLabels.map((label) => (
                      <span
                        className="rounded-full border border-slate-200/70 bg-white/84 px-3 py-1.5 text-xs font-medium text-slate-500 dark:border-white/10 dark:bg-white/[0.05] dark:text-slate-300"
                        key={`${group.name.en}-${label}-legend`}
                      >
                        {label}
                      </span>
                    ))}
                  </div>
                </article>
              );
            })}
          </div>
        </div>
      ) : null}
    </PublishedResumeSectionCard>
  );
}
