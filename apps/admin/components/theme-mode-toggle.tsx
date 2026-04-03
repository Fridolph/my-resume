'use client';

import { Switch } from '@heroui/react';
import { useTheme } from 'next-themes';

export function ThemeModeToggle() {
  const { resolvedTheme, setTheme } = useTheme();
  const isDark = resolvedTheme === 'dark';

  return (
    <Switch
      aria-label="切换明暗主题"
      className="header-theme-switch"
      isSelected={isDark}
      onChange={(nextSelected) => setTheme(nextSelected ? 'dark' : 'light')}
      size="sm"
    >
      {isDark ? 'Dark' : 'Light'}
    </Switch>
  );
}
