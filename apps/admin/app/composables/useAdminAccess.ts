import type { PermissionKey } from '@repo/types'

export interface AdminRouteAccessItem {
  title: string
  description: string
  to: string
  readPermission: PermissionKey
  writePermission?: PermissionKey
}

const adminRouteAccessItems: AdminRouteAccessItem[] = [
  {
    title: '首页',
    description: '查看后台当前账号、模块概览与快速入口。',
    to: '/',
    readPermission: 'dashboard.read'
  },
  {
    title: '用户管理',
    description: '验证登录态、权限判断与用户管理模块。',
    to: '/users',
    readPermission: 'user.read',
    writePermission: 'user.write'
  },
  {
    title: '文案管理',
    description: '验证 namespace、locale、发布状态和缺失文案的管理入口。',
    to: '/translations',
    readPermission: 'translation.read',
    writePermission: 'translation.write'
  },
  {
    title: '简历管理',
    description: '维护基础信息、教育经历、工作经历、技能和联系方式，并验证多语言简历编辑方式。',
    to: '/resume',
    readPermission: 'resume.read',
    writePermission: 'resume.write'
  },
  {
    title: '项目管理',
    description: '维护项目列表、排序、标签、多语言说明、外链与封面字段，并验证发布状态流转。',
    to: '/projects',
    readPermission: 'project.read',
    writePermission: 'project.write'
  },
  {
    title: '站点设置',
    description: '维护默认语言、社交链接、下载资源与 SEO 默认配置。',
    to: '/settings',
    readPermission: 'site.read',
    writePermission: 'site.write'
  },
  {
    title: '统一发布',
    description: '管理公开站点当前生效的统一发布批次。',
    to: '/releases',
    readPermission: 'site.read',
    writePermission: 'site.write'
  }
]

export function useAdminAccess() {
  const { hasPermission } = usePermissions()

  function canAccessRoute(permission: PermissionKey) {
    return hasPermission(permission)
  }

  const visibleRouteItems = computed(() => {
    return adminRouteAccessItems.filter(item => canAccessRoute(item.readPermission))
  })

  return {
    adminRouteAccessItems,
    visibleRouteItems,
    canAccessRoute
  }
}
