'use client'

import { cleanup, render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { StrictMode } from 'react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { Providers } from '../../../app/providers'
import { resetAdminResourceStore } from '../../../core/admin-resource-store'

const { fetchCurrentUserMock, loginWithPasswordMock, pushMock, replaceMock } = vi.hoisted(
  () => ({
    fetchCurrentUserMock: vi.fn(),
    loginWithPasswordMock: vi.fn(),
    pushMock: vi.fn(),
    replaceMock: vi.fn(),
  }),
)

vi.mock('../../../i18n/navigation', () => ({
  useRouter: () => ({
    push: pushMock,
    replace: replaceMock,
  }),
}))

vi.mock('next-intl', () => ({
  useTranslations:
    () =>
    (key: string): string => {
      const map: Record<string, string> = {
        boundaryLabel: '当前边界',
        boundaryValue: '继续沿用前端 token 校验，不在这轮升级 cookie / middleware。',
        goalLabel: '当前目标',
        goalValue: '建立概览、简历编辑、AI 工作台、发布导出四个主工作区。',
        heroDescription:
          '这轮只升级后台信息架构与视觉壳层，不改后端 API，不把业务逻辑挪进 Next Route Handlers，也不扩到展示端样式体系。',
        heroTitle: '面向内容维护与 AI 操作的标准后台壳',
        loginChecking: '正在检查登录状态...',
        workflowOne: '业务逻辑继续只走 apps/server，admin 只做后台会话壳和操作入口。',
        workflowThree:
          '登录成功后进入 /dashboard，viewer 保持只读体验，admin 可继续写与发布。',
        workflowTwo: '当前 demo 账号：admin / admin123456、viewer / viewer123456。',
      }

      return map[key] ?? key
    },
}))

vi.mock('../services/auth-api', () => ({
  fetchCurrentUser: fetchCurrentUserMock,
  loginWithPassword: loginWithPasswordMock,
}))

vi.mock('../../shared/components/theme-mode-toggle', () => ({
  ThemeModeToggle: () => <div>主题切换占位</div>,
}))

vi.mock('../components/login-form', () => ({
  LoginForm: ({
    onSubmit,
    pending,
  }: {
    onSubmit: (values: { username: string; password: string }) => void | Promise<void>
    pending: boolean
  }) => (
    <div>
      <button
        disabled={pending}
        onClick={() =>
          void onSubmit({
            username: 'admin',
            password: 'admin123456',
          })
        }
        type="button">
        模拟登录
      </button>
    </div>
  ),
}))

import { AdminLoginShell } from '../login-shell'

describe('AdminLoginShell', () => {
  beforeEach(() => {
    resetAdminResourceStore()
    window.localStorage.clear()
    fetchCurrentUserMock.mockReset()
    loginWithPasswordMock.mockReset()
    pushMock.mockReset()
    replaceMock.mockReset()
  })

  afterEach(() => {
    cleanup()
  })

  it('should validate existing token only once under StrictMode', async () => {
    window.localStorage.setItem('my-resume.admin.access-token', 'admin-token')
    fetchCurrentUserMock.mockResolvedValue({
      id: 'admin-demo-user',
      username: 'admin',
      role: 'admin',
      isActive: true,
      capabilities: {
        canEditResume: true,
        canPublishResume: true,
        canTriggerAiAnalysis: true,
      },
    })

    render(
      <StrictMode>
        <Providers>
          <AdminLoginShell locale="zh" />
        </Providers>
      </StrictMode>,
    )

    await waitFor(() => {
      expect(fetchCurrentUserMock).toHaveBeenCalledTimes(1)
      expect(replaceMock).toHaveBeenCalledWith('/dashboard', { locale: 'zh' })
    })
  })

  it('should reuse login payload and avoid extra current-user request after sign-in', async () => {
    const user = userEvent.setup()

    loginWithPasswordMock.mockResolvedValue({
      accessToken: 'new-admin-token',
      tokenType: 'Bearer',
      expiresIn: 3600,
      user: {
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
    })

    render(
      <Providers>
        <AdminLoginShell locale="zh" />
      </Providers>,
    )

    await user.click(screen.getByRole('button', { name: '模拟登录' }))

    await waitFor(() => {
      expect(loginWithPasswordMock).toHaveBeenCalledTimes(1)
      expect(fetchCurrentUserMock).not.toHaveBeenCalled()
      expect(replaceMock).toHaveBeenCalledWith('/dashboard', { locale: 'zh' })
    })
    expect(window.localStorage.getItem('my-resume.admin.access-token')).toBe(
      'new-admin-token',
    )
  })
})
