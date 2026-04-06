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
    coverage: '占比',
    items: '条目数',
  },
  en: {
    structure: 'Structure',
    tagCloud: 'Tag Cloud',
    chart: 'Chart',
    rawTooltip: 'View original line',
    itemCount: 'items',
    coverage: 'Coverage',
    items: 'Items',
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

  const totalItemCount =
    normalizedGroups.reduce((sum, group) => sum + group.parsedKeywords.length, 0) || 1;

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
                      <div className="flex flex-col gap-1 sm:flex-row sm:items-start">
                        <strong className="min-w-0 font-semibold text-slate-900 dark:text-white">
                          {item.label}
                        </strong>
                        <span className="hidden text-slate-300 dark:text-slate-600 sm:inline">
                          :
                        </span>
                        <span className="min-w-0">{item.content}</span>
                      </div>
                    ) : (
                      <span>{item.content}</span>
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
          {normalizedGroups.map((group) => {
            const count = group.parsedKeywords.length;
            const percent = Math.round((count / totalItemCount) * 100);

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
                      {localLabels.items} {count} · {localLabels.coverage} {percent}%
                    </p>
                  </div>
                  <span className="text-3xl font-semibold tracking-tight text-slate-900 dark:text-white">
                    {count}
                  </span>
                </div>

                <div className="mt-4 h-3 overflow-hidden rounded-full bg-slate-200/80 dark:bg-white/10">
                  <div
                    aria-hidden="true"
                    className="h-full rounded-full bg-[linear-gradient(90deg,rgba(37,99,235,0.92),rgba(14,165,233,0.85),rgba(56,189,248,0.75))]"
                    style={{ width: `${Math.max(percent, 8)}%` }}
                  />
                </div>

                <div className="mt-4 flex flex-wrap gap-2">
                  {group.parsedKeywords.map((item) => (
                    <span
                      className="rounded-full border border-slate-200/70 bg-white/80 px-3 py-1.5 text-xs font-medium text-slate-500 dark:border-white/10 dark:bg-white/[0.05] dark:text-slate-300"
                      key={`${group.name.en}-${item.raw}-legend`}
                    >
                      {item.label ?? item.content}
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
