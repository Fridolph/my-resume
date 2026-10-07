import type { AdminBrandConfig, AdminNavigationItem } from '@/types/admin'

export const adminBrand: AdminBrandConfig = {
  name: 'RS Admin',
  mark: 'R',
  href: '/',
}

/**
 * 后台主导航（配置驱动，结构对齐 dao-monorepo-temp）。
 * 支持两级：分组项含 children，路由项含 to。
 *
 * 路由扁平化：概览为根 `/`，其余为 `/resume`、`/ai/*`、`/publish/*`、`/settings/*`，
 * 不再带 `/dashboard` 前缀。
 */
export const adminNavigation: AdminNavigationItem[] = [
  {
    key: 'dashboard',
    label: '概览',
    icon: 'dashboard',
    to: '/',
  },
  {
    key: 'resume',
    label: '简历管理',
    icon: 'resume',
    defaultOpen: true,
    children: [
      { key: 'resume-editor', label: '简历编辑', to: '/resume' },
      { key: 'resume-versions', label: '版本历史', to: '/resume/versions' },
    ],
  },
  {
    key: 'ai',
    label: 'AI 工作台',
    icon: 'ai',
    defaultOpen: true,
    children: [
      { key: 'ai-analysis', label: '简历分析', to: '/ai/analysis' },
      { key: 'ai-rag', label: 'RAG 管理', to: '/ai/rag' },
      { key: 'ai-chat', label: '对话记录', to: '/ai/chat' },
    ],
  },
  {
    key: 'publish',
    label: '发布治理',
    icon: 'publish',
    defaultOpen: true,
    children: [
      { key: 'publish-records', label: '发布记录', to: '/publish' },
      { key: 'publish-check', label: '发布检查', to: '/publish/check' },
    ],
  },
  {
    key: 'settings',
    label: '设置',
    icon: 'settings',
    defaultOpen: true,
    children: [
      { key: 'settings-profile', label: '用户信息', to: '/settings/profile' },
      { key: 'settings-ai', label: 'AI 设置', to: '/settings/ai' },
      { key: 'settings-display', label: '展示配置', to: '/settings/display' },
      { key: 'settings-security', label: '安全配置', to: '/settings/security' },
    ],
  },
]

/** 外部导航区（侧栏底部，对齐 dao 的 externalItems）。 */
export const adminExternalNavigation: AdminNavigationItem[] = [
  { key: 'help', label: '帮助中心', icon: 'help', to: '/help' },
  { key: 'changelog', label: '更新日志', icon: 'changelog', to: '/changelog' },
]
