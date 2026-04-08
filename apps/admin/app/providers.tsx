'use client';

import { ThemeProvider, useTheme } from 'next-themes';
import { useEffect, type ReactNode } from 'react';

import { AdminSessionProvider } from '../lib/admin-session';

function ThemeDatasetBridge() {
  const { resolvedTheme } = useTheme();

  useEffect(() => {
    const nextTheme = resolvedTheme === 'dark' ? 'dark' : 'light';

    document.documentElement.dataset.theme = nextTheme;
  }, [resolvedTheme]);

  return null;
}

export function Providers({ children }: { children: ReactNode }) {
  return (
    <ThemeProvider
      attribute="class"
      defaultTheme="light"
      disableTransitionOnChange
      enableSystem={false}
      storageKey="my-resume-theme-mode"
    >
      <AdminSessionProvider>
        <ThemeDatasetBridge />
        {children}
      </AdminSessionProvider>
    </ThemeProvider>
  );
}
