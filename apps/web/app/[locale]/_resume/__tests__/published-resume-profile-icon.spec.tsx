import { render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'

vi.mock('@iconify/react', () => ({
  Icon: ({ icon, ...props }: { icon: string }) => (
    <span data-icon={icon} data-testid="iconify-icon" {...props} />
  ),
}))

import { PublishedResumeProfileIcon } from '../published-resume-profile-icon'

describe('PublishedResumeProfileIcon', () => {
  it('renders dynamic iconify icons from resume data', () => {
    render(<PublishedResumeProfileIcon name="simple-icons:juejin" />)

    expect(screen.getByTestId('iconify-icon')).toHaveAttribute(
      'data-icon',
      'simple-icons:juejin',
    )
  })

  it('falls back to external link icon when icon name is empty', () => {
    const { container } = render(<PublishedResumeProfileIcon name="   " />)

    expect(screen.queryByTestId('iconify-icon')).not.toBeInTheDocument()
    expect(container.querySelector('svg')).toBeTruthy()
  })
})
