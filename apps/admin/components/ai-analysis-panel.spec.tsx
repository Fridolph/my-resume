'use client';

import { cleanup, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useState } from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { AiAnalysisPanel } from './ai-analysis-panel';
import type { StandardResume } from '../lib/resume-types';

afterEach(() => {
  cleanup();
});

function createTestResume(): StandardResume {
  return {
    meta: {
      slug: 'standard-resume',
      version: 1,
      defaultLocale: 'zh',
      locales: ['zh', 'en'],
    },
    profile: {
      fullName: {
        zh: '付寅生',
        en: 'Yinsheng Fu',
      },
      headline: {
        zh: '前端工程师',
        en: 'Frontend Engineer',
      },
      summary: {
        zh: '原始中文摘要',
        en: 'Original English summary',
      },
      location: {
        zh: '成都',
        en: 'Chengdu',
      },
      email: 'demo@example.com',
      phone: '123456789',
      website: 'https://example.com',
      links: [],
      interests: [],
    },
    education: [],
    experiences: [],
    projects: [],
    skills: [],
    highlights: [],
  };
}

const runtimeSummary = {
  provider: 'qiniu',
  model: 'deepseek-v3',
  mode: 'live',
  supportedScenarios: ['jd-match', 'resume-review', 'offer-compare'] as const,
};

function ControlledAnalysisPanel(props: {
  canAnalyze: boolean;
  generateResumeOptimization?: typeof import('../lib/ai-workbench-api').generateAiResumeOptimization;
  helperMessage?: string | null;
  saveDraft?: typeof import('../lib/resume-draft-api').updateDraftResume;
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
      generateResumeOptimization={props.generateResumeOptimization}
      saveDraft={props.saveDraft}
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
        score: {
          value: 76,
          label: '基础匹配良好',
          reason: '已有核心技术关键词，但成果与职责边界仍需补强。',
        },
        strengths: ['已覆盖 NestJS、React、TypeScript 等岗位基础关键词。'],
        gaps: ['缺少体现业务结果的量化成果。'],
        risks: ['如果没有主导范围说明，容易被理解为参与而非负责。'],
        suggestions: [
          {
            key: 'experience-impact',
            title: '补强经历成果描述',
            module: 'experiences',
            reason: '工作经历是最能证明能力与影响范围的模块。',
            actions: ['补一条量化结果', '补一条主导职责描述'],
          },
        ],
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
    expect(screen.getByText('评分：76 / 100')).toBeInTheDocument();
    expect(screen.getByText('基础匹配良好')).toBeInTheDocument();
    expect(
      screen.getByText('已有核心技术关键词，但成果与职责边界仍需补强。'),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('heading', { name: '已有优势', level: 3 }),
    ).toBeInTheDocument();
    expect(
      screen.getByText('已覆盖 NestJS、React、TypeScript 等岗位基础关键词。'),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('heading', { name: '建议动作', level: 3 }),
    ).toBeInTheDocument();
    expect(screen.getByText('建议模块：experiences')).toBeInTheDocument();
    expect(screen.getByText('补一条量化结果')).toBeInTheDocument();
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

  it('should generate a structured suggestion and apply it to the draft', async () => {
    const user = userEvent.setup();
    const generateResumeOptimization = vi.fn().mockResolvedValue({
      summary: '已生成结构化建议稿',
      focusAreas: ['强化摘要', '补强项目亮点'],
      changedModules: ['profile', 'projects'],
      suggestedResume: {
        ...createTestResume(),
        profile: {
          ...createTestResume().profile,
          summary: {
            zh: '新的中文摘要',
            en: 'New English summary',
          },
        },
      },
      providerSummary: {
        provider: 'qiniu',
        model: 'deepseek-v3',
        mode: 'openai-compatible',
      },
    });
    const saveDraft = vi.fn().mockResolvedValue({
      status: 'draft',
      resume: createTestResume(),
      updatedAt: '2026-03-30T00:00:00.000Z',
    });

    render(
      <ControlledAnalysisPanel
        canAnalyze
        generateResumeOptimization={generateResumeOptimization}
        initialContent="请根据 React 和 Next.js 岗位优化当前简历"
        saveDraft={saveDraft}
      />,
    );

    await user.selectOptions(screen.getByLabelText('分析场景'), 'resume-review');
    await user.click(screen.getByRole('button', { name: '生成结构化简历建议' }));

    await waitFor(() => {
      expect(generateResumeOptimization).toHaveBeenCalledWith({
        apiBaseUrl: 'http://localhost:5577',
        accessToken: 'demo-token',
        instruction: '请根据 React 和 Next.js 岗位优化当前简历',
        locale: 'zh',
      });
    });

    expect(await screen.findByText('已生成结构化建议稿')).toBeInTheDocument();
    expect(screen.getByText('模块：profile')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: '一键应用到当前草稿' }));

    await waitFor(() => {
      expect(saveDraft).toHaveBeenCalledWith({
        apiBaseUrl: 'http://localhost:5577',
        accessToken: 'demo-token',
        resume: expect.objectContaining({
          profile: expect.objectContaining({
            summary: {
              zh: '新的中文摘要',
              en: 'New English summary',
            },
          }),
        }),
      });
    });

    expect(
      await screen.findByText(
        'AI 建议稿已应用到当前草稿。公开站内容不会自动变化，仍需手动发布。',
      ),
    ).toBeInTheDocument();
  });

  it('should restrict structured suggestion to resume-review scenario', async () => {
    const user = userEvent.setup();
    const generateResumeOptimization = vi.fn();

    render(
      <ControlledAnalysisPanel
        canAnalyze
        generateResumeOptimization={generateResumeOptimization}
        initialContent="请根据 offer 内容给出建议"
      />,
    );

    await user.selectOptions(screen.getByLabelText('分析场景'), 'offer-compare');
    await user.click(screen.getByRole('button', { name: '生成结构化简历建议' }));

    expect(
      await screen.findByText('结构化简历建议当前只支持“简历优化建议”场景。'),
    ).toBeInTheDocument();
    expect(generateResumeOptimization).not.toHaveBeenCalled();
  });
});
