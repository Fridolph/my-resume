'use client'

/**
 * 简历拼图面板 — 7 块 SVG 七巧板可视化。
 *
 * 7 块拼图恰好拼接为一个 200×200 的正方形。
 * 每块映射 StandardResume 的一个 section。
 *
 * 状态颜色：
 * - empty (0%):    灰色半透明
 * - partial (1-79%): 黄色半透明
 * - complete (80-100%): 彩色实色
 */

import { useResumeAssistant } from './resume-assistant-context'
import type { ResumeSectionCompleteness } from './resume-assistant.types'

// ----------------------------------------------------------------
// 7 块拼图 → 完整 200×200 正方形
// ----------------------------------------------------------------

interface PuzzlePiece {
  section: ResumeSectionCompleteness['section']
  label: string
  /** 多边形顶点序列，格式 "x,y x,y ..." */
  points: string
  /** 标签定位（质心近似） */
  labelX: number
  labelY: number
}

/** 7 块拼图 —— 恰好拼满 200×200 正方形 */
const PIECES: PuzzlePiece[] = [
  {
    section: 'profile',
    label: '基本信息',
    points: '0,0 130,0 70,65 0,65',
    labelX: 50,
    labelY: 25,
  },
  {
    section: 'education',
    label: '教育经历',
    points: '130,0 200,0 200,65 130,65',
    labelX: 165,
    labelY: 25,
  },
  {
    section: 'experiences',
    label: '工作经历',
    points: '70,65 200,65 200,130 70,130',
    labelX: 135,
    labelY: 95,
  },
  {
    section: 'projects',
    label: '项目经历',
    points: '0,65 70,65 70,130 0,130',
    labelX: 35,
    labelY: 95,
  },
  {
    section: 'skills',
    label: '技能特长',
    points: '0,130 70,130 35,200 0,200',
    labelX: 30,
    labelY: 170,
  },
  {
    section: 'highlights',
    label: '核心亮点',
    points: '70,130 200,130 165,200 35,200',
    labelX: 115,
    labelY: 170,
  },
  {
    section: 'interests',
    label: '兴趣爱好',
    points: '200,130 200,200 165,200',
    labelX: 190,
    labelY: 175,
  },
]

// ----------------------------------------------------------------
// 状态颜色
// ----------------------------------------------------------------

const STATUS_COLORS: Record<ResumeSectionCompleteness['status'], { fill: string; stroke: string; opacity: number }> = {
  complete: { fill: '#10b981', stroke: '#059669', opacity: 1 },
  partial: { fill: '#f59e0b', stroke: '#d97706', opacity: 0.7 },
  empty: { fill: '#9ca3af', stroke: '#6b7280', opacity: 0.25 },
}

// ----------------------------------------------------------------
// 组件
// ----------------------------------------------------------------

export function ResumePuzzlePanel() {
  const { completeness } = useResumeAssistant()

  const completionsBySection = new Map(completeness.map((c) => [c.section, c]))

  return (
    <div className="flex flex-col gap-3">
      <h3 className="text-sm font-medium text-zinc-600 dark:text-zinc-400">
        🧩 简历拼图
      </h3>

      {/* SVG 正方形画布 */}
      <div className="relative aspect-square w-full overflow-hidden rounded-xl border border-zinc-200/70 bg-white dark:border-white/10 dark:bg-white/5">
        {/* 浅透明背景纹理 */}
        <div
          className="pointer-events-none absolute inset-0 opacity-[0.05]"
          style={{
            backgroundImage:
              'url(\"data:image/svg+xml,%3Csvg width=\'60\' height=\'60\' viewBox=\'0 0 60 60\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cg fill=\'none\'%3E%3Cg fill=\'%239C92AC\' fill-opacity=\'0.4\'%3E%3Cpath d=\'M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z\'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E\")',
          }}
        />

        <svg viewBox="0 0 200 200" className="h-full w-full" xmlns="http://www.w3.org/2000/svg">
          {/* 拼图块 */}
          {PIECES.map((piece) => {
            const completion = completionsBySection.get(piece.section)
            const status = completion?.status ?? 'empty'
            const colors = STATUS_COLORS[status]
            const percentage = completion?.percentage ?? 0

            return (
              <g key={piece.section}>
                <polygon
                  points={piece.points}
                  fill={colors.fill}
                  stroke={colors.stroke}
                  strokeWidth={1.5}
                  opacity={colors.opacity}
                  className="transition-all duration-500"
                />
              </g>
            )
          })}
        </svg>

        {/* 标签覆盖层（绝对定位，不遮挡图形） */}
        <div className="pointer-events-none absolute inset-0 select-none">
          {PIECES.map((piece) => {
            const completion = completionsBySection.get(piece.section)
            const status = completion?.status ?? 'empty'
            const percentage = completion?.percentage ?? 0
            const textColor = status === 'complete' ? '#fff' : status === 'partial' ? '#fff' : '#6b7280'

            return (
              <div
                key={piece.section}
                className="absolute flex flex-col items-center justify-center text-center leading-tight"
                style={{
                  left: `${(piece.labelX / 200) * 100}%`,
                  top: `${(piece.labelY / 200) * 100}%`,
                  transform: 'translate(-50%, -50%)',
                  color: textColor,
                }}
              >
                <span className={`text-[11px] font-medium ${status === 'complete' ? 'drop-shadow-sm' : ''}`}>
                  {piece.label}
                </span>
                {status !== 'empty' && (
                  <span className="text-[10px] opacity-80">{percentage}%</span>
                )}
              </div>
            )
          })}
        </div>
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
