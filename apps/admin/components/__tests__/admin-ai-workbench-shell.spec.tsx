'use client';

import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { ReactNode } from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const { useAdminSessionMock, fetchAiWorkbenchRuntimeMock, fetchDraftResumeMock } =
  vi.hoisted(() => ({
    useAdminSessionMock: vi.fn(),
    fetchAiWorkbenchRuntimeMock: vi.fn(),
    fetchDraftResumeMock: vi.fn(),
  }));

vi.mock('../../lib/admin-session', () => ({
  useAdminSession: useAdminSessionMock,
}));

vi.mock('../../lib/ai-workbench-api', () => ({
  fetchAiWorkbenchRuntime: fetchAiWorkbenchRuntimeMock,
}));

vi.mock('../../lib/resume-draft-api', () => ({
  fetchDraftResume: fetchDraftResumeMock,
}));

vi.mock('../ai-file-extraction-panel', () => ({
  AiFileExtractionPanel: ({
    canUpload,
    onExtractedText,
  }: {
    canUpload: boolean;
    onExtractedText?: (result: {
      fileName: string;
      fileType: 'txt';
      mimeType: string;
      text: string;
      charCount: number;
    }) => void;
  }) =>
    canUpload ? (
      <div>
        <span>文件提取面板占位</span>
        <button
          onClick={() =>
            onExtractedText?.({
              fileName: 'resume.txt',
              fileType: 'txt',
              mimeType: 'text/plain',
              text: 'resume text content',
              charCount: 19,
            })
          }
          type="button"
        >
          模拟提取完成
        </button>
      </div>
    ) : (
      <div>文件提取只读占位</div>
    ),
}));

vi.mock('../ai-analysis-panel', () => ({
  AiAnalysisPanel: ({
    canAnalyze,
    content,
    inputAccessory,
    onDraftApplied,
  }: {
    canAnalyze: boolean;
    content: string;
    inputAccessory?: ReactNode;
    onDraftApplied?: (snapshot: {
      status: 'draft';
      updatedAt: string;
      resume: {
        profile: {
          headline: {
            zh: string;
            en: string;
          };
          summary: {
            zh: string;
            en: string;
          };
        };
      };
    }) => void;
  }) => (
    <div>
      {inputAccessory}
      <span>{canAnalyze ? '真实分析面板占位' : '真实分析只读占位'}</span>
      <span>{`当前分析内容：${content || '空'}`}</span>
      {canAnalyze ? (
        <button
          onClick={() =>
            onDraftApplied?.({
              status: 'draft',
              updatedAt: '2026-03-31T10:00:00.000Z',
              resume: {
                profile: {
                  headline: {
                    zh: 'AI 优化后标题',
                    en: 'AI Optimized Headline',
                  },
                  summary: {
                    zh: 'AI 优化后的中文摘要',
                    en: 'AI optimized English summary',
                  },
                },
              },
            })
          }
          type="button"
        >
          模拟应用草稿
        </button>
      ) : null}
    </div>
  ),
}));

vi.mock('../ai-cached-reports-panel', () => ({
  AiCachedReportsPanel: ({
    isViewerExperience,
  }: {
    isViewerExperience: boolean;
  }) => (
    <div>
      {isViewerExperience ? 'viewer 缓存结果面板占位' : 'admin 缓存结果面板占位'}
    </div>
  ),
}));

import { AdminAiWorkbenchShell } from '../admin-ai-workbench-shell';

const runtimeSummary = {
  provider: 'qiniu',
  model: 'deepseek-v3',
  mode: 'live',
  supportedScenarios: ['jd-match', 'resume-review', 'offer-compare'] as const,
};

const draftSnapshot = {
  status: 'draft' as const,
  updatedAt: '2026-03-31T09:00:00.000Z',
  resume: {
    profile: {
      headline: {
        zh: '当前草稿标题',
        en: 'Current Draft Headline',
      },
      summary: {
        zh: '当前草稿摘要',
        en: 'Current draft summary',
      },
    },
  },
};

