import { theme, type ThemeConfig } from 'antd'

export type ThemeMode = 'light' | 'dark'

/**
 * antd 主题配置工厂 —— 单一主题来源。
 * 亮/暗共用基础 token，仅切换 algorithm 与个别组件 token。
 * cssVar: true 让设计 token 以 CSS 变量暴露（--ant-*），供 Tailwind 布局层引用。
 */
export function getAntdTheme(mode: ThemeMode): ThemeConfig {
  const isDark = mode === 'dark'

  return {
    cssVar: true,
    token: {
      colorPrimary: '#7c3aed',
      borderRadius: 8,
    },
    components: {
      Layout: {
        headerBg: isDark ? '#141414' : '#ffffff',
        headerHeight: 56,
      },
    },
    algorithm: isDark ? theme.darkAlgorithm : theme.defaultAlgorithm,
  }
}
