'use client'

import { cleanup, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import type { ReactNode } from 'react'
import { afterEach, describe, expect, it, vi } from 'vitest'

const { useAdminSessionMock } = vi.hoisted(() => ({
  useAdminSessionMock: vi.fn(),
}))

const { pathnameState } = vi.hoisted(() => ({
  pathnameState: {
    value: '/dashboard',
  },
}))

const { DrawerMock, DropdownMock, TooltipMock, passthroughDiv } = vi.hoisted(() => {
  const localPassthroughDiv = ({
    children,
    ...props
  }: { children?: ReactNode } & Record<string, unknown>) => (
    <div {...props}>{children}</div>
  )

  return {
    passthroughDiv: localPassthroughDiv,
    DropdownMock: Object.assign(
      ({ children }: { children: ReactNode }) => <div>{children}</div>,
      {
        Trigger: ({
          children,
          ...props
        }: { children: ReactNode } & Record<string, unknown>) => (
          <div {...props}>{children}</div>
        ),
        Popover: ({ children }: { children: ReactNode }) => <div>{children}</div>,
        Menu: ({ children }: { children: ReactNode }) => <div>{children}</div>,
        Item: ({ children }: { children: ReactNode }) => <div>{children}</div>,
      },
    ),
    TooltipMock: Object.assign(
      ({ children }: { children: ReactNode }) => <div>{children}</div>,
      {
        Trigger: ({ children }: { children: ReactNode }) => <div>{children}</div>,
        Content: ({ children }: { children: ReactNode }) => <div>{children}</div>,
      },
    ),
    DrawerMock: ({
      children,
      isOpen,
      onOpenChange: _onOpenChange,
      ...props
    }: {
      children: ReactNode
      isOpen?: boolean
      onOpenChange?: (open: boolean) => void
    } & Record<string, unknown>) => (
      <div data-open={String(Boolean(isOpen))} {...props}>
        {children}
      </div>
    ),
  }
})

vi.mock('@heroui/react/avatar', () => ({
  Avatar: {
    Root: ({ children }: { children: ReactNode }) => <div>{children}</div>,
    Fallback: ({ children }: { children: ReactNode }) => <div>{children}</div>,
  },
}))

vi.mock('@heroui/react/dropdown', () => ({
  Dropdown: DropdownMock,
}))

vi.mock('@heroui/react/drawer', () => ({
  Drawer: DrawerMock,
  DrawerBackdrop: () => null,
  DrawerBody: passthroughDiv,
  DrawerCloseTrigger: passthroughDiv,
  DrawerContent: passthroughDiv,
  DrawerDialog: passthroughDiv,
  DrawerHeader: passthroughDiv,
  DrawerHeading: passthroughDiv,
}))

vi.mock('@heroui/react/tooltip', () => ({
  Tooltip: TooltipMock,
}))

vi.mock('next/navigation', () => ({
  usePathname: () => pathnameState.value,
  useRouter: () => ({
    push: vi.fn(),
    replace: vi.fn(),
  }),
}))

vi.mock('../../../lib/admin-session', () => ({
  useAdminSession: useAdminSessionMock,
}))

vi.mock('../../shared/theme-mode-toggle', () => ({
  ThemeModeToggle: () => <div>主题切换占位</div>,
}))

import { AdminProtectedLayout } from '../protected-layout'

describe('AdminProtectedLayout', () => {
  afterEach(() => {
    cleanup()
    useAdminSessionMock.mockReset()
    pathnameState.value = '/dashboard'
  })

  it('should show unauthorized guidance when session is missing', () => {
    useAdminSessionMock.mockReturnValue({
      accessToken: null,
      currentUser: null,
      logout: vi.fn(),
      refreshSession: vi.fn(),
      status: 'unauthorized',
    })

    render(
      <AdminProtectedLayout>
        <div>受保护内容</div>
      </AdminProtectedLayout>,
    )

    expect(screen.getByRole('heading', { name: '请先登录后台' })).toBeInTheDocument()
    expect(screen.getByText('当前后台继续保持前端壳鉴权模式')).toBeInTheDocument()
  })

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
    })

    render(
      <AdminProtectedLayout>
        <div>受保护内容</div>
      </AdminProtectedLayout>,
    )

    expect(screen.getByText('resume admin')).toBeInTheDocument()
    expect(screen.getByText('受保护内容')).toBeInTheDocument()
    expect(screen.getAllByText('概览').length).toBeGreaterThan(0)
    expect(screen.getAllByText('简历编辑').length).toBeGreaterThan(0)
    expect(screen.getAllByText('AI 工作台').length).toBeGreaterThan(0)
    expect(screen.getAllByText('发布与导出').length).toBeGreaterThan(0)
    expect(screen.queryByText('当前会话')).not.toBeInTheDocument()
    expect(screen.getByLabelText('打开项目 GitHub 仓库')).toBeInTheDocument()
    expect(screen.getByLabelText('打开当前会话菜单')).toBeInTheDocument()
    expect(screen.getByText('账号')).toBeInTheDocument()
    expect(screen.getByText('角色')).toBeInTheDocument()
    expect(screen.getByText('退出登录')).toBeInTheDocument()
    expect(screen.getByTestId('admin-mobile-header')).toHaveClass('px-3', 'py-2.5')
    expect(screen.getByTestId('admin-mobile-header-secondary')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: '菜单' })).toHaveClass('h-9')
    expect(screen.getByLabelText('关闭导航菜单')).toBeInTheDocument()
    expect(screen.getByTestId('admin-mobile-drawer-content')).toHaveClass('z-50')
    expect(screen.getByTestId('admin-mobile-drawer-dialog')).toHaveClass(
      'border-r',
      'bg-white/95',
      'shadow-2xl',
    )
  })

  it('should close mobile drawer when pathname changes', () => {
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
    })

    const { rerender } = render(
      <AdminProtectedLayout>
        <div>受保护内容</div>
      </AdminProtectedLayout>,
    )

    expect(screen.getByTestId('admin-mobile-drawer-root')).toHaveAttribute(
      'data-open',
      'false',
    )

    pathnameState.value = '/dashboard/ai'

    rerender(
      <AdminProtectedLayout>
        <div>受保护内容</div>
      </AdminProtectedLayout>,
    )

    expect(screen.getByTestId('admin-mobile-drawer-root')).toHaveAttribute(
      'data-open',
      'false',
    )
  })

  it('should open drawer from menu button and reopen after route change', async () => {
    const user = userEvent.setup()

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
    })

    const { rerender } = render(
      <AdminProtectedLayout>
        <div>受保护内容</div>
      </AdminProtectedLayout>,
    )

    const drawerRoot = screen.getByTestId('admin-mobile-drawer-root')
    const menuButton = screen.getByRole('button', { name: '菜单' })

    expect(drawerRoot).toHaveAttribute('data-open', 'false')

    await user.click(menuButton)
    expect(drawerRoot).toHaveAttribute('data-open', 'true')

    pathnameState.value = '/dashboard/ai'

    rerender(
      <AdminProtectedLayout>
        <div>受保护内容</div>
      </AdminProtectedLayout>,
    )

    expect(screen.getByTestId('admin-mobile-drawer-root')).toHaveAttribute(
      'data-open',
      'false',
    )

    await user.click(screen.getByRole('button', { name: '菜单' }))
    expect(screen.getByTestId('admin-mobile-drawer-root')).toHaveAttribute(
      'data-open',
      'true',
    )
  })
})
