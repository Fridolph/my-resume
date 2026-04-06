'use client';

import { Button, Tooltip } from '@heroui/react';
import { useMemo, useState } from 'react';

import {
  ResumeLocale,
  ResumeSkillGroup,
} from '../../lib/published-resume-types';
import { readLocalizedText, resumeLabels } from './published-resume-utils';
import { PublishedResumeSectionCard } from './published-resume-section-card';

interface PublishedResumeSkillsSectionProps {
  locale: ResumeLocale;
  skills: ResumeSkillGroup[];
}

type SkillViewMode = 'structure' | 'tag-cloud' | 'chart';
type SkillChartMode = 'radar' | 'pie';

interface ParsedSkillLine {
  label: string | null;
  content: string;
  raw: string;
}

function stripMarkdownBold(value: string): string {
  return value.replace(/^\*\*(.+)\*\*$/u, '$1').trim();
}

function parseSkillLine(raw: string): ParsedSkillLine {
  const trimmed = raw.trim().replace(/^[\-•]\s*/u, '');
  const dividerIndex = trimmed.search(/[:：]/u);

  if (dividerIndex === -1) {
    return {
      label: null,
      content: stripMarkdownBold(trimmed),
      raw,
    };
  }

  const left = stripMarkdownBold(trimmed.slice(0, dividerIndex).trim());
  const right = trimmed.slice(dividerIndex + 1).trim();

  return {
    label: left || null,
    content: right || stripMarkdownBold(trimmed),
    raw,
  };
}

function polarToCartesian(
  centerX: number,
  centerY: number,
  radius: number,
  angleInRadians: number,
) {
  return {
    x: centerX + radius * Math.cos(angleInRadians),
    y: centerY + radius * Math.sin(angleInRadians),
  };
}

function buildRadarPolygon(
  values: number[],
  centerX: number,
  centerY: number,
  radius: number,
) {
  return values
    .map((value, index) => {
      const angle = -Math.PI / 2 + (index / values.length) * Math.PI * 2;
      const point = polarToCartesian(centerX, centerY, radius * value, angle);
      return `${point.x},${point.y}`;
    })
    .join(' ');
}

function buildPieArcPath(
  centerX: number,
  centerY: number,
  radius: number,
  innerRadius: number,
  startAngle: number,
  endAngle: number,
) {
  const startOuter = polarToCartesian(centerX, centerY, radius, startAngle);
  const endOuter = polarToCartesian(centerX, centerY, radius, endAngle);
  const startInner = polarToCartesian(centerX, centerY, innerRadius, endAngle);
  const endInner = polarToCartesian(centerX, centerY, innerRadius, startAngle);
  const largeArcFlag = endAngle - startAngle > Math.PI ? 1 : 0;

  return [
    `M ${startOuter.x} ${startOuter.y}`,
    `A ${radius} ${radius} 0 ${largeArcFlag} 1 ${endOuter.x} ${endOuter.y}`,
    `L ${startInner.x} ${startInner.y}`,
    `A ${innerRadius} ${innerRadius} 0 ${largeArcFlag} 0 ${endInner.x} ${endInner.y}`,
    'Z',
  ].join(' ');
}

const skillViewLabels = {
  zh: {
    structure: '结构',
    tagCloud: '词云',
    chart: '图表',
    radar: '雷达图',
    pie: '饼图',
    rawTooltip: '查看完整原始内容',
    itemCount: '条',
    points: '个能力点',
    totalItems: '总条目数',
    radarCaption: '基于各技能组条目数绘制的覆盖轮廓',
    pieCaption: '基于各技能组条目数绘制的组成关系',
  },
  en: {
    structure: 'Structure',
    tagCloud: 'Tag Cloud',
    chart: 'Chart',
    radar: 'Radar',
    pie: 'Pie',
    rawTooltip: 'View original line',
    itemCount: 'items',
    points: 'capability points',
    totalItems: 'Total items',
    radarCaption: 'Coverage contour based on item counts per group',
    pieCaption: 'Composition based on item counts per group',
  },
} as const;

const chartPalette = [
  'rgba(37, 99, 235, 0.92)',
  'rgba(14, 165, 233, 0.88)',
  'rgba(99, 102, 241, 0.86)',
  'rgba(168, 85, 247, 0.84)',
  'rgba(244, 114, 182, 0.8)',
  'rgba(16, 185, 129, 0.82)',
] as const;

