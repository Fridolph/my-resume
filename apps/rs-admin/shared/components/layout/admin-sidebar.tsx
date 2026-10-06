'use client'

import { Layout, Menu } from 'antd'
import type { MenuProps } from 'antd'
import { usePathname, useRouter } from 'next/navigation'

import { adminBrand, adminNavigation } from '@config/admin-navigation'
import type { AdminNavigationItem } from '@/types/admin'

import { navigationIconMap } from './navigation-icons'

const { Sider } = Layout

/** 把导航配置转为 antd Menu items（key 用路由路径） */
function toMenuItems(items: AdminNavigationItem[]): NonNullable<MenuProps['items']> {
  return items.map(item => ({
    key: item.to ?? item.key,
    icon: item.icon ? navigationIconMap[item.icon] : undefined,
    label: item.label,
    children: item.children ? toMenuItems(item.children) : undefined,
  }))
}

export function AdminSidebar({ collapsed }: { collapsed: boolean }) {
  const pathname = usePathname()
  const router = useRouter()

  return (
    <Sider collapsible collapsed={collapsed} trigger={null} width={220} theme="dark">
      <div className="flex h-16 items-center gap-2 px-4 text-white">
        <span className="grid size-8 shrink-0 place-items-center rounded-lg bg-violet-600 text-sm font-bold">
          {adminBrand.mark}
        </span>
        {!collapsed && <span className="truncate font-semibold">{adminBrand.name}</span>}
      </div>
      <Menu
        theme="dark"
        mode="inline"
        selectedKeys={[pathname]}
        defaultOpenKeys={['ai']}
        items={toMenuItems(adminNavigation)}
        onClick={({ key }) => router.push(String(key))}
      />
    </Sider>
  )
}
