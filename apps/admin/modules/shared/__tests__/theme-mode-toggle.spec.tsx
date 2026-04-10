import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it } from 'vitest'

import { Providers } from '../../../app/providers'
import { ThemeModeToggle } from '../components/theme-mode-toggle'

describe('ThemeModeToggle', () => {
  beforeEach(() => {
    window.localStorage.removeItem('my-resume.admin.access-token')
  })

  it('should switch theme mode and persist the latest selection', async () => {
    const user = userEvent.setup()

    render(
      <Providers>
        <ThemeModeToggle />
      </Providers>,
    )

    expect(screen.getByRole('switch', { name: '切换明暗主题' })).toBeInTheDocument()

    await waitFor(() => {
      expect(document.documentElement.dataset.theme).toBe('light')
    })

    await user.click(screen.getByRole('switch', { name: '切换明暗主题' }))

    await waitFor(() => {
      expect(document.documentElement.dataset.theme).toBe('dark')
    })
    expect(window.localStorage.getItem('my-resume-theme-mode')).toBe('dark')

    await user.click(screen.getByRole('switch', { name: '切换明暗主题' }))

    await waitFor(() => {
      expect(document.documentElement.dataset.theme).toBe('light')
    })
    expect(window.localStorage.getItem('my-resume-theme-mode')).toBe('light')
  })
})
