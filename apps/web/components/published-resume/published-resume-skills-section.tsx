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

const skillViewLabels = {
  zh: {
    structure: '结构',
    tagCloud: '词云',
    chart: '图表',
    rawTooltip: '查看完整原始内容',
    itemCount: '条',
    points: '个能力点',
  },
  en: {
    structure: 'Structure',
    tagCloud: 'Tag Cloud',
    chart: 'Chart',
    rawTooltip: 'View original line',
    itemCount: 'items',
    points: 'capability points',
  },
} as const;

export function PublishedResumeSkillsSection({
  locale,
  skills,
}: PublishedResumeSkillsSectionProps) {
  const labels = resumeLabels[locale];
  const localLabels = skillViewLabels[locale];
  const [viewMode, setViewMode] = useState<SkillViewMode>('structure');

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

  return (
    <PublishedResumeSectionCard
      description={labels.skillsDescription}
      eyebrow={labels.skillsEyebrow}
      title={labels.skillsTitle}
    >
      <div className="flex flex-wrap items-center justify-between gap-3">
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
        <div className="grid gap-4">
          {chartGroups.map((group) => {
            const count = group.parsedKeywords.length;
            const featuredLabels = group.parsedKeywords
              .map((item) => item.label ?? item.content)
              .slice(0, 4);

            return (
              <article
                className="rounded-[26px] border border-slate-200/75 bg-slate-50/85 p-5 dark:border-white/10 dark:bg-white/[0.04]"
                key={`${group.name.en}-chart`}
              >
                <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
                  <div className="space-y-1">
                    <h3 className="text-lg font-semibold tracking-tight text-slate-900 dark:text-white">
                      {readLocalizedText(group.name, locale)}
                    </h3>
                    <p className="text-sm leading-6 text-slate-500 dark:text-slate-400">
                      {count} {localLabels.points}
                    </p>
                  </div>
                  <span className="text-3xl font-semibold tracking-tight text-slate-900 dark:text-white">
                    {count}
                  </span>
                </div>

                <div className="mt-4 flex flex-wrap gap-2.5" role="list" aria-label={`${readLocalizedText(group.name, locale)} skill dots`}>
                  {group.parsedKeywords.map((item) => (
                    <span
                      aria-label={item.label ?? item.content}
                      className="h-3 w-3 rounded-full bg-[linear-gradient(135deg,rgba(37,99,235,0.96),rgba(56,189,248,0.82))] shadow-[0_0_0_1px_rgba(255,255,255,0.2)]"
                      key={`${group.name.en}-${item.raw}-dot`}
                      role="listitem"
                    />
                  ))}
                </div>

                <div className="mt-4 flex flex-wrap gap-2">
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
      ) : null}
    </PublishedResumeSectionCard>
  );
}
