import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ThemeModeProvider } from '@my-resume/ui/theme';
import { describe, expect, it } from 'vitest';

import { ThemeModeToggle } from './theme-mode-toggle';

describe('ThemeModeToggle', () => {
  it('should switch theme mode and persist the latest selection', async () => {
    const user = userEvent.setup();

    render(
      <ThemeModeProvider>
        <ThemeModeToggle />
      </ThemeModeProvider>,
    );

    expect(document.documentElement.dataset.theme).toBe('light');

    await user.click(screen.getByRole('button', { name: 'Dark' }));

    expect(document.documentElement.dataset.theme).toBe('dark');
    expect(window.localStorage.getItem('my-resume-theme-mode')).toBe('dark');

    await user.click(screen.getByRole('button', { name: 'Light' }));

    expect(document.documentElement.dataset.theme).toBe('light');
    expect(window.localStorage.getItem('my-resume-theme-mode')).toBe('light');
  });
});
