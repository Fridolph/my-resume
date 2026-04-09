import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { ExportEntryPanel } from '../export-entry-panel'

describe('ExportEntryPanel', () => {
  it('should render markdown and pdf download links for admin surface', () => {
    const adminProps = {
      apiBaseUrl: 'http://localhost:5577',
      locale: 'zh' as const,
      role: 'admin' as const,
    }

    render(<ExportEntryPanel {...adminProps} />)

    expect(screen.getByRole('link', { name: '下载 Markdown' })).toHaveAttribute(
      'href',
      'http://localhost:5577/resume/published/export/markdown?locale=zh',
    )
    expect(screen.getByRole('link', { name: '下载 PDF' })).toHaveAttribute(
      'href',
      'http://localhost:5577/resume/published/export/pdf?locale=zh',
    )
    expect(
      screen.getByText('当前后台下载入口仅导出已发布版本，草稿仍以后台编辑流为准。'),
    ).toBeInTheDocument()
  })

  it('should show viewer read-only guidance', () => {
    const viewerProps = {
      apiBaseUrl: 'http://localhost:5577',
      locale: 'zh' as const,
      role: 'viewer' as const,
    }

    render(<ExportEntryPanel {...viewerProps} />)

    expect(
      screen.getByText('viewer 只能读取已发布导出结果，不能触发新的生成动作。'),
    ).toBeInTheDocument()
  })
})
