'use client'

/**
 * 全局 Providers：antd ConfigProvider + App 容器。
 *
 * - React 19 兼容补丁（antd v5 官方）
 * - 主题 token 集中在此，作为单一主题来源（暗色切换后续在 #282 接入）
 */
import '@ant-design/v5-patch-for-react-19'

import { App as AntdApp, ConfigProvider, theme } from 'antd'
import zhCN from 'antd/locale/zh_CN'
import type { ReactNode } from 'react'

const themeConfig = {
  token: {
    colorPrimary: '#7c3aed',
    borderRadius: 8,
  },
  algorithm: theme.defaultAlgorithm,
}

export function Providers({ children }: { children: ReactNode }) {
  return (
    <ConfigProvider locale={zhCN} theme={themeConfig}>
      <AntdApp>{children}</AntdApp>
    </ConfigProvider>
  )
}
