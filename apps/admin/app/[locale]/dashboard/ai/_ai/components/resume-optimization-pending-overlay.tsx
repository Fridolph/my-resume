'use client'

import { ResumeOptimizationPendingPanel } from './resume-optimization-pending-panel'

interface ResumeOptimizationPendingOverlayProps {
  elapsedLabel: string
  hint?: string | null
  onCancel?: () => void
  progressValue: number
  stageDescription: string
  stageTitle: string
}

export function ResumeOptimizationPendingOverlay({
  elapsedLabel,
  hint,
  onCancel,
  progressValue,
  stageDescription,
  stageTitle,
}: ResumeOptimizationPendingOverlayProps) {
  return (
    <div
      className="absolute inset-0 z-20 grid place-items-start rounded-[1.75rem] bg-white/70 p-4 backdrop-blur-[2px] dark:bg-zinc-950/64"
      data-testid="resume-optimization-pending-overlay">
      <div className="w-full max-w-4xl">
        <ResumeOptimizationPendingPanel
          elapsedLabel={elapsedLabel}
          hint={hint ?? null}
          onCancel={onCancel}
          progressValue={progressValue}
          stageDescription={stageDescription}
          stageTitle={stageTitle}
        />
      </div>
    </div>
  )
}
