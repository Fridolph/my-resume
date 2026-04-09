export interface AdminNavigationItem {
  key: 'overview' | 'resume' | 'ai' | 'publish'
  href: '/dashboard' | '/dashboard/resume' | '/dashboard/ai' | '/dashboard/publish'
  title: string
  description: string
  shortLabel: string
  eyebrow: string
}

export const adminNavigationItems: AdminNavigationItem[] = [
  {
    key: 'overview',
    href: '/dashboard',
    title: '概览',
    description: '查看当前账号、能力边界、运行时状态和快捷入口。',
    shortLabel: '概览',
    eyebrow: '控制台',
  },
  {
    key: 'resume',
    href: '/dashboard/resume',
    title: '简历编辑',
    description: '维护草稿内容，继续遵守“先保存草稿，再手动发布”的主线。',
    shortLabel: '简历',
    eyebrow: '内容工作区',
  },
  {
    key: 'ai',
    href: '/dashboard/ai',
    title: 'AI 工作台',
    description: '组织上传、分析、缓存结果、运行时摘要与草稿反馈。',
    shortLabel: 'AI',
    eyebrow: '智能分析',
  },
  {
    key: 'publish',
    href: '/dashboard/publish',
    title: '发布与导出',
    description: '集中处理角色动作、发布链路和导出下载入口。',
    shortLabel: '发布',
    eyebrow: '交付动作',
  },
]

export function getAdminPageMeta(pathname: string): AdminNavigationItem {
  const exactMatch = adminNavigationItems.find((item) => item.href === pathname)

  if (exactMatch) {
    return exactMatch
  }

  const nestedMatch = adminNavigationItems.find(
    (item) => item.href !== '/dashboard' && pathname.startsWith(item.href),
  )

  return nestedMatch ?? adminNavigationItems[0]
}
