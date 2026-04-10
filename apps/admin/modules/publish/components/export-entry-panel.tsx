'use client'

import { Card, CardContent, CardHeader, Chip } from '@heroui/react'
import { buildPublishedResumeExportUrl, type ResumeLocale } from '@my-resume/api-client'
import { DisplaySectionIntro } from '@my-resume/ui/display'

type ExportEntryPanelProps = {
  apiBaseUrl: string
  locale: ResumeLocale
  role: 'admin' | 'viewer'
}

export function ExportEntryPanel({ apiBaseUrl, locale, role }: ExportEntryPanelProps) {
  return (
    <Card className="border border-zinc-200/70 dark:border-zinc-800">
      <CardHeader className="flex flex-col items-start gap-2">
        <div className="flex items-center gap-2">
          <p className="eyebrow">导出下载</p>
          <Chip size="sm">{locale.toUpperCase()}</Chip>
        </div>
        <DisplaySectionIntro
          className="gap-2"
          description="当前后台下载入口仅导出已发布版本，草稿仍以后台编辑流为准。"
          descriptionClassName="text-[var(--admin-text-muted)]"
          title="后台下载入口"
        />
      </CardHeader>
      <CardContent className="stack">
        <div className="toolbar-group">
          <a
            className="link-button"
            href={buildPublishedResumeExportUrl({
              apiBaseUrl,
              format: 'markdown',
              locale,
            })}
            target="_blank">
            下载 Markdown
          </a>
          <a
            className="secondary-link-button"
            href={buildPublishedResumeExportUrl({
              apiBaseUrl,
              format: 'pdf',
              locale,
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
