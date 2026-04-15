'use client'

import { Card, CardContent, CardHeader, Chip } from '@heroui/react'
import { buildPublishedResumeExportUrl, type ResumeLocale } from '@my-resume/api-client'
import { DisplaySectionIntro } from '@my-resume/ui/display'
import type { ChangeEvent } from 'react'
import { useState } from 'react'

type ExportEntryPanelProps = {
  apiBaseUrl: string
  locale: ResumeLocale
  role: 'admin' | 'viewer'
}

export function ExportEntryPanel({ apiBaseUrl, locale, role }: ExportEntryPanelProps) {
  const [selectedLocale, setSelectedLocale] = useState<ResumeLocale>(locale)

  function handleLocaleChange(event: ChangeEvent<HTMLSelectElement>) {
    setSelectedLocale(event.target.value as ResumeLocale)
  }

  return (
    <Card className="border border-zinc-200/70 dark:border-zinc-800">
      <CardHeader className="flex flex-col items-start gap-2">
        <div className="flex w-full flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <p className="eyebrow">导出下载</p>
            <Chip size="sm">{selectedLocale.toUpperCase()}</Chip>
          </div>
          <label className="flex min-w-[11rem] items-center gap-2 text-sm font-semibold text-[var(--admin-text-muted)]">
            <span className="shrink-0">导出语言</span>
            <select
              aria-label="导出语言"
              className="min-h-9 rounded-full px-3 py-1.5 text-sm font-semibold"
              onChange={handleLocaleChange}
              value={selectedLocale}>
              <option value="zh">中文版本</option>
              <option value="en">英文版本</option>
            </select>
          </label>
        </div>
        <DisplaySectionIntro
          className="gap-2"
          description="当前后台下载入口仅导出已发布版本，草稿仍以后台编辑流为准。"
          descriptionClassName="text-[var(--admin-text-muted)]"
          title="后台下载入口"
        />
      </CardHeader>
      <CardContent className="stack">
        <div className="flex flex-wrap items-center gap-3" data-testid="export-actions">
          <a
            className="link-button min-h-10 px-4 py-2 text-[0.95rem]"
            href={buildPublishedResumeExportUrl({
              apiBaseUrl,
              format: 'markdown',
              locale: selectedLocale,
            })}
            target="_blank">
            下载 Markdown
          </a>
          <a
            className="secondary-link-button min-h-10 px-4 py-2 text-[0.95rem]"
            href={buildPublishedResumeExportUrl({
              apiBaseUrl,
              format: 'pdf',
              locale: selectedLocale,
            })}
            target="_blank">
            下载 PDF
          </a>
        </div>

        <p className="muted">
          {role === 'viewer'
            ? 'viewer 只能读取已发布导出结果，不能触发新的生成动作。'
            : 'admin 可下载已发布结果，并继续在后台推进发布与 AI 流程。'}
        </p>
      </CardContent>
    </Card>
  )
}
