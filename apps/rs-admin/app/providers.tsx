'use client'

/**
 * 全局 Providers：主题状态 → antd ConfigProvider → App 容器。
 *
 * - React 19 兼容补丁（antd v5 官方）
 * - 主题单一来源：ThemeProvider 提供 light/dark，ConfigProvider 切 algorithm
 */
import '@ant-design/v5-patch-for-react-19'

import { App as AntdApp, ConfigProvider } from 'antd'
import zhCN from 'antd/locale/zh_CN'
import type { ReactNode } from 'react'

import { AuthProvider } from '@shared/lib/auth/auth-context'
import { getAntdTheme } from '@shared/lib/theme/theme-config'
import { ThemeProvider, useTheme } from '@shared/lib/theme/theme-context'

function AntdProviders({ children }: { children: ReactNode }) {
  const { mode } = useTheme()

  return (
    <ConfigProvider locale={zhCN} theme={getAntdTheme(mode)}>
      <AntdApp>{children}</AntdApp>
    </ConfigProvider>
  )
}

export function Providers({ children }: { children: ReactNode }) {
  return (
    <ThemeProvider>
      <AntdProviders>
        <AuthProvider>{children}</AuthProvider>
      </AntdProviders>
    </ThemeProvider>
  )
}
