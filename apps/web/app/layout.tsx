import './globals.css'

import { ThemeModeProvider } from '@my-resume/ui/theme'
import type { Metadata } from 'next'
import type { ReactNode } from 'react'

export const metadata: Metadata = {
  title: 'my-resume web',
  description: 'Public resume web shell',
}

const themeInitScript = `
  (function () {
    try {
      var storageKey = 'my-resume-theme-mode';
      var storedTheme = window.localStorage.getItem(storageKey);
      var theme = storedTheme === 'dark' ? 'dark' : 'light';
      var root = document.documentElement;
      root.dataset.theme = theme;
      root.style.colorScheme = theme;
      if (theme === 'dark') {
        root.classList.add('dark');
      } else {
        root.classList.remove('dark');
      }
    } catch (error) {}
  })();
`

export default function RootLayout({
  children,
}: Readonly<{
  children: ReactNode
}>) {
  return (
    <html
      data-template="default"
      data-theme="light"
      lang="zh-CN"
      suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeInitScript }} />
      </head>
      <body>
        <ThemeModeProvider>{children}</ThemeModeProvider>
      </body>
    </html>
  )
}
