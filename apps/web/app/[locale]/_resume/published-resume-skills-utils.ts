import type { PieSeriesOption, RadarSeriesOption } from 'echarts/charts'
import type {
  AriaComponentOption,
  GridComponentOption,
  GraphicComponentOption,
  LegendComponentOption,
  RadarComponentOption,
  TooltipComponentOption,
} from 'echarts/components'
import type { ComposeOption } from 'echarts/core'

import type {
  ResumeLocale,
  ResumeSkillGroup,
} from '@shared/published-resume/types/published-resume.types'
import { readLocalizedText } from '@shared/published-resume/published-resume-utils'

export type SkillChartOption = ComposeOption<
  | RadarSeriesOption
  | PieSeriesOption
  | TooltipComponentOption
  | GridComponentOption
  | LegendComponentOption
  | RadarComponentOption
  | GraphicComponentOption
  | AriaComponentOption
>

export interface ParsedSkillLine {
  label: string | null
  content: string
  raw: string
}

export interface NormalizedSkillGroup extends ResumeSkillGroup {
  parsedKeywords: ParsedSkillLine[]
}

export interface SkillCloudToken {
  id: string
  label: string
  raw: string
  groupLabel: string
  toneIndex: number
  sizeClassName: string
  rotateClassName: string
}

export interface SkillChartCopy {
  pieCenterTitle: string
  pieTooltipValue: (name: string, value: number) => string
  radarSeriesName: string
  radarTooltipValue: (name: string, value: number) => string
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
] as const

const enSkillKeywordLineMap = new Map<string, string>([
  [
    'Vue / React / Next.js / Nuxt 组件化与页面架构',
    'Vue / React / Next.js / Nuxt component architecture and page systems',
  ],
  [
    'TypeScript 类型建模与 Composition API / Hooks 实践',
    'TypeScript type modeling with Composition API / Hooks practices',
  ],
  [
    '复杂交互、响应式布局与可访问性体验打磨',
    'Complex interactions, responsive layouts, and accessibility refinement',
  ],
  [
    '前端状态管理、数据请求与设计系统协作',
    'Frontend state management, data fetching, and design-system collaboration',
  ],
  [
    'Vite / Webpack / Turborepo / pnpm workspace 工程治理',
    'Vite / Webpack / Turborepo / pnpm workspace engineering governance',
  ],
  [
    '构建产物分析、懒加载与首屏性能优化',
    'Build artifact analysis, lazy loading, and first-screen performance optimization',
  ],
  [
    'CI/CD、Lint、Typecheck 与可回滚交付流程',
    'CI/CD, lint, typecheck, and rollback-safe delivery workflow',
  ],
  [
    'Monorepo 渐进式重构与模块边界拆分',
    'Progressive monorepo refactoring and module boundary decomposition',
  ],
  [
    'Prompt Engineering、RAG 与知识库问答基础链路',
    'Prompt engineering, RAG, and knowledge-base Q&A baseline workflow',
  ],
  [
    'Claude Code / Cursor / Codex 辅助开发工作流',
    'Claude Code / Cursor / Codex assisted development workflow',
  ],
  [
    'AI Provider Adapter 与流式响应接入实践',
    'AI Provider Adapter and streaming-response integration practices',
  ],
  [
    'OpenClaw / Coze / Agent 工作流学习与验证',
    'OpenClaw / Coze / Agent workflow learning and validation',
  ],
  [
    '模块边界、路由结构与领域模型拆分',
    'Module boundaries, route structures, and domain model decomposition',
  ],
  [
    '前后端接口契约、权限边界与发布链路设计',
    'Frontend-backend API contracts, permission boundaries, and release-flow design',
  ],
  [
    '教学型渐进重构方案、Issue 拆解与 Review 节奏',
    'Tutorial-driven incremental refactor plans, issue decomposition, and review cadence',
  ],
  [
    '复杂页面信息架构与可维护组件组织',
    'Complex page information architecture and maintainable component organization',
  ],
  [
    'Node.js / NestJS / RESTful API 服务端开发',
    'Node.js / NestJS / RESTful API backend development',
  ],
  [
    'JWT 认证、角色能力模型与接口权限控制',
    'JWT authentication, role capability models, and API access control',
  ],
  [
    'SQLite / Drizzle ORM / MongoDB 数据层实践',
    'SQLite / Drizzle ORM / MongoDB data-layer practices',
  ],
  [
    'WebSocket / SSE / 文件处理等应用能力接入',
    'WebSocket / SSE / file-processing capability integration',
  ],
  [
    '安全、SaaS、能源与内容社区等业务场景交付经验',
    'Delivery experience across security, SaaS, energy, and content-community scenarios',
  ],
  [
    '需求拆解、优先级判断与跨角色沟通推进',
    'Requirement decomposition, priority judgment, and cross-role collaboration',
  ],
  [
    '从后台治理到公开展示的完整产品链路理解',
    'End-to-end product flow understanding from admin governance to public presentation',
  ],
  [
    '技术方案文档、教程沉淀与可复用知识资产建设',
    'Technical proposal docs, tutorial codification, and reusable knowledge assets',
  ],
])

const enSkillKeywordPhraseMap = new Map<string, string>([
  ['构建体系', 'build systems'],
  ['需求理解', 'requirement understanding'],
  ['业务洞察', 'business insight'],
  ['模块边界', 'module boundaries'],
  ['性能优化', 'performance optimization'],
  ['可访问性', 'accessibility'],
])

