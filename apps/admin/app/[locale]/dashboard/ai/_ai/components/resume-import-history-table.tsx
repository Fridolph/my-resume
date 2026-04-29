'use client'

import { Button, Chip, Pagination, Table, Tooltip } from '@heroui/react'
import Link from 'next/link'
import { useMemo, useState } from 'react'

import type { AiUsageRecordSummary } from '../types/ai-workbench.types'

const HISTORY_PAGE_SIZE = 10

interface ResumeImportHistoryTableProps {
  /** 简历导入识别历史记录，来源于 ai_usage_records 的 resume-import 筛选。 */
  records: AiUsageRecordSummary[]
  /** 点击查看某条历史记录详情时触发。 */
  onViewRecord?: (record: AiUsageRecordSummary) => void
  /** 点击删除某条历史记录时触发。 */
  onDeleteRecord?: (record: AiUsageRecordSummary) => void
  /** 当前正在删除的历史记录 ID。 */
  deletingRecordId?: string | null
}

function formatCreatedAt(createdAt: string) {
  return new Date(createdAt).toLocaleString('zh-CN', {
    hour12: false,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  })
}

function formatDuration(durationMs: number) {
  const totalSeconds = Math.max(0, Math.round(durationMs / 1000))
  const minutes = Math.floor(totalSeconds / 60)
  const seconds = totalSeconds % 60

  return minutes > 0 ? `${minutes} 分 ${seconds} 秒` : `${seconds} 秒`
}

