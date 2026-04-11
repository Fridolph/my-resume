import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'

import { LoginForm } from '../components/login-form'

describe('LoginForm', () => {
  it('should submit username and password to the callback', async () => {
    const user = userEvent.setup()
    const onSubmit = vi.fn().mockResolvedValue(undefined)

    render(<LoginForm onSubmit={onSubmit} pending={false} errorMessage={null} />)

    await user.type(screen.getByLabelText('用户名'), 'admin')
    await user.type(screen.getByLabelText('密码'), 'admin123456')
    await user.click(screen.getByRole('button', { name: '登录后台' }))

    expect(onSubmit).toHaveBeenCalledWith({
      username: 'admin',
      password: 'admin123456',
    })
  }, 10000)

  it('should render error message when login fails', () => {
    render(<LoginForm onSubmit={vi.fn()} pending={false} errorMessage="账号或密码错误" />)

    expect(screen.getByText('账号或密码错误')).toBeInTheDocument()
  })
})
