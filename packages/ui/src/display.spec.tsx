import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import {
  DisplayPill,
  DisplaySectionIntro,
  DisplayStatCard,
  DisplaySurfaceCard,
} from './display';

describe('display primitives', () => {
  it('should render surface card with semantic element override', () => {
    render(
      <DisplaySurfaceCard as="article">
        <p>共享容器内容</p>
      </DisplaySurfaceCard>,
    );

    const card = screen.getByRole('article');

    expect(card).toHaveClass('display-surface-card');
    expect(screen.getByText('共享容器内容')).toBeInTheDocument();
  });

  it('should render section intro with eyebrow, title and description', () => {
    render(
      <DisplaySectionIntro
        compact
        description="帮助两端共享标题块结构。"
        eyebrow="共享展示"
        title="Section Intro"
      />,
    );

    expect(screen.getByText('共享展示')).toBeInTheDocument();
    expect(
      screen.getByRole('heading', { name: 'Section Intro', level: 2 }),
    ).toBeInTheDocument();
    expect(screen.getByText('帮助两端共享标题块结构。')).toBeInTheDocument();
  });

  it('should render stat card with label, value and description', () => {
    render(
      <DisplayStatCard
        description="当前统计项说明"
        label="当前状态"
        value="READY"
      />,
    );

    expect(screen.getByText('当前状态')).toBeInTheDocument();
    expect(screen.getByText('READY')).toBeInTheDocument();
    expect(screen.getByText('当前统计项说明')).toBeInTheDocument();
  });

  it('should render pill as text or link based on props', () => {
    const { rerender } = render(<DisplayPill>只读标签</DisplayPill>);

    expect(screen.getByText('只读标签').tagName).toBe('SPAN');

    rerender(
      <DisplayPill external href="https://example.com">
        外部链接
      </DisplayPill>,
    );

    const link = screen.getByRole('link', { name: '外部链接' });

    expect(link).toHaveAttribute('href', 'https://example.com');
    expect(link).toHaveAttribute('target', '_blank');
    expect(link).toHaveAttribute('rel', 'noreferrer');
  });
});
