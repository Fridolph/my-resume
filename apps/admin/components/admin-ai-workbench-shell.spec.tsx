'use client';

import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const {
  fetchCurrentUserMock,
  fetchAiWorkbenchRuntimeMock,
  readAccessTokenMock,
  clearAccessTokenMock,
} = vi.hoisted(() => ({
  fetchCurrentUserMock: vi.fn(),
  fetchAiWorkbenchRuntimeMock: vi.fn(),
  readAccessTokenMock: vi.fn(),
  clearAccessTokenMock: vi.fn(),
}));

vi.mock('../lib/auth-api', () => ({
  fetchCurrentUser: fetchCurrentUserMock,
}));

vi.mock('../lib/ai-workbench-api', () => ({
  fetchAiWorkbenchRuntime: fetchAiWorkbenchRuntimeMock,
}));

vi.mock('../lib/session-storage', () => ({
  clearAccessToken: clearAccessTokenMock,
  readAccessToken: readAccessTokenMock,
}));

vi.mock('./theme-mode-toggle', () => ({
  ThemeModeToggle: () => <div>主题切换占位</div>,
}));

vi.mock('./ai-file-extraction-panel', () => ({
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

vi.mock('./ai-analysis-panel', () => ({
  AiAnalysisPanel: ({
    canAnalyze,
    content,
  }: {
    canAnalyze: boolean;
    content: string;
  }) => (
    <div>
      <span>{canAnalyze ? '真实分析面板占位' : '真实分析只读占位'}</span>
      <span>{`当前分析内容：${content || '空'}`}</span>
    </div>
  ),
}));

import { AdminAiWorkbenchShell } from './admin-ai-workbench-shell';

const runtimeSummary = {
  provider: 'qiniu',
  model: 'deepseek-v3',
  mode: 'live',
  supportedScenarios: ['jd-match', 'resume-review', 'offer-compare'] as const,
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
    fetchCurrentUserMock.mockReset();
    fetchAiWorkbenchRuntimeMock.mockReset();
    readAccessTokenMock.mockReset();
    clearAccessTokenMock.mockReset();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('should show unauthorized state when access token is missing', () => {
    readAccessTokenMock.mockReturnValue(null);

    render(<AdminAiWorkbenchShell />);

    expect(screen.getByRole('heading', { name: '请先登录后台' })).toBeInTheDocument();
    expect(
      screen.getByText('AI 工作台属于受保护页面，需要先获取 JWT。'),
    ).toBeInTheDocument();
  });

  it('should render runtime summary and scenario cards for admin', async () => {
    const user = userEvent.setup();
    readAccessTokenMock.mockReturnValue('admin-token');
    fetchCurrentUserMock.mockResolvedValue(adminUser);
    fetchAiWorkbenchRuntimeMock.mockResolvedValue(runtimeSummary);

    render(<AdminAiWorkbenchShell />);

    expect(await screen.findByRole('heading', { name: 'AI 工作台' })).toBeInTheDocument();
    expect(screen.getByText('当前 Provider：qiniu')).toBeInTheDocument();
    expect(screen.getByText('当前模型：deepseek-v3')).toBeInTheDocument();
    expect(screen.getByText('运行模式：live')).toBeInTheDocument();
    expect(screen.getByText('主题切换占位')).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'JD 匹配分析' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: '简历优化建议' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Offer 对比建议' })).toBeInTheDocument();
    expect(
      screen.getByText('当前账号可继续接入上传、真实分析和结果阅读。'),
    ).toBeInTheDocument();
    expect(screen.getByText('文件提取面板占位')).toBeInTheDocument();
    expect(screen.getByText('真实分析面板占位')).toBeInTheDocument();
    expect(screen.getByText('当前分析内容：空')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: '模拟提取完成' }));

    expect(screen.getByText('当前分析内容：resume text content')).toBeInTheDocument();
  });

  it('should render viewer-specific guidance for read-only AI experience', async () => {
    readAccessTokenMock.mockReturnValue('viewer-token');
    fetchCurrentUserMock.mockResolvedValue(viewerUser);
    fetchAiWorkbenchRuntimeMock.mockResolvedValue(runtimeSummary);

    render(<AdminAiWorkbenchShell />);

    expect(await screen.findByText('当前账号：viewer')).toBeInTheDocument();
    expect(
      screen.getByText('viewer 当前只允许查看缓存结果与预设体验，不能上传文件或触发真实分析。'),
    ).toBeInTheDocument();
    expect(screen.getByText('文件提取只读占位')).toBeInTheDocument();
    expect(screen.getByText('真实分析只读占位')).toBeInTheDocument();
  });
});
