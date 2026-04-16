'use client'

import { Button, Table } from '@heroui/react'

import type { AiUsageRecordSummary } from '../types/ai-workbench.types'
import { formatLocale, formatScenario } from '../utils/analysis-utils'

interface AiAnalysisHistoryTableProps {
  records: AiUsageRecordSummary[]
  onOpenDetail: (recordId: string) => void
}

function formatGeneratorLabel(generator: AiUsageRecordSummary['generator']) {
  return generator === 'mock-cache' ? '缓存 / Mock' : '真实 Provider'
}

function formatCreatedAt(createdAt: string) {
  return new Date(createdAt).toLocaleString('zh-CN', {
    hour12: false,
    month: 'numeric',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export function AiAnalysisHistoryTable({
  records,
  onOpenDetail,
}: AiAnalysisHistoryTableProps) {
  if (records.length === 0) {
    return (
      <div className="grid min-h-[16rem] place-items-center rounded-[1.5rem] border border-dashed border-zinc-200/80 bg-zinc-50/72 p-6 text-center dark:border-zinc-800 dark:bg-zinc-900/50">
        <div className="grid max-w-lg gap-2">
          <strong className="text-base text-zinc-950 dark:text-white">还没有辅助分析记录</strong>
          <span className="text-sm leading-6 text-zinc-500 dark:text-zinc-400">
            生成辅助分析报告后，这里会按场景保留最近的真实 AI 调用记录，方便回看结论层、依据层和风险层。
          </span>
        </div>
      </div>
    )
  }

  return (
    <div className="rounded-[1.5rem] border border-zinc-200/80 bg-white/82 p-3 shadow-sm dark:border-zinc-800 dark:bg-zinc-950/70">
      <Table aria-label="AI 辅助分析记录表格">
        <Table.Header>
          <Table.Column isRowHeader>场景</Table.Column>
          <Table.Column>语言 / 来源</Table.Column>
          <Table.Column>评分 / 摘要</Table.Column>
          <Table.Column>Provider</Table.Column>
          <Table.Column>生成时间</Table.Column>
          <Table.Column>操作</Table.Column>
        </Table.Header>
        <Table.Body items={records}>
          {(record) => (
            <Table.Row id={record.id} key={record.id}>
              <Table.Cell>
                <div className="grid gap-1">
                  <strong className="text-sm text-zinc-950 dark:text-white">
                    {formatScenario(record.scenario)}
                  </strong>
                  <span className="text-xs text-zinc-500 dark:text-zinc-400">
                    {record.status === 'failed' ? '失败记录' : '成功记录'}
                  </span>
                </div>
              </Table.Cell>
              <Table.Cell>
                <div className="grid gap-1 text-sm text-zinc-600 dark:text-zinc-300">
                  <span>{formatLocale(record.locale)}</span>
                  <span>{formatGeneratorLabel(record.generator)}</span>
                </div>
              </Table.Cell>
              <Table.Cell>
                <div className="grid gap-1">
                  {typeof record.scoreValue === 'number' ? (
                    <strong className="text-sm text-zinc-950 dark:text-white">
                      {record.scoreValue} / 100
                    </strong>
                  ) : null}
                  <span className="line-clamp-2 text-sm leading-6 text-zinc-500 dark:text-zinc-400">
                    {record.status === 'failed'
                      ? record.errorMessage ?? '本次分析失败'
                      : record.summary ?? '本次调用未返回摘要'}
                  </span>
                </div>
              </Table.Cell>
              <Table.Cell>
                <div className="grid gap-1 text-sm text-zinc-600 dark:text-zinc-300">
                  <span>{record.provider}</span>
                  <span className="text-xs">{record.model}</span>
                </div>
              </Table.Cell>
              <Table.Cell>
                <div className="grid gap-1 text-sm text-zinc-600 dark:text-zinc-300">
                  <span>{formatCreatedAt(record.createdAt)}</span>
                  <span className="text-xs">{record.durationMs}ms</span>
                </div>
              </Table.Cell>
              <Table.Cell>
                <Button
                  onPress={() => onOpenDetail(record.id)}
                  size="sm"
                  type="button"
                  variant="outline">
                  查看详情
                </Button>
              </Table.Cell>
            </Table.Row>
          )}
        </Table.Body>
      </Table>
    </div>
  )
}