export function PublishedResumeSkillsSection({
  locale,
  skills,
}: PublishedResumeSkillsSectionProps) {
  const labels = resumeLabels[locale];
  const localLabels = skillViewLabels[locale];
  const [viewMode, setViewMode] = useState<SkillViewMode>('structure');
  const [chartMode, setChartMode] = useState<SkillChartMode>('radar');

  const normalizedGroups = useMemo(
    () =>
      skills.map((group) => ({
        ...group,
        parsedKeywords: group.keywords.map(parseSkillLine),
      })),
    [skills],
  );

  if (skills.length === 0) {
    return null;
  }

  const chartGroups = [...normalizedGroups]
    .map((group, index) => ({
      ...group,
      originalIndex: index,
    }))
    .sort((left, right) => {
      if (right.parsedKeywords.length !== left.parsedKeywords.length) {
        return right.parsedKeywords.length - left.parsedKeywords.length;
      }

      return left.originalIndex - right.originalIndex;
    });
  const totalItemCount =
    chartGroups.reduce((sum, group) => sum + group.parsedKeywords.length, 0) || 1;
  const maxItemCount = Math.max(...chartGroups.map((group) => group.parsedKeywords.length), 1);
  const radarValues = chartGroups.map((group) => group.parsedKeywords.length / maxItemCount);
  const pieSlices = chartGroups.reduce<Array<{ label: string; value: number; path: string; color: string }>>(
    (segments, group, index) => {
      const startRatio = segments.reduce((sum, segment) => sum + segment.value, 0) / totalItemCount;
      const endRatio = (segments.reduce((sum, segment) => sum + segment.value, 0) + group.parsedKeywords.length) / totalItemCount;
      const startAngle = -Math.PI / 2 + startRatio * Math.PI * 2;
      const endAngle = -Math.PI / 2 + endRatio * Math.PI * 2;

      segments.push({
        label: readLocalizedText(group.name, locale),
        value: group.parsedKeywords.length,
        path: buildPieArcPath(120, 120, 84, 42, startAngle, endAngle),
        color: chartPalette[index % chartPalette.length],
      });

      return segments;
    },
    [],
  );

  return (
    <PublishedResumeSectionCard
      description={labels.skillsDescription}
      eyebrow={labels.skillsEyebrow}
      title={labels.skillsTitle}
    >
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

      {viewMode === 'structure' ? (
        <div className="grid gap-4 xl:grid-cols-2">
          {normalizedGroups.map((group) => (
            <article
              className="rounded-[28px] border border-slate-200/75 bg-slate-50/85 p-5 dark:border-white/10 dark:bg-white/[0.04]"
              key={`${group.name.en}-${group.keywords.join('-')}`}
            >
              <div className="flex items-center justify-between gap-3">
                <h3 className="text-lg font-semibold tracking-tight text-slate-900 dark:text-white">
                  {readLocalizedText(group.name, locale)}
                </h3>
                <span className="rounded-full border border-slate-200/80 bg-white/80 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-slate-500 dark:border-white/10 dark:bg-white/6 dark:text-slate-300">
                  {group.parsedKeywords.length}
                </span>
              </div>

              <ul className="mt-4 grid gap-3">
                {group.parsedKeywords.map((item) => (
                  <li
                    className="rounded-2xl border border-slate-200/70 bg-white/80 px-4 py-3 text-sm leading-7 text-slate-600 dark:border-white/10 dark:bg-white/6 dark:text-slate-200"
                    key={`${group.name.en}-${item.raw}`}
                  >
                    {item.label ? (
                      <div className="grid gap-1.5">
                        <strong className="text-sm font-semibold leading-6 text-slate-900 dark:text-white">
                          {item.label}
                        </strong>
                        <span className="text-[0.95rem] leading-7 text-slate-600 dark:text-slate-200">
                          {item.content}
                        </span>
                      </div>
                    ) : (
                      <span className="block text-[0.95rem] leading-7">{item.content}</span>
                    )}
                  </li>
                ))}
              </ul>
            </article>
          ))}
        </div>
      ) : null}

      {viewMode === 'tag-cloud' ? (
        <div className="grid gap-4 xl:grid-cols-2">
          {normalizedGroups.map((group) => (
            <article
              className="rounded-[28px] border border-slate-200/75 bg-slate-50/85 p-5 dark:border-white/10 dark:bg-white/[0.04]"
              key={`${group.name.en}-cloud`}
            >
              <div className="flex items-center justify-between gap-3">
                <h3 className="text-lg font-semibold tracking-tight text-slate-900 dark:text-white">
                  {readLocalizedText(group.name, locale)}
                </h3>
                <span className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">
                  {group.parsedKeywords.length} {localLabels.itemCount}
                </span>
              </div>

              <div className="mt-4 flex flex-wrap gap-2.5">
                {group.parsedKeywords.map((item) => (
                  <Tooltip key={`${group.name.en}-${item.raw}`}>
                    <Tooltip.Trigger>
                      <span className="inline-flex cursor-help items-center rounded-full border border-slate-200/80 bg-white/80 px-3 py-2 text-sm font-medium text-slate-600 transition hover:border-blue-300 hover:text-blue-600 dark:border-white/10 dark:bg-white/[0.05] dark:text-slate-200 dark:hover:border-blue-300 dark:hover:text-blue-100">
                        {item.label ?? item.content}
                      </span>
                    </Tooltip.Trigger>
                    <Tooltip.Content offset={10} placement="top">
                      <div className="max-w-xs space-y-1">
                        <p className="text-xs font-semibold uppercase tracking-[0.18em]">
                          {localLabels.rawTooltip}
                        </p>
                        <p className="text-sm leading-6">{item.raw}</p>
                      </div>
                    </Tooltip.Content>
                  </Tooltip>
                ))}
              </div>
            </article>
          ))}
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
              {chartMode === 'radar' ? (
                <svg
                  aria-label={locale === 'zh' ? '技能雷达图' : 'Skill radar chart'}
                  className="mx-auto"
                  height="280"
                  role="img"
                  viewBox="0 0 280 280"
                  width="280"
                >
                  {[0.25, 0.5, 0.75, 1].map((level) => (
                    <polygon
                      fill="none"
                      key={level}
                      points={buildRadarPolygon(
                        Array.from({ length: chartGroups.length }, () => level),
                        140,
                        140,
                        92,
                      )}
                      stroke="rgba(148,163,184,0.28)"
                      strokeWidth="1"
                    />
                  ))}
                  {chartGroups.map((group, index) => {
                    const angle = -Math.PI / 2 + (index / chartGroups.length) * Math.PI * 2;
                    const axisEnd = polarToCartesian(140, 140, 92, angle);
                    const labelPoint = polarToCartesian(140, 140, 114, angle);

                    return (
                      <g key={`${group.name.en}-axis`}>
                        <line
                          stroke="rgba(148,163,184,0.32)"
                          strokeWidth="1"
                          x1="140"
                          x2={axisEnd.x}
                          y1="140"
                          y2={axisEnd.y}
                        />
                        <text
                          fill="currentColor"
                          fontSize="11"
                          textAnchor={labelPoint.x >= 140 ? 'start' : 'end'}
                          x={labelPoint.x}
                          y={labelPoint.y}
                        >
                          {readLocalizedText(group.name, locale)}
                        </text>
                      </g>
                    );
                  })}
                  <polygon
                    fill="rgba(37,99,235,0.18)"
                    points={buildRadarPolygon(radarValues, 140, 140, 92)}
                    stroke="rgba(37,99,235,0.92)"
                    strokeWidth="2"
                  />
                  {radarValues.map((value, index) => {
                    const angle = -Math.PI / 2 + (index / radarValues.length) * Math.PI * 2;
                    const point = polarToCartesian(140, 140, 92 * value, angle);

                    return (
                      <circle
                        cx={point.x}
                        cy={point.y}
                        fill={chartPalette[index % chartPalette.length]}
                        key={`radar-point-${index}`}
                        r="4.5"
                      />
                    );
                  })}
                </svg>
              ) : (
                <svg
                  aria-label={locale === 'zh' ? '技能饼图' : 'Skill pie chart'}
                  className="mx-auto"
                  height="240"
                  role="img"
                  viewBox="0 0 240 240"
                  width="240"
                >
                  {pieSlices.map((slice, index) => (
                    <path d={slice.path} fill={slice.color} key={`${slice.label}-${index}`} />
                  ))}
                  <circle cx="120" cy="120" fill="rgba(255,255,255,0.95)" r="34" />
                  <text
                    fill="currentColor"
                    fontSize="13"
                    textAnchor="middle"
                    x="120"
                    y="112"
                  >
                    {localLabels.totalItems}
                  </text>
                  <text
                    fill="currentColor"
                    fontSize="24"
                    fontWeight="700"
                    textAnchor="middle"
                    x="120"
                    y="140"
                  >
                    {totalItemCount}
                  </text>
                </svg>
              )}
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
                  className="rounded-[24px] border border-slate-200/70 bg-slate-50/75 p-4 dark:border-white/10 dark:bg-white/[0.04]"
                  key={`${group.name.en}-legend-card`}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span
                          aria-hidden="true"
                          className="h-3 w-3 rounded-full"
                          style={{ backgroundColor: chartPalette[index % chartPalette.length] }}
                        />
                        <h4 className="text-sm font-semibold text-slate-900 dark:text-white">
                          {readLocalizedText(group.name, locale)}
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
                        className="rounded-full border border-slate-200/70 bg-white/80 px-3 py-1.5 text-xs font-medium text-slate-500 dark:border-white/10 dark:bg-white/[0.05] dark:text-slate-300"
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
