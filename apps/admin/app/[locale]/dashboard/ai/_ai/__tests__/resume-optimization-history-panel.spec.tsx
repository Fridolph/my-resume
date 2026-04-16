'use client'

import { cleanup, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { ResumeOptimizationHistoryPanel } from '../components/resume-optimization-history-panel'
import type { AiWorkbenchScenario } from '../types/ai-workbench.types'
import type { ResumeOptimizationHistoryEntry } from '../utils/resume-optimization-persistence'

function createEntry(index: number): ResumeOptimizationHistoryEntry {
  return {
    changedModules: index % 2 === 0 ? ['projects'] : ['profile'],
    createdAt: `2026-04-${String(index).padStart(2, '0')}T09:30:00.000Z`,
    instruction: `# 优化记录 ${index}\n\n## 职位概述\n\n这是第 ${index} 条记录。`,
    instructionHash: `hash-${index}`,
    locale: 'zh',
    resultId: `result-${index}`,
    summary: `这是第 ${index} 条摘要`,
    usageRecordId: `usage-${index}`,
  }
}

function createRelationState(index: number): {
  completionLabel: string
  linkedScenarios: AiWorkbenchScenario[]
} {
  return {
    completionLabel: index % 2 === 0 ? '已含 Offer 对比' : '仅优化建议',
    linkedScenarios: index % 2 === 0 ? ['offer-compare'] : ['jd-match'],
  }
}

describe('ResumeOptimizationHistoryPanel', () => {
  beforeEach(() => {
    if (!Element.prototype.getAnimations) {
      Element.prototype.getAnimations = () => []
    }
  })

  afterEach(() => {
    cleanup()
    vi.clearAllMocks()
  })

  it('should render footer pagination and switch pages', async () => {
    const user = userEvent.setup()
    const entries = Array.from({ length: 6 }, (_, index) => createEntry(index + 1))
    const relationStates = Object.fromEntries(
      entries.map((entry, index) => [entry.resultId, createRelationState(index + 1)]),
    )
    const onOpenDetail = vi.fn()

    render(
      <ResumeOptimizationHistoryPanel
        entries={entries}
        onOpenDetail={onOpenDetail}
        relationStates={relationStates}
      />,
    )

    expect(screen.getByTestId('optimization-history-pagination')).toBeInTheDocument()
    expect(screen.getByTestId('optimization-history-pagination-summary')).toHaveTextContent(
      '第 1-5 条，共 6 条',
    )
    expect(screen.getByText('优化记录 1')).toBeInTheDocument()
    expect(screen.getByText('优化记录 5')).toBeInTheDocument()
    expect(screen.queryByText('优化记录 6')).not.toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: '2' }))

    expect(screen.getByTestId('optimization-history-pagination-summary')).toHaveTextContent(
      '第 6-6 条，共 6 条',
    )
    expect(screen.getByText('优化记录 6')).toBeInTheDocument()
    expect(screen.queryByText('优化记录 1')).not.toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: '查看详情' }))
    expect(onOpenDetail).toHaveBeenCalledWith(
      expect.objectContaining({
        resultId: 'result-6',
      }),
    )
    expect(screen.getByRole('link', { name: '打开结果页' })).toHaveAttribute(
      'href',
      '/dashboard/ai/resume-optimization/results/result-6',
    )
  })

  it('should clamp current page when entries shrink', async () => {
    const user = userEvent.setup()
    const initialEntries = Array.from({ length: 6 }, (_, index) => createEntry(index + 1))
    const initialRelationStates = Object.fromEntries(
      initialEntries.map((entry, index) => [entry.resultId, createRelationState(index + 1)]),
    )
    const onOpenDetail = vi.fn()

    const { rerender } = render(
      <ResumeOptimizationHistoryPanel
        entries={initialEntries}
        onOpenDetail={onOpenDetail}
        relationStates={initialRelationStates}
      />,
    )

    await user.click(screen.getByRole('button', { name: '2' }))
    expect(screen.getByText('优化记录 6')).toBeInTheDocument()

    const nextEntries = initialEntries.slice(0, 3)
    const nextRelationStates = Object.fromEntries(
      nextEntries.map((entry, index) => [entry.resultId, createRelationState(index + 1)]),
    )

    rerender(
      <ResumeOptimizationHistoryPanel
        entries={nextEntries}
        onOpenDetail={onOpenDetail}
        relationStates={nextRelationStates}
      />,
    )

    expect(screen.getByTestId('optimization-history-pagination-summary')).toHaveTextContent(
      '第 1-3 条，共 3 条',
    )
    expect(screen.getByText('优化记录 1')).toBeInTheDocument()
    expect(screen.getByText('优化记录 3')).toBeInTheDocument()
    expect(screen.queryByText('优化记录 6')).not.toBeInTheDocument()
  })
})
