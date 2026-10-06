import type { AdminBrandConfig, AdminNavigationItem } from '@/types/admin'

export const adminBrand: AdminBrandConfig = {
  name: 'RS Admin',
  mark: 'R',
  href: '/',
}

/**
 * 后台导航配置（配置驱动）。
 * 后续由 M49-I5（布局壳）消费渲染；此处先给最小骨架。
 */
export const adminNavigation: AdminNavigationItem[] = [
  {
    key: 'dashboard',
    label: '概览',
    icon: 'dashboard',
    to: '/',
  },
]
