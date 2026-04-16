'use client'

import { Button, Label, ProgressBar } from '@heroui/react'

interface ResumeOptimizationPendingPanelProps {
  elapsedLabel: string
  hint: string | null
  onCancel?: () => void
  progressValue: number
  stageDescription: string
  stageTitle: string
}

export function ResumeOptimizationPendingPanel({
  elapsedLabel,
  hint,
  onCancel,
  progressValue,
  stageDescription,
  stageTitle,
}: ResumeOptimizationPendingPanelProps) {
  return (
    <section
      className="grid gap-4 rounded-[2rem] border border-blue-200/80 bg-[linear-gradient(135deg,rgba(239,246,255,0.96),rgba(255,255,255,0.92))] p-5 shadow-[0_18px_48px_rgba(37,99,235,0.12)] dark:border-blue-400/25 dark:bg-[linear-gradient(135deg,rgba(37,99,235,0.16),rgba(15,23,42,0.92))] dark:shadow-none"
      data-testid="resume-optimization-pending-card">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="grid gap-2">
          <p className="eyebrow">AI 分析进程</p>
          <h3 className="text-xl font-semibold tracking-tight text-zinc-950 dark:text-white">
            正在分析当前草稿
          </h3>
          <p className="text-sm leading-6 text-zinc-600 dark:text-zinc-300">
            {stageTitle}
          </p>
        </div>
        <div className="rounded-full border border-blue-200/80 bg-white/86 px-4 py-2 text-sm font-semibold text-blue-700 shadow-sm dark:border-blue-400/30 dark:bg-zinc-950/80 dark:text-blue-200">
          已等待 {elapsedLabel}
        </div>
      </div>

      <p className="max-w-4xl text-sm leading-6 text-zinc-600 dark:text-zinc-300">
        {stageDescription}
      </p>

      <ProgressBar
        aria-label="当前草稿优化进度"
        className="grid w-full gap-2"
        color="accent"
        data-progress-value={Math.round(progressValue)}
        data-testid="resume-optimization-pending-progress"
        size="md"
        value={progressValue}>
        <div className="flex items-center justify-between gap-3">
          <Label className="text-xs font-medium text-zinc-500 dark:text-zinc-400">
            模拟进度
          </Label>
          <ProgressBar.Output className="text-sm font-semibold text-zinc-500 dark:text-zinc-300" />
        </div>
        <ProgressBar.Track className="h-3 overflow-hidden rounded-full bg-white/86 ring-1 ring-blue-100 dark:bg-zinc-950/70 dark:ring-blue-400/20">
          <ProgressBar.Fill className="rounded-full bg-[linear-gradient(90deg,var(--admin-primary),#60a5fa)] transition-[width] duration-500 ease-out" />
        </ProgressBar.Track>
      </ProgressBar>

      {hint ? (
        <p className="rounded-2xl bg-white/82 px-4 py-3 text-sm leading-6 text-zinc-600 ring-1 ring-zinc-200/70 dark:bg-zinc-950/70 dark:text-zinc-300 dark:ring-white/8">
          {hint}
        </p>
      ) : null}

      <div className="dashboard-entry-actions">
        <Button
          isDisabled={!onCancel}
          onPress={onCancel}
          size="sm"
          type="button"
          variant="outline">
          取消本次分析
        </Button>
      </div>
    </section>
  )
}
