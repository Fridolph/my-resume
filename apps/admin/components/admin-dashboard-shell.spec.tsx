'use client';

import { render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const {
  fetchCurrentUserMock,
  readAccessTokenMock,
  clearAccessTokenMock,
} = vi.hoisted(() => ({
  fetchCurrentUserMock: vi.fn(),
  readAccessTokenMock: vi.fn(),
  clearAccessTokenMock: vi.fn(),
}));

vi.mock('../lib/auth-api', () => ({
  fetchCurrentUser: fetchCurrentUserMock,
  postProtectedAction: vi.fn(),
  publishResume: vi.fn(),
}));

vi.mock('../lib/session-storage', () => ({
  clearAccessToken: clearAccessTokenMock,
  readAccessToken: readAccessTokenMock,
}));

vi.mock('./resume-draft-editor-panel', () => ({
  ResumeDraftEditorPanel: () => <div>草稿编辑面板占位</div>,
}));

vi.mock('./role-action-panel', () => ({
  RoleActionPanel: () => (
    <section>
      <h2>动作中心</h2>
      <div>动作面板占位</div>
    </section>
  ),
}));

vi.mock('./export-entry-panel', () => ({
  ExportEntryPanel: () => <div>导出入口占位</div>,
}));

vi.mock('./theme-mode-toggle', () => ({
  ThemeModeToggle: () => <div>主题切换占位</div>,
}));

import { AdminDashboardShell } from './admin-dashboard-shell';

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

describe('AdminDashboardShell', () => {
  beforeEach(() => {
    fetchCurrentUserMock.mockReset();
    readAccessTokenMock.mockReset();
    clearAccessTokenMock.mockReset();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('should show unauthorized state when access token is missing', () => {
    readAccessTokenMock.mockReturnValue(null);

    render(<AdminDashboardShell />);

    expect(screen.getByRole('heading', { name: '请先登录后台' })).toBeInTheDocument();
    expect(screen.getByText('当前页面是最小受保护壳，需要先获取 JWT。')).toBeInTheDocument();
  });

  it('should render dashboard information architecture for admin', async () => {
    readAccessTokenMock.mockReturnValue('admin-token');
    fetchCurrentUserMock.mockResolvedValue(adminUser);

    render(<AdminDashboardShell />);

    expect(await screen.findByRole('heading', { name: '后台控制台' })).toBeInTheDocument();
    expect(screen.getByText('工作区概览')).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: '内容工作区' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: '会话与边界' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: '流程提示' })).toBeInTheDocument();
    expect(screen.getByText('草稿编辑面板占位')).toBeInTheDocument();
    expect(screen.getByText('动作面板占位')).toBeInTheDocument();
    expect(screen.getByText('导出入口占位')).toBeInTheDocument();
    expect(screen.getByText('当前账号：admin')).toBeInTheDocument();
    expect(screen.getByText('当前角色：admin')).toBeInTheDocument();
  });

  it('should render viewer-specific guidance in the overview section', async () => {
    readAccessTokenMock.mockReturnValue('viewer-token');
    fetchCurrentUserMock.mockResolvedValue(viewerUser);

    render(<AdminDashboardShell />);

    expect(await screen.findByText('当前账号：viewer')).toBeInTheDocument();
    expect(screen.getByText('当前角色：viewer')).toBeInTheDocument();
    expect(
      screen.getByText('viewer 当前只能体验缓存结果与只读链路，不能触发真实敏感操作。'),
    ).toBeInTheDocument();
  });
});