function stripMarkdownBold(value: string): string {
  return value.replace(/^\*\*(.+)\*\*$/u, '$1').trim()
}

function hasChineseCharacters(value: string): boolean {
  return /[\u4e00-\u9fff]/u.test(value)
}

function localizeSkillLine(raw: string, locale: ResumeLocale): string {
  if (locale !== 'en' || !hasChineseCharacters(raw)) {
    return raw
  }

  const directMatch = enSkillKeywordLineMap.get(raw.trim())
  if (directMatch) {
    return directMatch
  }

  let translated = raw
  enSkillKeywordPhraseMap.forEach((replacement, phrase) => {
    translated = translated.replaceAll(phrase, replacement)
  })

  return translated
}

export function parseSkillLine(raw: string): ParsedSkillLine {
  const trimmed = raw.trim().replace(/^[-•]\s*/u, '')
  const dividerIndex = trimmed.search(/[:：]/u)

  if (dividerIndex === -1) {
    return {
      label: null,
      content: stripMarkdownBold(trimmed),
      raw,
    }
  }

  const left = stripMarkdownBold(trimmed.slice(0, dividerIndex).trim())
  const right = trimmed.slice(dividerIndex + 1).trim()

  return {
    label: left || null,
    content: right || stripMarkdownBold(trimmed),
    raw,
  }
}

export function normalizeSkillGroups(
  skills: ResumeSkillGroup[],
  locale: ResumeLocale = 'zh',
): NormalizedSkillGroup[] {
  return skills.map((group) => ({
    ...group,
    parsedKeywords: group.keywords.map((rawKeyword) =>
      parseSkillLine(localizeSkillLine(rawKeyword, locale)),
    ),
  }))
}

export function rankSkillGroups(groups: NormalizedSkillGroup[], locale: ResumeLocale) {
  return [...groups]
    .map((group, index) => ({
      ...group,
      displayName: readLocalizedText(group.name, locale),
      originalIndex: index,
    }))
    .sort((left, right) => left.originalIndex - right.originalIndex)
}

export function buildSkillCloudTokens(
  groups: NormalizedSkillGroup[],
  locale: ResumeLocale,
): SkillCloudToken[] {
  const sizeClasses = ['text-sm', 'text-base', 'text-lg'] as const
  const rotateClasses = ['rotate-0', '-rotate-2', 'rotate-2'] as const

  return groups.flatMap((group, groupIndex) => {
    const groupLabel = readLocalizedText(group.name, locale)

    return group.parsedKeywords.map((item, itemIndex) => {
      const label = item.label ?? item.content

      return {
        id: `${groupLabel}-${label}-${itemIndex}`,
        label,
        raw: item.raw,
        groupLabel,
        toneIndex: (groupIndex + itemIndex) % chartPalette.length,
        sizeClassName: sizeClasses[(groupIndex + itemIndex) % sizeClasses.length],
        rotateClassName: rotateClasses[(groupIndex + itemIndex) % rotateClasses.length],
      }
    })
  })
}

function wrapAxisLabel(value: string): string {
  if (value.length <= 6) {
    return value
  }

  return value.replace(/(.{1,6})/gu, '$1\n').trim()
}

export function buildRadarChartOption(
  groups: ReturnType<typeof rankSkillGroups>,
  themeMode: 'light' | 'dark',
  copy: SkillChartCopy,
): SkillChartOption {
  const values = groups.map((group) =>
    typeof group.proficiency === 'number' ? group.proficiency : group.parsedKeywords.length,
  )
  const maxValue = groups.some((group) => typeof group.proficiency === 'number')
    ? 100
    : Math.max(...values, 1)
  const axisTextColor = themeMode === 'dark' ? '#cbd5e1' : '#64748b'
  const splitAreaColors =
    themeMode === 'dark'
      ? ['rgba(96,165,250,0.08)', 'rgba(96,165,250,0.03)']
      : ['rgba(37,99,235,0.03)', 'rgba(37,99,235,0.015)']

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
        max: maxValue,
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
          .map((group, index) => copy.radarTooltipValue(group.displayName, values[index] ?? 0))
          .join('<br/>'),
    },
    series: [
      {
        type: 'radar',
        data: [
          {
            value: values,
            name: copy.radarSeriesName,
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
  }
}

export function buildPieChartOption(
  groups: ReturnType<typeof rankSkillGroups>,
  themeMode: 'light' | 'dark',
  copy: SkillChartCopy,
): SkillChartOption {
  const legendColor = themeMode === 'dark' ? '#cbd5e1' : '#64748b'
  const labelColor = themeMode === 'dark' ? '#e2e8f0' : '#334155'
  const centerText = themeMode === 'dark' ? '#f8fafc' : '#0f172a'

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
          : (params as { name?: string; value?: unknown })

        return copy.pieTooltipValue(payload?.name ?? '', Number(payload?.value ?? 0))
      }) as NonNullable<SkillChartOption['tooltip']> extends infer T
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
        const match = groups.find((group) => group.displayName === name)
        return match ? `${name} · ${match.parsedKeywords.length}` : name
      },
    },
    graphic: [
      {
        type: 'text',
        left: 'center',
        top: '34%',
        style: {
          text: copy.pieCenterTitle,
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
  }
}

export function getSkillChartPalette(index: number): string {
  return chartPalette[index % chartPalette.length]
}
