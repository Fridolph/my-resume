'use client'

import { BellOutlined } from '@ant-design/icons'
import { Badge, Breadcrumb, Button, Layout } from 'antd'
import { usePathname } from 'next/navigation'

import { adminNavigation } from '@config/admin-navigation'
import { findNavigationTrail } from '@/utils/navigation'

import { ThemeToggle } from './theme-toggle'

const { Header } = Layout

/**
 * 顶部栏：结构对齐 dao-monorepo-temp，吸顶固定。
 *  - 左：面包屑 + 页面标题
 *  - 右：通知 + 主题切换
 * 用户菜单位于侧栏底部（见 AdminUserMenu）。
 */
export function AdminHeader() {
  const pathname = usePathname()
  const trail = findNavigationTrail(adminNavigation, pathname)
  const title = trail.at(-1)?.label ?? '概览'
  const parents = trail.slice(0, -1)

  return (
    <Header
      className="sticky top-0 z-20 flex items-center justify-between gap-3 border-b border-[var(--ant-color-split)] px-4 backdrop-blur md:px-6"
      style={{
        background: 'var(--ant-color-bg-container)',
        height: 56,
        lineHeight: 'normal',
      }}
    >
      <div className="min-w-0">
        {parents.length > 0 ? (
          <Breadcrumb
            className="mb-0.5 text-xs"
            items={parents.map(item => ({ title: item.label }))}
          />
        ) : null}
        <h1 className="truncate text-lg font-semibold tracking-tight text-[var(--ant-color-text)]">
          {title}
        </h1>
      </div>

      <div className="flex items-center gap-1">
        <ThemeToggle />
        <Badge dot offset={[-4, 4]}>
          <Button type="text" aria-label="通知" icon={<BellOutlined />} />
        </Badge>
      </div>
    </Header>
  )
}
