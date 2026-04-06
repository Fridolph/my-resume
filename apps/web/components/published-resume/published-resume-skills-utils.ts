import type { EChartsOption } from 'echarts';

import type {
  ResumeLocale,
  ResumeSkillGroup,
} from '../../lib/published-resume-types';
import { readLocalizedText } from './published-resume-utils';

export interface ParsedSkillLine {
  label: string | null;
  content: string;
  raw: string;
}

export interface NormalizedSkillGroup extends ResumeSkillGroup {
  parsedKeywords: ParsedSkillLine[];
}

export interface SkillCloudToken {
  id: string;
  label: string;
  raw: string;
  groupLabel: string;
  toneIndex: number;
  sizeClassName: string;
  rotateClassName: string;
}

const chartPalette = [
  '#2563eb',
  '#0891b2',
  '#6366f1',
  '#a855f7',
  '#f43f5e',
  '#10b981',
  '#f59e0b',
  '#0f766e',
] as const;

function stripMarkdownBold(value: string): string {
  return value.replace(/^\*\*(.+)\*\*$/u, '$1').trim();
}

export function parseSkillLine(raw: string): ParsedSkillLine {
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

export function normalizeSkillGroups(skills: ResumeSkillGroup[]): NormalizedSkillGroup[] {
  return skills.map((group) => ({
    ...group,
    parsedKeywords: group.keywords.map(parseSkillLine),
  }));
}

export function rankSkillGroups(
  groups: NormalizedSkillGroup[],
  locale: ResumeLocale,
) {
  return [...groups]
    .map((group, index) => ({
      ...group,
      displayName: readLocalizedText(group.name, locale),
      originalIndex: index,
    }))
    .sort((left, right) => {
      if (right.parsedKeywords.length !== left.parsedKeywords.length) {
        return right.parsedKeywords.length - left.parsedKeywords.length;
      }

      return left.originalIndex - right.originalIndex;
    });
}

export function buildSkillCloudTokens(
  groups: NormalizedSkillGroup[],
  locale: ResumeLocale,
): SkillCloudToken[] {
  const sizeClasses = ['text-sm', 'text-base', 'text-lg'] as const;
  const rotateClasses = ['rotate-0', '-rotate-2', 'rotate-2'] as const;

  return groups.flatMap((group, groupIndex) => {
    const groupLabel = readLocalizedText(group.name, locale);

    return group.parsedKeywords.map((item, itemIndex) => {
      const label = item.label ?? item.content;

      return {
        id: `${groupLabel}-${label}-${itemIndex}`,
        label,
        raw: item.raw,
        groupLabel,
        toneIndex: (groupIndex + itemIndex) % chartPalette.length,
        sizeClassName: sizeClasses[(groupIndex + itemIndex) % sizeClasses.length],
        rotateClassName: rotateClasses[(groupIndex + itemIndex) % rotateClasses.length],
      };
    });
  });
}

function wrapAxisLabel(value: string): string {
  if (value.length <= 6) {
    return value;
  }

  return value.replace(/(.{1,6})/gu, '$1\n').trim();
}

export function buildRadarChartOption(
  groups: ReturnType<typeof rankSkillGroups>,
  locale: ResumeLocale,
  themeMode: 'light' | 'dark',
): EChartsOption {
  const maxItemCount = Math.max(...groups.map((group) => group.parsedKeywords.length), 1);
  const axisTextColor = themeMode === 'dark' ? '#cbd5e1' : '#64748b';
  const splitAreaColors =
    themeMode === 'dark'
      ? ['rgba(96,165,250,0.08)', 'rgba(96,165,250,0.03)']
      : ['rgba(37,99,235,0.03)', 'rgba(37,99,235,0.015)'];

  return {
    animationDuration: 500,
    color: ['#2563eb'],
    grid: {
      top: 16,
      right: 24,
      bottom: 12,
      left: 24,
    },
    radar: {
      center: ['50%', '54%'],
      radius: '62%',
      splitNumber: 4,
      axisName: {
        color: axisTextColor,
        fontSize: 12,
        lineHeight: 16,
      },
      axisLine: {
        lineStyle: {
          color: 'rgba(148,163,184,0.28)',
        },
      },
      splitArea: {
        areaStyle: {
          color: splitAreaColors,
        },
      },
      splitLine: {
        lineStyle: {
          color: 'rgba(148,163,184,0.22)',
        },
      },
      indicator: groups.map((group) => ({
        name: wrapAxisLabel(group.displayName),
        max: maxItemCount,
      })),
    },
    tooltip: {
      trigger: 'item',
      backgroundColor: 'rgba(15,23,42,0.92)',
      borderWidth: 0,
      textStyle: {
        color: '#f8fafc',
      },
      formatter: () =>
        groups
          .map((group) =>
            `${group.displayName}${locale === 'zh' ? '：' : ': '}${group.parsedKeywords.length}`,
          )
          .join('<br/>'),
    },
    series: [
      {
        type: 'radar',
        data: [
          {
            value: groups.map((group) => group.parsedKeywords.length),
            name: locale === 'zh' ? '技能覆盖度' : 'Skill coverage',
            areaStyle: {
              color: 'rgba(37,99,235,0.18)',
            },
            lineStyle: {
              color: '#2563eb',
              width: 2,
            },
            symbol: 'circle',
            symbolSize: 10,
            itemStyle: {
              color: '#2563eb',
              borderColor: '#ffffff',
              borderWidth: 2,
            },
          },
        ],
      },
    ],
  };
}

export function buildPieChartOption(
  groups: ReturnType<typeof rankSkillGroups>,
  locale: ResumeLocale,
  themeMode: 'light' | 'dark',
): EChartsOption {
  const legendColor = themeMode === 'dark' ? '#cbd5e1' : '#64748b';
  const labelColor = themeMode === 'dark' ? '#e2e8f0' : '#334155';
  const centerText = themeMode === 'dark' ? '#f8fafc' : '#0f172a';

  return {
    animationDuration: 500,
    color: groups.map((_, index) => chartPalette[index % chartPalette.length]),
    tooltip: {
      trigger: 'item',
      backgroundColor: 'rgba(15,23,42,0.92)',
      borderWidth: 0,
      textStyle: {
        color: '#f8fafc',
      },
      formatter: ((params: unknown) => {
        const payload = Array.isArray(params)
          ? params[0]
          : params as { name?: string; value?: unknown };

        return `${payload?.name ?? ''}${locale === 'zh' ? '：' : ': '}${Number(payload?.value ?? 0)}`;
      }) as NonNullable<EChartsOption['tooltip']> extends infer T
        ? T extends { formatter?: infer F }
          ? F
          : never
        : never,
    },
    legend: {
      bottom: 0,
      left: 'center',
      itemHeight: 10,
      itemWidth: 10,
      textStyle: {
        color: legendColor,
        fontSize: 12,
      },
      formatter: (name: string) => {
        const match = groups.find((group) => group.displayName === name);
        return match
          ? `${name} · ${match.parsedKeywords.length}`
          : name;
      },
    },
    graphic: [
      {
        type: 'text',
        left: 'center',
        top: '34%',
        style: {
          text: locale === 'zh' ? '技能分布' : 'Skill Map',
          fill: centerText,
          fontSize: 13,
          fontWeight: 600,
        },
      },
    ],
    series: [
      {
        type: 'pie',
        radius: ['48%', '74%'],
        center: ['50%', '40%'],
        avoidLabelOverlap: true,
        label: {
          formatter: (params: { name?: string; value?: unknown }) =>
            `${params.name}\n${Number(params.value ?? 0)}`,
          color: labelColor,
          fontSize: 11,
          lineHeight: 16,
        },
        labelLine: {
          length: 10,
          length2: 8,
          lineStyle: {
            color: 'rgba(148,163,184,0.45)',
          },
        },
        data: groups.map((group) => ({
          name: group.displayName,
          value: group.parsedKeywords.length,
        })),
      },
    ],
  };
}

export function getSkillChartPalette(index: number): string {
  return chartPalette[index % chartPalette.length];
}
