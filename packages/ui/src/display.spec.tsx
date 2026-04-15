import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import {
  DisplayPill,
  DisplaySectionCard,
  DisplaySectionIntro,
  DisplayStatCard,
  DisplaySurfaceCard,
} from './display'

describe('display primitives', () => {
  it('should render surface card with semantic element override', () => {
    render(
      <DisplaySurfaceCard as="article">
        <p>共享容器内容</p>
      </DisplaySurfaceCard>,
    )

    const card = screen.getByRole('article')

    expect(card).toHaveClass('display-surface-card')
    expect(screen.getByText('共享容器内容')).toBeInTheDocument()
  })

  it('should render section intro with eyebrow, title and description', () => {
    render(
      <DisplaySectionIntro
        compact
        description="帮助两端共享标题块结构。"
        eyebrow="共享展示"
        title="Section Intro"
      />,
    )

    expect(screen.getByText('共享展示')).toBeInTheDocument()
    expect(
      screen.getByRole('heading', { name: 'Section Intro', level: 2 }),
    ).toBeInTheDocument()
    expect(screen.getByText('帮助两端共享标题块结构。')).toBeInTheDocument()
  })

  it('should merge custom slot class names for shared intro reuse', () => {
    render(
      <DisplaySectionIntro
        description="可复用描述"
        descriptionClassName="custom-description"
        eyebrow="共享标题"
        eyebrowClassName="custom-eyebrow"
        title="标题"
        titleClassName="custom-title"
      />,
    )

    expect(screen.getByText('共享标题')).toHaveClass('eyebrow', 'custom-eyebrow')
    expect(screen.getByText('标题')).toHaveClass('display-section-title', 'custom-title')
    expect(screen.getByText('可复用描述')).toHaveClass(
      'display-section-description',
      'custom-description',
    )
  })

  it('should render stat card with label, value and description', () => {
    render(
      <DisplayStatCard description="当前统计项说明" label="当前状态" value="READY" />,
    )

    expect(screen.getByText('当前状态')).toBeInTheDocument()
    expect(screen.getByText('READY')).toBeInTheDocument()
    expect(screen.getByText('当前统计项说明')).toBeInTheDocument()
  })

  it('should render section card header and optional action together', () => {
    render(
      <DisplaySectionCard
        action={<button type="button">操作按钮</button>}
        compact
        description="说明文案"
        eyebrow="共享卡片"
        title="统一标题">
        <p>卡片正文</p>
      </DisplaySectionCard>,
    )

    expect(screen.getByRole('heading', { name: '统一标题', level: 2 })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: '操作按钮' })).toBeInTheDocument()
    expect(screen.getByText('卡片正文')).toBeInTheDocument()
  })

  it('should render pill as text or link based on props', () => {
    const { rerender } = render(<DisplayPill>只读标签</DisplayPill>)

    expect(screen.getByText('只读标签').tagName).toBe('SPAN')

    rerender(
      <DisplayPill external href="https://example.com">
        外部链接
      </DisplayPill>,
    )

    const link = screen.getByRole('link', { name: '外部链接' })

    expect(link).toHaveAttribute('href', 'https://example.com')
    expect(link).toHaveAttribute('target', '_blank')
    expect(link).toHaveAttribute('rel', 'noreferrer')
  })
})
