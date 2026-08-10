'use client'

import { Card, CardContent, CardHeader, Chip, ListBox, Select } from '@heroui/react'
import { buildPublishedResumeExportUrl, type ResumeLocale } from '@my-resume/api-client'
import { DisplaySectionIntro } from '@my-resume/ui/display'
import { useState } from 'react'

type ExportEntryPanelProps = {
  apiBaseUrl: string
  locale: ResumeLocale
  publicSiteBaseUrl: string
  role: 'admin' | 'viewer'
}

export function ExportEntryPanel({
  apiBaseUrl,
  locale,
  publicSiteBaseUrl,
  role,
}: ExportEntryPanelProps) {
  const [selectedLocale, setSelectedLocale] = useState<ResumeLocale>(locale)
  const pdfPreviewUrl = buildPdfPreviewUrl({
    locale: selectedLocale,
    publicSiteBaseUrl,
  })

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
            <Select
              aria-label="导出语言"
              className="min-w-[8.5rem]"
              onSelectionChange={(key) => setSelectedLocale(String(key) as ResumeLocale)}
              selectedKey={selectedLocale}
              variant="secondary">
              <Select.Trigger aria-label="导出语言">
                <Select.Value />
                <Select.Indicator />
              </Select.Trigger>
              <Select.Popover>
                <ListBox>
                  <ListBox.Item id="zh" textValue="中文版本">
                    中文版本
                    <ListBox.ItemIndicator />
                  </ListBox.Item>
                  <ListBox.Item id="en" textValue="英文版本">
                    英文版本
                    <ListBox.ItemIndicator />
                  </ListBox.Item>
                </ListBox>
              </Select.Popover>
            </Select>
          </label>
        </div>
        <DisplaySectionIntro
          className="gap-2"
          description="Markdown 直接下载已发布版本；PDF 会打开公开站预览页，由浏览器生成并下载。"
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
            href={pdfPreviewUrl}
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

function buildPdfPreviewUrl(input: {
  locale: ResumeLocale
  publicSiteBaseUrl: string
}) {
  const baseUrl = resolvePublicSiteBaseUrl(input.publicSiteBaseUrl)
  return `${baseUrl}/${input.locale}/review-resume?locale=${input.locale}`
}

function resolvePublicSiteBaseUrl(publicSiteBaseUrl: string) {
  const normalizedBaseUrl = publicSiteBaseUrl.replace(/\/+$/, '')

  if (normalizedBaseUrl !== 'http://localhost:5555') {
    return normalizedBaseUrl
  }

  if (typeof window === 'undefined') {
    return normalizedBaseUrl
  }

  const currentUrl = new URL(window.location.href)

  if (currentUrl.port === '5566') {
    currentUrl.port = '5555'
    return currentUrl.origin
  }

  if (currentUrl.hostname.startsWith('admin-resume.')) {
    currentUrl.hostname = currentUrl.hostname.replace(/^admin-resume\./, 'resume.')
    return currentUrl.origin
  }

  if (currentUrl.hostname.startsWith('admin.')) {
    currentUrl.hostname = currentUrl.hostname.replace(/^admin\./, '')
    return currentUrl.origin
  }

  return normalizedBaseUrl
}
