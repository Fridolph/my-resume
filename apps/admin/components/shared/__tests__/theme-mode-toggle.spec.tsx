import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';

import { Providers } from '../../../app/providers';
import { ThemeModeToggle } from '../theme-mode-toggle';

describe('ThemeModeToggle', () => {
  it('should switch theme mode and persist the latest selection', async () => {
    const user = userEvent.setup();

    const { container } = render(
      <Providers>
        <ThemeModeToggle />
      </Providers>,
    );

    expect(container.querySelector('.header-theme-switch')).toBeInTheDocument();
    expect(container.querySelector('.header-theme-switch-control')).toBeInTheDocument();

    await waitFor(() => {
      expect(document.documentElement.dataset.theme).toBe('light');
    });

    await user.click(screen.getByRole('switch', { name: '切换明暗主题' }));

    await waitFor(() => {
      expect(document.documentElement.dataset.theme).toBe('dark');
    });
    expect(window.localStorage.getItem('my-resume-theme-mode')).toBe('dark');

    await user.click(screen.getByRole('switch', { name: '切换明暗主题' }));

    await waitFor(() => {
      expect(document.documentElement.dataset.theme).toBe('light');
    });
    expect(window.localStorage.getItem('my-resume-theme-mode')).toBe('light');
  });
});
