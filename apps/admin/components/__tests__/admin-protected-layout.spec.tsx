'use client';

import { cleanup, render, screen } from '@testing-library/react';
import type { ReactNode } from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';

const { useAdminSessionMock } = vi.hoisted(() => ({
  useAdminSessionMock: vi.fn(),
}));

vi.mock('@heroui/react', async () => {
  const actual = await vi.importActual<typeof import('@heroui/react')>('@heroui/react');

  return {
    ...actual,
    Drawer: ({ children }: { children: ReactNode }) => <div>{children}</div>,
    DrawerBackdrop: () => null,
    DrawerBody: ({ children }: { children: ReactNode }) => <div>{children}</div>,
    DrawerContent: ({ children }: { children: ReactNode }) => <div>{children}</div>,
    DrawerDialog: ({ children }: { children: ReactNode }) => <div>{children}</div>,
    DrawerHeader: ({ children }: { children: ReactNode }) => <div>{children}</div>,
    DrawerHeading: ({ children }: { children: ReactNode }) => <div>{children}</div>,
    useOverlayState: () => ({
      open: vi.fn(),
      close: vi.fn(),
      toggle: vi.fn(),
      setOpen: vi.fn(),
      isOpen: false,
    }),
  };
});

vi.mock('next/navigation', () => ({
  usePathname: () => '/dashboard',
  useRouter: () => ({
    push: vi.fn(),
    replace: vi.fn(),
  }),
}));

vi.mock('../../lib/admin-session', () => ({
  useAdminSession: useAdminSessionMock,
}));

vi.mock('../theme-mode-toggle', () => ({
  ThemeModeToggle: () => <div>主题切换占位</div>,
}));

import { AdminProtectedLayout } from '../admin-protected-layout';

describe('AdminProtectedLayout', () => {
  afterEach(() => {
    cleanup();
    useAdminSessionMock.mockReset();
  });

  it('should show unauthorized guidance when session is missing', () => {
    useAdminSessionMock.mockReturnValue({
      accessToken: null,
      currentUser: null,
      logout: vi.fn(),
      refreshSession: vi.fn(),
      status: 'unauthorized',
    });

    render(
      <AdminProtectedLayout>
        <div>受保护内容</div>
      </AdminProtectedLayout>,
    );

    expect(screen.getByRole('heading', { name: '请先登录后台' })).toBeInTheDocument();
    expect(
      screen.getByText('当前后台继续保持前端壳鉴权模式'),
    ).toBeInTheDocument();
  });

  it('should render navigation shell for logged-in users', () => {
    useAdminSessionMock.mockReturnValue({
      accessToken: 'admin-token',
      currentUser: {
        id: 'admin-demo-user',
        username: 'admin',
        role: 'admin',
        isActive: true,
        capabilities: {
          canEditResume: true,
          canPublishResume: true,
          canTriggerAiAnalysis: true,
        },
      },
      logout: vi.fn(),
      refreshSession: vi.fn(),
      status: 'ready',
    });

    render(
      <AdminProtectedLayout>
        <div>受保护内容</div>
      </AdminProtectedLayout>,
    );

    expect(screen.getByText('resume admin')).toBeInTheDocument();
    expect(screen.getByText('受保护内容')).toBeInTheDocument();
    expect(screen.getByText('账号：admin')).toBeInTheDocument();
    expect(screen.getAllByText('概览').length).toBeGreaterThan(0);
    expect(screen.getAllByText('简历编辑').length).toBeGreaterThan(0);
    expect(screen.getAllByText('AI 工作台').length).toBeGreaterThan(0);
    expect(screen.getAllByText('发布与导出').length).toBeGreaterThan(0);
  });
});
