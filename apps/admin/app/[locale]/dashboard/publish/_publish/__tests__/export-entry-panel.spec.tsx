import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'

import { ExportEntryPanel } from '../components/export-entry-panel'

async function selectHeroUiOption(
  user: ReturnType<typeof userEvent.setup>,
  label: string,
  optionText: string,
) {
  const trigger = screen.getByLabelText(label)
  await user.click(trigger)
  await user.click(screen.getByRole('option', { name: optionText }))
  await waitFor(() => {
    expect(trigger).toHaveTextContent(optionText)
  })
}

describe('ExportEntryPanel', () => {
  it('should render markdown and pdf download links for selected locale', async () => {
    const user = userEvent.setup()
    const adminProps = {
      apiBaseUrl: 'http://localhost:5577',
      locale: 'zh' as const,
      role: 'admin' as const,
    }

    render(<ExportEntryPanel {...adminProps} />)

    expect(screen.getByRole('link', { name: '下载 Markdown' })).toHaveAttribute(
      'href',
      'http://localhost:5577/api/resume/published/export/markdown?locale=zh',
    )
    expect(screen.getByRole('link', { name: '下载 PDF' })).toHaveAttribute(
      'href',
      'http://localhost:5577/api/resume/published/export/pdf?locale=zh',
    )
    expect(screen.getByLabelText('导出语言')).toHaveTextContent('中文版本')
    expect(screen.getByTestId('export-actions')).toHaveClass('gap-3')
    expect(screen.getByRole('link', { name: '下载 Markdown' })).toHaveClass(
      'min-h-10',
      'px-4',
    )
    expect(screen.getByRole('link', { name: '下载 PDF' })).toHaveClass(
      'min-h-10',
      'px-4',
    )
    expect(
      screen.getByText('当前后台下载入口仅导出已发布版本，草稿仍以后台编辑流为准。'),
    ).toBeInTheDocument()

    await selectHeroUiOption(user, '导出语言', '英文版本')

    expect(screen.getByText('EN')).toBeInTheDocument()
    expect(screen.getByLabelText('导出语言')).toHaveTextContent('英文版本')
    expect(screen.getByRole('link', { name: '下载 Markdown' })).toHaveAttribute(
      'href',
      'http://localhost:5577/api/resume/published/export/markdown?locale=en',
    )
    expect(screen.getByRole('link', { name: '下载 PDF' })).toHaveAttribute(
      'href',
      'http://localhost:5577/api/resume/published/export/pdf?locale=en',
    )
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
