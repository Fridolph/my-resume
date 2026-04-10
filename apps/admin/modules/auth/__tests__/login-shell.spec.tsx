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

vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: pushMock,
    replace: replaceMock,
  }),
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
          <AdminLoginShell />
        </Providers>
      </StrictMode>,
    )

    await waitFor(() => {
      expect(fetchCurrentUserMock).toHaveBeenCalledTimes(1)
      expect(replaceMock).toHaveBeenCalledWith('/dashboard')
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
        <AdminLoginShell />
      </Providers>,
    )

    await user.click(screen.getByRole('button', { name: '模拟登录' }))

    await waitFor(() => {
      expect(loginWithPasswordMock).toHaveBeenCalledTimes(1)
      expect(fetchCurrentUserMock).not.toHaveBeenCalled()
      expect(replaceMock).toHaveBeenCalledWith('/dashboard')
    })
    expect(window.localStorage.getItem('my-resume.admin.access-token')).toBe(
      'new-admin-token',
    )
  })
})
