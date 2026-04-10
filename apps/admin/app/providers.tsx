'use client'

import { ThemeProvider, useTheme } from 'next-themes'
import { useEffect, type ReactNode } from 'react'

import { AdminSessionProvider } from '../core/admin-session'

function ThemeDatasetBridge() {
  const { resolvedTheme } = useTheme()

  useEffect(() => {
    // HeroUI 和全局样式都依赖 data-theme，同步一份给根节点
    const nextTheme = resolvedTheme === 'dark' ? 'dark' : 'light'

    document.documentElement.dataset.theme = nextTheme
  }, [resolvedTheme])

  return null
}

/**
 * 后台全局 Provider 同时承接主题能力与会话上下文
 *
 * @param children 后台页面内容
 * @returns 后台全局 Provider 结构
 */
export function Providers({ children }: { children: ReactNode }) {
  return (
    <ThemeProvider
      attribute="class"
      defaultTheme="light"
      disableTransitionOnChange
      enableSystem={false}
      storageKey="my-resume-theme-mode">
      <AdminSessionProvider>
        <ThemeDatasetBridge />
        {children}
      </AdminSessionProvider>
    </ThemeProvider>
  )
}
