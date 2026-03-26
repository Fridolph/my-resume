'use client';

import { useThemeMode } from '@my-resume/ui/theme';

export function ThemeModeToggle() {
  const { theme, setTheme } = useThemeMode();

  return (
    <div aria-label="主题切换" className="toolbar-group" role="group">
      <button
        className={`toggle-button ${theme === 'light' ? 'is-active' : ''}`}
        onClick={() => setTheme('light')}
        type="button"
      >
        Light
      </button>
      <button
        className={`toggle-button ${theme === 'dark' ? 'is-active' : ''}`}
        onClick={() => setTheme('dark')}
        type="button"
      >
        Dark
      </button>
    </div>
  );
}
