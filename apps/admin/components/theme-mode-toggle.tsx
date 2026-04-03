'use client';

import { Switch } from '@heroui/react';
import { useTheme } from 'next-themes';

export function ThemeModeToggle() {
  const { resolvedTheme, setTheme } = useTheme();
  const isDark = resolvedTheme === 'dark';

  return (
    <label
      className="header-theme-switch"
      htmlFor="theme-mode-switch"
    >
      <span className="header-theme-label">{isDark ? 'Dark' : 'Light'}</span>
      <Switch
        aria-label="切换明暗主题"
        id="theme-mode-switch"
        isSelected={isDark}
        onChange={(nextSelected) => setTheme(nextSelected ? 'dark' : 'light')}
        size="sm"
      >
        <span className="sr-only">切换明暗主题</span>
      </Switch>
    </label>
  );
}
