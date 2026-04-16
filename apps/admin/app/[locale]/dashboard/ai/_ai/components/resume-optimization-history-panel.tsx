'use client'

import { Button, Chip, Modal, Pagination, Table, Tooltip } from '@heroui/react'
import Link from 'next/link'
import { useEffect, useMemo, useState } from 'react'

import {
  AdminActionIconButton,
  AdminModalShell,
  adminActionIconTriggerClassName,
} from '../../../../../_shared/ui/components/heroui'
import {
  extractOptimizationInstructionTitle,
  type ResumeOptimizationHistoryEntry,
} from '../utils/resume-optimization-persistence'
import type { AiWorkbenchScenario } from '../types/ai-workbench.types'
import { formatOptimizationModule, formatScenario } from '../utils/analysis-utils'

interface ResumeOptimizationHistoryPanelProps {
  entries: ResumeOptimizationHistoryEntry[]
  onOpenDetail: (entry: ResumeOptimizationHistoryEntry) => void
  relationStates: Record<
    string,
    {
      completionLabel: string
      linkedScenarios: AiWorkbenchScenario[]
    }
  >
}

const HISTORY_ROWS_PER_PAGE = 5

function formatHistoryTime(createdAt: string) {
  return new Date(createdAt).toLocaleString('zh-CN', {
    hour12: false,
    month: 'numeric',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

function formatLinkedScenarioLabel(scenario: AiWorkbenchScenario): string {
  return formatScenario(scenario)
}

function HistoryActionIcon({
  type,
}: {
  type: 'detail' | 'open' | 'source'
}) {
  if (type === 'detail') {
    return (
      <svg aria-hidden="true" fill="none" height="16" viewBox="0 0 24 24" width="16">
        <path
          d="M4 12s2.8-5 8-5 8 5 8 5-2.8 5-8 5-8-5-8-5Z"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="1.8"
        />
        <circle cx="12" cy="12" r="2.4" stroke="currentColor" strokeWidth="1.8" />
      </svg>
    )
  }

  if (type === 'open') {
    return (
      <svg aria-hidden="true" fill="none" height="16" viewBox="0 0 24 24" width="16">
        <path
          d="M14 5h5v5M13 11l6-6"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="1.8"
        />
        <path
          d="M19 13.5v4A1.5 1.5 0 0 1 17.5 19h-11A1.5 1.5 0 0 1 5 17.5v-11A1.5 1.5 0 0 1 6.5 5h4"
          stroke="currentColor"
          strokeLinecap="round"
          strokeWidth="1.8"
        />
      </svg>
    )
  }

  return (
    <svg aria-hidden="true" fill="none" height="16" viewBox="0 0 24 24" width="16">
      <path
        d="M7 4.5h7l3 3v12H7v-15Z"
        stroke="currentColor"
        strokeLinejoin="round"
        strokeWidth="1.8"
      />
      <path d="M14 4.5v3h3" stroke="currentColor" strokeWidth="1.8" />
      <path
        d="M9.5 11h5M9.5 14h5M9.5 17h3"
        stroke="currentColor"
        strokeLinecap="round"
        strokeWidth="1.8"
      />
    </svg>
  )
}

function InstructionContentModal({
  summary,
  title,
}: {
  summary: string
  title: string
}) {
  const [isOpen, setIsOpen] = useState(false)
  const displaySummary = summary.trim() || '这条记录暂无可展示的摘要信息。'

  return (
    <>
      <AdminActionIconButton
        icon={<HistoryActionIcon type="source" />}
        label="查看原文"
        onPress={() => setIsOpen(true)}
      />
      <AdminModalShell
        dialogClassName="sm:max-w-180"
        isOpen={isOpen}
        onOpenChange={setIsOpen}>
        <Modal.CloseTrigger aria-label="关闭原始指令内容" />
        <Modal.Header>
          <Modal.Heading>{title}</Modal.Heading>
        </Modal.Header>
        <Modal.Body>
          <div
            className="max-h-[62vh] overflow-auto rounded-[1.25rem] border border-zinc-200/80 bg-zinc-50/90 p-4 text-sm leading-7 text-zinc-700 dark:border-zinc-800 dark:bg-zinc-900/70 dark:text-zinc-200"
            data-testid="optimization-history-summary-modal-body">
            <pre className="whitespace-pre-wrap wrap-break-word font-sans">{displaySummary}</pre>
          </div>
        </Modal.Body>
        <Modal.Footer>
          <Button slot="close" type="button" variant="secondary">
            关闭
          </Button>
        </Modal.Footer>
      </AdminModalShell>
    </>
  )
}

export function ResumeOptimizationHistoryPanel({
  entries,
  onOpenDetail,
  relationStates,
}: ResumeOptimizationHistoryPanelProps) {
  const [page, setPage] = useState(1)

  const totalPages = Math.max(1, Math.ceil(entries.length / HISTORY_ROWS_PER_PAGE))
  const pages = useMemo(
    () => Array.from({ length: totalPages }, (_, index) => index + 1),
    [totalPages],
  )
  const paginatedEntries = useMemo(() => {
    const startIndex = (page - 1) * HISTORY_ROWS_PER_PAGE

    return entries.slice(startIndex, startIndex + HISTORY_ROWS_PER_PAGE)
  }, [entries, page])
  const rangeStart = entries.length === 0 ? 0 : (page - 1) * HISTORY_ROWS_PER_PAGE + 1
  const rangeEnd = entries.length === 0 ? 0 : Math.min(page * HISTORY_ROWS_PER_PAGE, entries.length)

  useEffect(() => {
    if (page > totalPages) {
      setPage(totalPages)
    }
  }, [page, totalPages])

  return (
    <section className="grid gap-5 rounded-[2rem] border border-zinc-200/80 bg-white/88 p-5 shadow-[0_18px_52px_rgba(15,23,42,0.06)] dark:border-zinc-800 dark:bg-zinc-950/70 dark:shadow-none">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div className="grid gap-2">
          <p className="eyebrow">最近优化记录</p>
          <h2 className="text-2xl font-semibold tracking-tight text-zinc-950 dark:text-white">
            基于记录中心统一回看 AI 调用结果
          </h2>
          <p className="max-w-3xl text-sm leading-6 text-zinc-500 dark:text-zinc-400">
            每条优化建议会作为记录中心入口，继续向下关联 JD 匹配、Offer 对比和简历评审分析，
            不再把缓存体验拆成独立的大块模块。
          </p>
        </div>
        <span className="rounded-full border border-blue-200/70 bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700 dark:border-blue-400/20 dark:bg-blue-400/10 dark:text-blue-200">
          {entries.length} 条记录
        </span>
      </div>

      {entries.length === 0 ? (
        <div className="grid min-h-[11rem] place-items-center rounded-[1.75rem] border border-dashed border-zinc-200/90 bg-[linear-gradient(135deg,rgba(248,250,252,0.9),rgba(239,246,255,0.72))] p-6 text-center dark:border-zinc-800 dark:bg-[linear-gradient(135deg,rgba(15,23,42,0.76),rgba(30,41,59,0.46))]">
          <div className="grid max-w-xl gap-2">
            <strong className="text-lg text-zinc-950 dark:text-white">还没有历史记录</strong>
            <span className="text-sm leading-6 text-zinc-500 dark:text-zinc-400">
              首次生成结构化建议后，这里会自动保留最近几次的优化记录，并作为 AI
              记录中心的主入口。
            </span>
          </div>
        </div>
      ) : (
        <Table>
          <Table.ResizableContainer>
            <Table.Content aria-label="优化记录中心表格">
              <Table.Header>
                <Table.Column className="w-34" isRowHeader>
                  生成时间
                </Table.Column>
                <Table.Column>优化摘要</Table.Column>
                <Table.Column>影响模块</Table.Column>
                <Table.Column>关联状态</Table.Column>
                <Table.Column>操作</Table.Column>
              </Table.Header>
              <Table.Body items={paginatedEntries}>
                {(entry) => {
                  const relationState = relationStates[entry.resultId]
                  const linkedScenarios = relationState?.linkedScenarios ?? []
                  const instructionTitle = extractOptimizationInstructionTitle(entry.instruction)

                  return (
                    <Table.Row id={entry.resultId} key={entry.resultId}>
                      <Table.Cell>
                        <div className="grid gap-1">
                          <strong className="text-sm text-zinc-950 dark:text-white">
                            {formatHistoryTime(entry.createdAt)}
                          </strong>
                        </div>
                      </Table.Cell>
                      <Table.Cell>
                        <div className="flex min-w-0 items-start justify-between gap-3">
                          <div className="min-w-0 grid gap-1.5">
                            <strong className="line-clamp-1 text-sm leading-6 text-zinc-950 dark:text-white">
                              {instructionTitle}
                            </strong>
                            <span className="line-clamp-1 text-sm leading-6 text-zinc-500 dark:text-zinc-400">
                              {entry.summary}
                            </span>
                          </div>
                          <InstructionContentModal
                            summary={entry.summary}
                            title={instructionTitle}
                          />
                        </div>
                      </Table.Cell>
                      <Table.Cell>
                        <div className="flex flex-wrap gap-2">
                          {entry.changedModules.map((module) => (
                            <Chip
                              className="text-xs"
                              key={`${entry.resultId}-${module}`}
                              size="sm"
                              variant="soft">
                              {formatOptimizationModule(module)}
                            </Chip>
                          ))}
                        </div>
                      </Table.Cell>
                      <Table.Cell>
                        <div className="grid gap-2">
                          <span className="whitespace-nowrap text-sm font-medium text-zinc-900 dark:text-zinc-100">
                            {relationState?.completionLabel ?? '仅优化建议'}
                          </span>
                          <div className="flex flex-wrap gap-2 whitespace-normal">
                            {linkedScenarios.length > 0 ? (
                              linkedScenarios.map((scenario) => (
                                <span
                                  className="whitespace-nowrap rounded-full border border-blue-200/70 bg-blue-50 px-2.5 py-1 text-[11px] font-medium text-blue-700 dark:border-blue-400/20 dark:bg-blue-400/10 dark:text-blue-200"
                                  key={`${entry.resultId}-${scenario}`}>
                                  {formatLinkedScenarioLabel(scenario)}
                                </span>
                              ))
                            ) : (
                              <span className="text-xs text-zinc-500 dark:text-zinc-400">
                                暂无辅助分析关联
                              </span>
                            )}
                          </div>
                        </div>
                      </Table.Cell>
                      <Table.Cell>
                        <div className="flex justify-end gap-2">
                          <AdminActionIconButton
                            icon={<HistoryActionIcon type="detail" />}
                            label="查看详情"
                            onPress={() => onOpenDetail(entry)}
                          />
                          <Tooltip delay={180}>
                            <Tooltip.Trigger>
                              <Link
                                aria-label="打开结果页"
                                className={adminActionIconTriggerClassName}
                                href={`/dashboard/ai/resume-optimization/results/${entry.resultId}`}>
                                <HistoryActionIcon type="open" />
                              </Link>
                            </Tooltip.Trigger>
                            <Tooltip.Content offset={10} placement="top">
                              打开结果页
                            </Tooltip.Content>
                          </Tooltip>
                        </div>
                      </Table.Cell>
                    </Table.Row>
                  )
                }}
              </Table.Body>
            </Table.Content>
          </Table.ResizableContainer>
          <Table.Footer>
            <Pagination
              className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between"
              data-testid="optimization-history-pagination"
              size="sm">
              <Pagination.Summary data-testid="optimization-history-pagination-summary">
                {`第 ${rangeStart}-${rangeEnd} 条，共 ${entries.length} 条`}
              </Pagination.Summary>
              <Pagination.Content className="flex flex-wrap justify-end gap-1.5">
                <Pagination.Item>
                  <Pagination.Previous
                    isDisabled={page === 1}
                    onPress={() => setPage((currentPage) => Math.max(1, currentPage - 1))}>
                    <Pagination.PreviousIcon />
                    上一页
                  </Pagination.Previous>
                </Pagination.Item>
                {pages.map((targetPage) => (
                  <Pagination.Item key={targetPage}>
                    <Pagination.Link
                      isActive={targetPage === page}
                      onPress={() => setPage(targetPage)}>
                      {targetPage}
                    </Pagination.Link>
                  </Pagination.Item>
                ))}
                <Pagination.Item>
                  <Pagination.Next
                    isDisabled={page === totalPages}
                    onPress={() =>
                      setPage((currentPage) => Math.min(totalPages, currentPage + 1))
                    }>
                    下一页
                    <Pagination.NextIcon />
                  </Pagination.Next>
                </Pagination.Item>
              </Pagination.Content>
            </Pagination>
          </Table.Footer>
        </Table>
      )}
    </section>
  )
}
