import type { AdminBrandConfig, AdminNavigationItem } from '@/types/admin'

export const adminBrand: AdminBrandConfig = {
  name: 'RS Admin',
  mark: 'R',
  href: '/dashboard',
}

/**
 * 后台主导航（配置驱动，结构对齐 dao-monorepo-temp）。
 * 支持两级：分组项含 children，路由项含 to。
 */
export const adminNavigation: AdminNavigationItem[] = [
  {
    key: 'dashboard',
    label: '概览',
    icon: 'dashboard',
    to: '/dashboard',
  },
  {
    key: 'resume',
    label: '简历管理',
    icon: 'resume',
    defaultOpen: true,
    children: [
      { key: 'resume-editor', label: '简历编辑', to: '/dashboard/resume' },
      { key: 'resume-versions', label: '版本历史', to: '/dashboard/resume/versions' },
    ],
  },
  {
    key: 'ai',
    label: 'AI 工作台',
    icon: 'ai',
    defaultOpen: true,
    children: [
      { key: 'ai-analysis', label: '简历分析', to: '/dashboard/ai/analysis' },
      { key: 'ai-rag', label: 'RAG 管理', to: '/dashboard/ai/rag' },
      { key: 'ai-chat', label: '对话记录', to: '/dashboard/ai/chat' },
    ],
  },
  {
    key: 'publish',
    label: '发布治理',
    icon: 'publish',
    defaultOpen: true,
    children: [
      { key: 'publish-records', label: '发布记录', to: '/dashboard/publish' },
      { key: 'publish-check', label: '发布检查', to: '/dashboard/publish/check' },
    ],
  },
  {
    key: 'settings',
    label: '设置',
    icon: 'settings',
    to: '/dashboard/settings',
  },
]

/** 外部导航区（侧栏底部，对齐 dao 的 externalItems）。 */
export const adminExternalNavigation: AdminNavigationItem[] = [
  { key: 'help', label: '帮助中心', icon: 'help', to: '/dashboard/help' },
  { key: 'changelog', label: '更新日志', icon: 'changelog', to: '/dashboard/changelog' },
]