const adminUser = {
  id: 'admin-demo-user',
  username: 'admin',
  role: 'admin' as const,
  isActive: true,
  capabilities: {
    canEditResume: true,
    canPublishResume: true,
    canTriggerAiAnalysis: true,
  },
};

const viewerUser = {
  id: 'viewer-demo-user',
  username: 'viewer',
  role: 'viewer' as const,
  isActive: true,
  capabilities: {
    canEditResume: false,
    canPublishResume: false,
    canTriggerAiAnalysis: false,
  },
};

describe('AdminAiWorkbenchShell', () => {
  beforeEach(() => {
    useAdminSessionMock.mockReset();
    fetchAiWorkbenchRuntimeMock.mockReset();
    fetchDraftResumeMock.mockReset();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('should render runtime summary and scenario cards for admin', async () => {
    const user = userEvent.setup();
    useAdminSessionMock.mockReturnValue({
      accessToken: 'admin-token',
      currentUser: adminUser,
      logout: vi.fn(),
      refreshSession: vi.fn(),
      status: 'ready',
    });
    fetchAiWorkbenchRuntimeMock.mockResolvedValue(runtimeSummary);
    fetchDraftResumeMock.mockResolvedValue(draftSnapshot);

    render(<AdminAiWorkbenchShell />);

    expect(await screen.findByRole('heading', { name: 'AI 工作台' })).toBeInTheDocument();
    expect(screen.getByText('当前 Provider：qiniu')).toBeInTheDocument();
    expect(screen.getByText('当前模型：deepseek-v3')).toBeInTheDocument();
    expect(screen.getByText('运行模式：live')).toBeInTheDocument();
    expect(screen.getByText('JD 匹配分析')).toBeInTheDocument();
    expect(screen.getByText('简历优化建议')).toBeInTheDocument();
    expect(screen.getByText('Offer 对比建议')).toBeInTheDocument();
    expect(
      screen.getByText('当前账号可继续接入上传、真实分析和结果阅读。'),
    ).toBeInTheDocument();
    expect(screen.getByText('文件提取面板占位')).toBeInTheDocument();
    expect(screen.getByText('真实分析面板占位')).toBeInTheDocument();
    expect(screen.getByText('admin 缓存结果面板占位')).toBeInTheDocument();
    expect(screen.getByText('当前分析内容：空')).toBeInTheDocument();
    expect(await screen.findByText('当前草稿快照')).toBeInTheDocument();
    expect(screen.getByText('当前草稿标题')).toBeInTheDocument();
    expect(screen.getByText('当前草稿摘要')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: '模拟提取完成' }));

    expect(screen.getByText('当前分析内容：resume text content')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: '模拟应用草稿' }));

    expect(await screen.findByText('AI 优化后标题')).toBeInTheDocument();
    expect(screen.getByText('AI 优化后的中文摘要')).toBeInTheDocument();
  });

  it('should render viewer-specific read-only guidance', async () => {
    useAdminSessionMock.mockReturnValue({
      accessToken: 'viewer-token',
      currentUser: viewerUser,
      logout: vi.fn(),
      refreshSession: vi.fn(),
      status: 'ready',
    });
    fetchAiWorkbenchRuntimeMock.mockResolvedValue(runtimeSummary);

    render(<AdminAiWorkbenchShell />);

    expect(await screen.findByText('当前账号：viewer')).toBeInTheDocument();
    expect(
      screen.getByText('viewer 当前只允许查看缓存结果与预设体验，不能上传文件或触发真实分析。'),
    ).toBeInTheDocument();
    expect(screen.getByText('viewer 缓存结果面板占位')).toBeInTheDocument();
    expect(screen.getByText('文件提取只读占位')).toBeInTheDocument();
    expect(screen.getByText('真实分析只读占位')).toBeInTheDocument();
    expect(fetchDraftResumeMock).not.toHaveBeenCalled();
  });
});
