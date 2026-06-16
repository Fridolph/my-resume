'use client'

/**
 * 简历拼图面板 — 7 块 SVG 七巧板可视化。
 *
 * 每块拼图映射 StandardResume 的一个 section，状态由 completeness 驱动：
 * - empty (0%):    灰色半透明
 * - partial (1-79%): 黄色半透明
 * - complete (80-100%): 彩色实色
 */

import { useResumeAssistant } from './resume-assistant-context'
import type { ResumeSectionCompleteness } from './resume-assistant.types'

/** 拼图块的视觉参数 */
interface PuzzlePiece {
  section: ResumeSectionCompleteness['section']
  label: string
  /** SVG path 数据 */
  d: string
  /** viewBox 内的变换 */
  transform?: string
}

/** 7 块拼图的 SVG 路径（七巧板风格几何图形） */
const PIECES: PuzzlePiece[] = [
  {
    section: 'profile',
    label: '基本信息',
    d: 'M0,0 h120 v50 l-30,30 h-90 z',
    transform: 'translate(10, 10)',
  },
  {
    section: 'education',
    label: '教育经历',
    d: 'M0,0 l40,-40 h80 v40 z',
    transform: 'translate(140, 40)',
  },
  {
    section: 'experiences',
    label: '工作经历',
    d: 'M0,0 h120 l-20,30 l-60,10 l-40,-40 z',
    transform: 'translate(10, 80)',
  },
  {
    section: 'projects',
    label: '项目经历',
    d: 'M0,0 l30,30 h60 l-30,-30 z M30,30 l-30,30 v60 l60,-30 z',
    transform: 'translate(150, 110)',
  },
  {
    section: 'skills',
    label: '技能特长',
    d: 'M0,0 v50 l30,30 l30,-30 v-50 z',
    transform: 'translate(20, 140)',
  },
  {
    section: 'highlights',
    label: '核心亮点',
    d: 'M0,0 h60 l20,30 l-40,30 l-40,-30 z',
    transform: 'translate(120, 160)',
  },
  {
    section: 'interests',
    label: '兴趣爱好',
    d: 'M0,0 l30,30 h30 l-30,-30 z M30,30 l-30,30 v30 l30,30 z',
    transform: 'translate(220, 10)',
  },
]

/** 状态 → 颜色映射 */
function pieceColor(status: ResumeSectionCompleteness['status']): {
  fill: string
  stroke: string
  opacity: number
  textColor: string
} {
  switch (status) {
    case 'complete':
      return { fill: '#10b981', stroke: '#059669', opacity: 1, textColor: '#fff' }
    case 'partial':
      return { fill: '#f59e0b', stroke: '#d97706', opacity: 0.7, textColor: '#fff' }
    default:
      return { fill: '#9ca3af', stroke: '#6b7280', opacity: 0.25, textColor: '#6b7280' }
  }
}

export function ResumePuzzlePanel() {
  const { completeness } = useResumeAssistant()

  const completionsBySection = new Map(
    completeness.map((c) => [c.section, c]),
  )

  return (
    <div className="flex flex-col gap-3">
      <h3 className="text-sm font-medium text-zinc-600 dark:text-zinc-400">
        🧩 简历拼图
      </h3>

      {/* SVG 拼图画布 */}
      <div className="relative overflow-hidden rounded-xl border border-zinc-200/70 bg-white dark:border-white/10 dark:bg-white/5">
        {/* 浅透明背景图占位 */}
        <div
          className="pointer-events-none absolute inset-0 opacity-[0.06]"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%239C92AC' fill-opacity='0.4'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
          }}
        />

        <svg
          viewBox="0 0 280 220"
          className="h-auto w-full"
          xmlns="http://www.w3.org/2000/svg"
        >
          {PIECES.map((piece) => {
            const completion = completionsBySection.get(piece.section)
            const status = completion?.status ?? 'empty'
            const colors = pieceColor(status)
            const percentage = completion?.percentage ?? 0

            return (
              <g key={piece.section} transform={piece.transform}>
                {/* 拼图块 */}
                <path
                  d={piece.d}
                  fill={colors.fill}
                  stroke={colors.stroke}
                  strokeWidth={1.5}
                  opacity={colors.opacity}
                  className="transition-all duration-500"
                />
                {/* 标签 */}
                <text
                  x={getTextX(piece.section)}
                  y={getTextY(piece.section)}
                  textAnchor="middle"
                  dominantBaseline="middle"
                  fill={colors.textColor}
                  fontSize="10"
                  fontWeight={status === 'complete' ? 'bold' : 'normal'}
                  className="pointer-events-none select-none"
                >
                  {piece.label}
                </text>
                {/* 百分比 */}
                {status !== 'empty' && (
                  <text
                    x={getTextX(piece.section)}
                    y={getTextY(piece.section) + 12}
                    textAnchor="middle"
                    dominantBaseline="middle"
                    fill={colors.textColor}
                    fontSize="8"
                    className="pointer-events-none select-none"
                  >
                    {percentage}%
                  </text>
                )}
              </g>
            )
          })}
        </svg>
      </div>

      {/* 图例 */}
      <div className="flex flex-wrap gap-2 text-xs text-zinc-500 dark:text-zinc-400">
        <span className="flex items-center gap-1">
          <span className="inline-block h-3 w-3 rounded-sm bg-emerald-500" /> 完整
        </span>
        <span className="flex items-center gap-1">
          <span className="inline-block h-3 w-3 rounded-sm bg-amber-500 opacity-70" /> 待补充
        </span>
        <span className="flex items-center gap-1">
          <span className="inline-block h-3 w-3 rounded-sm bg-gray-400 opacity-25" /> 未填写
        </span>
      </div>
    </div>
  )
}

/** 各拼图块文字中心 X 坐标 */
function getTextX(section: string): number {
  switch (section) {
    case 'profile': return 60
    case 'education': return 55
    case 'experiences': return 55
    case 'projects': return 35
    case 'skills': return 35
    case 'highlights': return 30
    case 'interests': return 35
    default: return 0
  }
}

/** 各拼图块文字中心 Y 坐标 */
function getTextY(section: string): number {
  switch (section) {
    case 'profile': return 25
    case 'education': return 25
    case 'experiences': return 25
    case 'projects': return 35
    case 'skills': return 25
    case 'highlights': return 15
    case 'interests': return 35
    default: return 0
  }
}
