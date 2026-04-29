'use client'

import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'

import { ResumeImportHistoryTable } from '../components/resume-import-history-table'

vi.mock('@heroui/react', async () => {
  const React = await import('react')
  const Table = ({ children, ...props }: any) => <table {...props}>{children}</table>
  Table.ScrollContainer = ({ children }: any) => <>{children}</>
  Table.Content = ({ children, ...props }: any) => <>{children}</>
  Table.Header = ({ children }: any) => <thead><tr>{children}</tr></thead>
  Table.Column = ({ children }: any) => <th>{children}</th>
  Table.Body = ({ children, items }: any) => (
    <tbody>{items.map((item: any) => children(item))}</tbody>
  )
  Table.Row = ({ children }: any) => <tr>{children}</tr>
  Table.Cell = ({ children }: any) => <td>{children}</td>

  const Pagination = ({ children }: any) => <nav>{children}</nav>
  Pagination.Summary = ({ children }: any) => <span>{children}</span>
  Pagination.Content = ({ children }: any) => <div>{children}</div>
  Pagination.Item = ({ children }: any) => <span>{children}</span>
  Pagination.Previous = ({ children, isDisabled, onPress }: any) => (
    <button disabled={isDisabled} onClick={onPress}>{children}</button>
  )
  Pagination.Next = ({ children, isDisabled, onPress }: any) => (
    <button disabled={isDisabled} onClick={onPress}>{children}</button>
  )
  Pagination.Link = ({ children, onPress }: any) => (
    <button onClick={onPress}>{children}</button>
  )
  Pagination.Ellipsis = () => <span>...</span>
  Pagination.PreviousIcon = () => <span />
  Pagination.NextIcon = () => <span />
  const Tooltip = ({ children }: any) => <>{children}</>
  Tooltip.Trigger = ({ children }: any) => <>{children}</>
  Tooltip.Content = () => null
  Tooltip.Arrow = () => null

  return {
    Button: ({ as: Component = 'button', children, isPending: _isPending, onPress, ...props }: any) => (
      <Component {...props} onClick={onPress}>{children}</Component>
    ),
    Chip: Object.assign(({ children }: any) => <span>{children}</span>, {
      Label: ({ children }: any) => <span>{children}</span>,
    }),
    Pagination,
    Table,
    Tooltip,
  }
})

describe('ResumeImportHistoryTable', () => {
  afterEach(() => {
    cleanup()
    vi.clearAllMocks()
  })

  it('renders successful resume import records with result link', () => {
    render(
      <ResumeImportHistoryTable
        records={[
          {
            id: 'usage-resume-import-001',
            operationType: 'resume-import',
            scenario: 'resume-import',
            locale: 'zh',
            inputPreview: 'lifeiyu-mock-zh.md · 5896 字符',
            summary: '已识别候选草稿',
            provider: 'deepseek',
            model: 'deepseek-v4-flash',
            mode: 'openai-compatible',
            generator: 'ai-provider',
            status: 'succeeded',
            relatedReportId: null,
            relatedResultId: 'result-import-001',
            errorMessage: null,
            durationMs: 240000,
            createdAt: '2026-04-29T03:18:26.394Z',
          },
        ]}
      />,
    )

    expect(screen.getByText('lifeiyu-mock-zh.md · 5896 字符')).toBeInTheDocument()
    expect(screen.getByText('识别成功')).toBeInTheDocument()
    expect(screen.getByText('4 分 0 秒')).toBeInTheDocument()
    expect(screen.getByText('deepseek-v4-flash')).toBeInTheDocument()
    expect(screen.getByText(/2026\/04\/29 .*18/)).toBeInTheDocument()
    expect(screen.getByRole('link', { name: '查看结果' })).toHaveAttribute(
      'href',
      '/dashboard/ai/resume-import/results/result-import-001',
    )
  })

  it('renders failed resume import records with readable error', () => {
    render(
      <ResumeImportHistoryTable
        records={[
          {
            id: 'usage-resume-import-failed',
            operationType: 'resume-import',
            scenario: 'resume-import',
            locale: 'zh',
            inputPreview: 'broken.md',
            summary: null,
            provider: 'deepseek',
            model: 'deepseek-v4-flash',
            mode: 'openai-compatible',
            generator: 'ai-provider',
            status: 'failed',
            relatedReportId: null,
            relatedResultId: null,
            errorMessage: 'AI 识别结果无法解析',
            durationMs: 191932,
            createdAt: '2026-04-29T03:18:26.394Z',
          },
        ]}
      />,
    )

    expect(screen.getByText('识别失败')).toBeInTheDocument()
    expect(screen.getByText('AI 识别结果无法解析')).toBeInTheDocument()
  })

  it('paginates records by 10 items and exposes view/delete actions', () => {
    const onViewRecord = vi.fn()
    const onDeleteRecord = vi.fn()
    const records = Array.from({ length: 11 }, (_, index) => ({
      id: `usage-${index + 1}`,
      operationType: 'resume-import' as const,
      scenario: 'resume-import' as const,
      locale: 'zh' as const,
      inputPreview: `resume-${index + 1}.md · 5896 字符`,
      summary: '已识别候选草稿',
      provider: 'deepseek',
      model: 'deepseek-v4-flash',
      mode: 'openai-compatible',
      generator: 'ai-provider' as const,
      status: 'succeeded' as const,
      relatedReportId: null,
      relatedResultId: `result-${index + 1}`,
      errorMessage: null,
      durationMs: 240000,
      createdAt: '2026-04-29T03:18:26.394Z',
    }))

    render(
      <ResumeImportHistoryTable
        onDeleteRecord={onDeleteRecord}
        onViewRecord={onViewRecord}
        records={records}
      />,
    )

    expect(screen.getByText('resume-1.md · 5896 字符')).toBeInTheDocument()
    expect(screen.queryByText('resume-11.md · 5896 字符')).not.toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: '下一页' }))

    expect(screen.getByText('resume-11.md · 5896 字符')).toBeInTheDocument()
    fireEvent.click(screen.getAllByRole('button', { name: '查看详情' })[0]!)
    fireEvent.click(screen.getAllByRole('button', { name: '删除' })[0]!)

    expect(onViewRecord).toHaveBeenCalledWith(expect.objectContaining({ id: 'usage-11' }))
    expect(onDeleteRecord).toHaveBeenCalledWith(expect.objectContaining({ id: 'usage-11' }))
  })
})
