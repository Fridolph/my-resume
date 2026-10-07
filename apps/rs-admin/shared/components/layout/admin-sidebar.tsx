'use client'

import { MenuFoldOutlined, MenuUnfoldOutlined } from '@ant-design/icons'
import { Button, Layout, Menu } from 'antd'
import type { MenuProps } from 'antd'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'

import { adminExternalNavigation, adminBrand, adminNavigation } from '@config/admin-navigation'
import type { AdminNavigationItem } from '@/types/admin'
import { collectAncestorKeys, collectDefaultOpenKeys } from '@/utils/navigation'
import { useTheme } from '@shared/lib/theme/theme-context'

import { AdminUserMenu } from './admin-user-menu'
import { navigationIconMap } from './navigation-icons'

const { Sider } = Layout

const SIDER_WIDTH = 240
const SIDER_COLLAPSED_WIDTH = 72

/** 把导航配置转为 antd Menu items（key 用路由路径，便于选中态与跳转） */
function toMenuItems(items: AdminNavigationItem[]): NonNullable<MenuProps['items']> {
  return items.map(item => ({
    key: item.to ?? item.key,
    icon: item.icon ? navigationIconMap[item.icon] : undefined,
    label: item.label,
    children: item.children ? toMenuItems(item.children) : undefined,
  }))
}

interface AdminSidebarProps {
  collapsed: boolean
  onToggleCollapsed: () => void
}

/**
 * 侧边栏：结构对齐 dao-monorepo-temp。
 *  - 顶部：品牌区（logo + 名称 + 折叠按钮）
 *  - 中部：主导航（两级，可展开/收起）
 *  - 底部：外部导航区 + 用户菜单
 */
export function AdminSidebar({ collapsed, onToggleCollapsed }: AdminSidebarProps) {
  const pathname = usePathname()
  const router = useRouter()
  const { mode } = useTheme()
  const antdTheme = mode === 'dark' ? 'dark' : 'light'

  const [openKeys, setOpenKeys] = useState<string[]>(() => collectDefaultOpenKeys(adminNavigation))

  // 路由变化时，自动展开当前路由所在的分组
  useEffect(() => {
    const ancestors = collectAncestorKeys(adminNavigation, pathname)
    if (ancestors.length > 0) {
      setOpenKeys(prev => Array.from(new Set([...prev, ...ancestors])))
    }
  }, [pathname])

  const navigate: MenuProps['onClick'] = ({ key }) => {
    const target = String(key)
    if (target.startsWith('/')) {
      router.push(target)
    }
  }

  return (
    <Sider
      collapsible
      collapsed={collapsed}
      trigger={null}
      width={SIDER_WIDTH}
      collapsedWidth={SIDER_COLLAPSED_WIDTH}
      theme={antdTheme}
      className="border-r border-[var(--ant-color-split)]"
      style={{ position: 'sticky', top: 0, height: '100vh', overflow: 'hidden' }}
    >
      <div className="flex h-full flex-col">
        {/* 顶部品牌区 */}
        {collapsed ? (
          <div className="flex h-14 shrink-0 items-center justify-center">
            <Button
              type="text"
              aria-label="展开侧边栏"
              icon={<MenuUnfoldOutlined />}
              onClick={onToggleCollapsed}
            />
          </div>
        ) : (
          <div className="flex h-14 shrink-0 items-center justify-between gap-2 px-3">
            <Link
              href={adminBrand.href ?? '/'}
              className="flex min-w-0 items-center gap-2 text-[var(--ant-color-text)]"
              aria-label={adminBrand.name}
            >
              <span className="grid size-8 shrink-0 place-items-center rounded-lg bg-[var(--ant-color-primary)] text-sm font-bold text-white">
                {adminBrand.mark}
              </span>
              <span className="truncate text-base font-semibold">{adminBrand.name}</span>
            </Link>
            <Button
              type="text"
              aria-label="收起侧边栏"
              icon={<MenuFoldOutlined />}
              onClick={onToggleCollapsed}
            />
          </div>
        )}

        {/* 中部主导航（可滚动） */}
        <div className="flex-1 overflow-y-auto px-2 py-2">
          <Menu
            mode="inline"
            theme={antdTheme}
            selectedKeys={[pathname]}
            openKeys={openKeys}
            onOpenChange={keys => setOpenKeys(keys as string[])}
            items={toMenuItems(adminNavigation)}
            onClick={navigate}
            style={{ borderInlineEnd: 'none' }}
          />
        </div>

        {/* 底部：外部导航区 + 用户菜单 */}
        <div className="shrink-0 px-2 pb-3">
          <Menu
            mode="inline"
            theme={antdTheme}
            selectable={false}
            items={toMenuItems(adminExternalNavigation)}
            onClick={navigate}
            style={{ borderInlineEnd: 'none' }}
          />
          <div className="mt-2 border-t border-[var(--ant-color-split)] pt-2">
            <AdminUserMenu collapsed={collapsed} />
          </div>
        </div>
      </div>
    </Sider>
  )
}