function ViewIcon() {
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

function OpenIcon() {
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

function TrashIcon() {
  return (
    <svg aria-hidden="true" fill="none" height="16" viewBox="0 0 24 24" width="16">
      <path
        d="M6 7h12M9.5 7V5.5a1 1 0 0 1 1-1h3a1 1 0 0 1 1 1V7M10.5 11v6M13.5 11v6"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.8"
      />
      <path
        d="M5 7l1.5 12a1 1 0 0 0 1 1h9a1 1 0 0 0 1-1L19 7"
        stroke="currentColor"
        strokeLinejoin="round"
        strokeWidth="1.8"
      />
    </svg>
  )
}

const actionIconClass = [
  'inline-flex h-8 w-8 min-w-8 items-center justify-center rounded-full p-0 text-zinc-500',
  'transition-colors focus-visible:ring-2 focus-visible:ring-blue-500/20',
  'data-[hovered=true]:text-zinc-900',
  'dark:text-zinc-300',
  'dark:data-[hovered=true]:text-white',
].join(' ')

function getPageNumbers(page: number, totalPages: number): Array<number | 'ellipsis'> {
  if (totalPages <= 7) {
    return Array.from({ length: totalPages }, (_, index) => index + 1)
  }

  const pages: Array<number | 'ellipsis'> = [1]

  if (page > 3) {
    pages.push('ellipsis')
  }

  const start = Math.max(2, page - 1)
  const end = Math.min(totalPages - 1, page + 1)

  for (let item = start; item <= end; item += 1) {
    pages.push(item)
  }

  if (page < totalPages - 2) {
    pages.push('ellipsis')
  }

  pages.push(totalPages)

  return pages
}

function RecordTextWithTooltip({ children }: { children: string }) {
  return (
    <Tooltip delay={250}>
      <Tooltip.Trigger>
        <span className="line-clamp-2 cursor-help leading-5">{children}</span>
      </Tooltip.Trigger>
      <Tooltip.Content className="max-w-md whitespace-normal leading-6" showArrow>
        <Tooltip.Arrow />
        {children}
      </Tooltip.Content>
    </Tooltip>
  )
}

export function ResumeImportHistoryTable({
  records,
  onDeleteRecord,
  onViewRecord,
  deletingRecordId,
}: ResumeImportHistoryTableProps) {
  const [page, setPage] = useState(1)
  const totalPages = Math.max(1, Math.ceil(records.length / HISTORY_PAGE_SIZE))
  const safePage = Math.min(page, totalPages)
  const visibleRecords = useMemo(
    () => records.slice((safePage - 1) * HISTORY_PAGE_SIZE, safePage * HISTORY_PAGE_SIZE),
    [records, safePage],
  )
  const startItem = records.length === 0 ? 0 : (safePage - 1) * HISTORY_PAGE_SIZE + 1
  const endItem = Math.min(safePage * HISTORY_PAGE_SIZE, records.length)

  if (records.length === 0) {
    return (
      <div className="grid min-h-[10rem] place-items-center rounded-[1rem] border border-dashed border-zinc-200/80 text-center dark:border-zinc-800">
        <div className="grid max-w-lg gap-2">
          <strong className="text-base text-zinc-950 dark:text-white">
            还没有简历导入识别记录
          </strong>
          <span className="text-sm leading-6 text-zinc-500 dark:text-zinc-400">
            上传并完成一次识别后，这里会保留成功与失败记录，方便回看结果、排查错误和整理教程素材。
          </span>
        </div>
      </div>
    )
  }

  return (
    <div className="grid gap-4">
      <Table variant="secondary">
        <Table.ScrollContainer>
          <Table.Content aria-label="简历导入识别历史记录表格" className="min-w-[960px]">
            <Table.Header>
              <Table.Column isRowHeader className="w-[34%]">文件 / 摘要</Table.Column>
              <Table.Column>状态</Table.Column>
              <Table.Column>模型</Table.Column>
              <Table.Column>耗时</Table.Column>
              <Table.Column>创建时间</Table.Column>
              <Table.Column className="w-28 text-right">操作</Table.Column>
            </Table.Header>
            <Table.Body items={visibleRecords}>
              {(record) => (
                <Table.Row id={record.id} key={record.id}>
                  <Table.Cell>
                    <div className="grid max-w-xl gap-1">
                      <strong className="text-sm text-zinc-950 dark:text-white">
                        <RecordTextWithTooltip>{record.inputPreview}</RecordTextWithTooltip>
                      </strong>
                      <span className="text-xs text-zinc-500 dark:text-zinc-400">
                        <RecordTextWithTooltip>
                          {record.status === 'failed'
                            ? record.errorMessage ?? '本次识别失败'
                            : record.summary ?? '本次识别暂无摘要'}
                        </RecordTextWithTooltip>
                      </span>
                    </div>
                  </Table.Cell>
                  <Table.Cell>
                    <Chip
                      color={record.status === 'succeeded' ? 'success' : 'danger'}
                      size="sm"
                      variant="soft">
                      <Chip.Label>
                        {record.status === 'succeeded' ? 'OK' : 'FAIL'}
                      </Chip.Label>
                    </Chip>
                  </Table.Cell>
                  <Table.Cell>
                    <Chip size="sm" variant="soft">
                      <Chip.Label>{record.model}</Chip.Label>
                    </Chip>
                  </Table.Cell>
                  <Table.Cell>
                    <span className="whitespace-nowrap text-sm text-zinc-700 dark:text-zinc-200">
                      {formatDuration(record.durationMs)}
                    </span>
                  </Table.Cell>
                  <Table.Cell>
                    <span className="text-sm text-zinc-600 dark:text-zinc-300">
                      {formatCreatedAt(record.createdAt)}
                    </span>
                  </Table.Cell>
                  <Table.Cell>
                    <div className="flex items-center gap-1.5">
                      {record.relatedResultId ? (
                        <Tooltip delay={180}>
                          <Tooltip.Trigger>
                            <Link
                              aria-label="打开识别结果"
                              className={actionIconClass}
                              href={`/dashboard/ai/resume-import/results/${record.relatedResultId}`}>
                              <OpenIcon />
                            </Link>
                          </Tooltip.Trigger>
                          <Tooltip.Content offset={10} placement="top">
                            打开识别结果
                          </Tooltip.Content>
                        </Tooltip>
                      ) : null}
                      <Tooltip delay={180}>
                        <Tooltip.Trigger>
                          <Button
                            aria-label="查看详情"
                            className={actionIconClass}
                            isIconOnly
                            onPress={() => onViewRecord?.(record)}
                            size="sm"
                            type="button"
                            variant="ghost">
                            <ViewIcon />
                          </Button>
                        </Tooltip.Trigger>
                        <Tooltip.Content offset={10} placement="top">
                          查看详情
                        </Tooltip.Content>
                      </Tooltip>
                      <Tooltip delay={180}>
                        <Tooltip.Trigger>
                          <Button
                            aria-label="删除记录"
                            className={actionIconClass}
                            isDisabled={deletingRecordId === record.id}
                            isIconOnly
                            onPress={() => onDeleteRecord?.(record)}
                            size="sm"
                            type="button"
                            variant="ghost">
                            <TrashIcon />
                          </Button>
                        </Tooltip.Trigger>
                        <Tooltip.Content offset={10} placement="top">
                          删除
                        </Tooltip.Content>
                      </Tooltip>
                    </div>
                  </Table.Cell>
                </Table.Row>
              )}
            </Table.Body>
          </Table.Content>
        </Table.ScrollContainer>
      </Table>

      {totalPages > 1 ? (
        <Pagination className="w-full">
          <Pagination.Summary>
            显示 {startItem}-{endItem} / 共 {records.length} 条，每页 {HISTORY_PAGE_SIZE} 条
          </Pagination.Summary>
          <Pagination.Content>
            <Pagination.Item>
              <Pagination.Previous
                isDisabled={safePage === 1}
                onPress={() => setPage((current) => Math.max(1, current - 1))}>
                <Pagination.PreviousIcon />
                <span>上一页</span>
              </Pagination.Previous>
            </Pagination.Item>
            {getPageNumbers(safePage, totalPages).map((pageNumber, index) =>
              pageNumber === 'ellipsis' ? (
                <Pagination.Item key={`ellipsis-${index}`}>
                  <Pagination.Ellipsis />
                </Pagination.Item>
              ) : (
                <Pagination.Item key={pageNumber}>
                  <Pagination.Link
                    isActive={pageNumber === safePage}
                    onPress={() => setPage(pageNumber)}>
                    {pageNumber}
                  </Pagination.Link>
                </Pagination.Item>
              ),
            )}
            <Pagination.Item>
              <Pagination.Next
                isDisabled={safePage === totalPages}
                onPress={() => setPage((current) => Math.min(totalPages, current + 1))}>
                <span>下一页</span>
                <Pagination.NextIcon />
              </Pagination.Next>
            </Pagination.Item>
          </Pagination.Content>
        </Pagination>
      ) : null}
    </div>
  )
}
