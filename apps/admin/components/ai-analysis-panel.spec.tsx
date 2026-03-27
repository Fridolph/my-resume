'use client';

import { cleanup, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useState } from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { AiAnalysisPanel } from './ai-analysis-panel';

afterEach(() => {
  cleanup();
});

const runtimeSummary = {
  provider: 'qiniu',
  model: 'deepseek-v3',
  mode: 'live',
  supportedScenarios: ['jd-match', 'resume-review', 'offer-compare'] as const,
};

function ControlledAnalysisPanel(props: {
  canAnalyze: boolean;
  helperMessage?: string | null;
  triggerAnalysis?: typeof import('../lib/ai-workbench-api').triggerAiWorkbenchAnalysis;
  initialContent?: string;
}) {
  const [content, setContent] = useState(props.initialContent ?? '');

  return (
    <AiAnalysisPanel
      accessToken="demo-token"
      apiBaseUrl="http://localhost:5577"
      canAnalyze={props.canAnalyze}
      content={content}
      helperMessage={props.helperMessage}
      onContentChange={setContent}
      runtimeSummary={runtimeSummary}
      triggerAnalysis={props.triggerAnalysis}
    />
  );
}

describe('AiAnalysisPanel', () => {
  it('should show read-only message when current role cannot trigger analysis', () => {
    render(<ControlledAnalysisPanel canAnalyze={false} />);

    expect(screen.getByText('当前角色只读')).toBeInTheDocument();
    expect(
      screen.getByText(
        'viewer 当前只保留缓存报告体验，真实分析触发入口会在管理员链路中继续开放。',
      ),
    ).toBeInTheDocument();
  });

  it('should trigger live analysis and render returned report sections', async () => {
    const user = userEvent.setup();
    const triggerAnalysis = vi.fn().mockResolvedValue({
      cached: false,
      report: {
        reportId: 'resume-review-demo',
        cacheKey: 'resume-review:zh:demo',
        scenario: 'resume-review',
        locale: 'zh',
        sourceHash: 'demo',
        inputPreview: 'NestJS React TypeScript',
        summary: '建议继续补充量化结果与职责边界。',
        sections: [
          {
            key: 'analysis-result',
            title: '分析结果',
            bullets: ['补充量化成果。', '突出主导模块。'],
          },
          {
            key: 'provider',
            title: 'Provider 信息',
            bullets: ['qiniu / deepseek-v3'],
          },
        ],
        generator: 'ai-provider',
        createdAt: '2026-03-27T00:00:00.000Z',
      },
    });

    render(
      <ControlledAnalysisPanel
        canAnalyze
        helperMessage="已将 resume.pdf 的提取结果同步到分析输入区。"
        initialContent="NestJS React TypeScript"
        triggerAnalysis={triggerAnalysis}
      />,
    );

    expect(
      screen.getByText('已将 resume.pdf 的提取结果同步到分析输入区。'),
    ).toBeInTheDocument();

    await user.selectOptions(screen.getByLabelText('分析场景'), 'resume-review');
    await user.selectOptions(screen.getByLabelText('输出语言'), 'zh');
    await user.click(screen.getByRole('button', { name: '开始真实分析' }));

    await waitFor(() => {
      expect(triggerAnalysis).toHaveBeenCalledWith({
        accessToken: 'demo-token',
        apiBaseUrl: 'http://localhost:5577',
        scenario: 'resume-review',
        locale: 'zh',
        content: 'NestJS React TypeScript',
      });
    });

    expect(
      await screen.findByText('建议继续补充量化结果与职责边界。'),
    ).toBeInTheDocument();
    expect(screen.getByText('场景：简历优化建议')).toBeInTheDocument();
    expect(screen.getByText('Provider：qiniu / deepseek-v3')).toBeInTheDocument();
    expect(
      screen.getByRole('heading', { name: '分析结果', level: 3 }),
    ).toBeInTheDocument();
    expect(screen.getByText('补充量化成果。')).toBeInTheDocument();
  });

  it('should show error feedback when live analysis fails', async () => {
    const user = userEvent.setup();
    const triggerAnalysis = vi
      .fn()
      .mockRejectedValue(new Error('Provider request failed'));

    render(
      <ControlledAnalysisPanel
        canAnalyze
        initialContent="NestJS React TypeScript"
        triggerAnalysis={triggerAnalysis}
      />,
    );

    await user.click(screen.getByRole('button', { name: '开始真实分析' }));

    expect(await screen.findByText('Provider request failed')).toBeInTheDocument();
  });

  it('should guard against empty input before triggering analysis', async () => {
    const user = userEvent.setup();
    const triggerAnalysis = vi.fn();

    render(
      <ControlledAnalysisPanel canAnalyze triggerAnalysis={triggerAnalysis} />,
    );

    await user.click(screen.getByRole('button', { name: '开始真实分析' }));

    expect(
      await screen.findByText('请先输入分析内容，或先通过文件提取生成输入文本。'),
    ).toBeInTheDocument();
    expect(triggerAnalysis).not.toHaveBeenCalled();
  });
});
