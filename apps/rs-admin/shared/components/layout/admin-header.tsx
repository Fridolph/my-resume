'use client'

import { BellOutlined } from '@ant-design/icons'
import { Badge, Button, Layout } from 'antd'
import { usePathname } from 'next/navigation'

import { adminNavigation } from '@config/admin-navigation'
import { findNavigationTrail } from '@/utils/navigation'

import { ThemeToggle } from './theme-toggle'

const { Header } = Layout

/**
 * 顶部栏：结构对齐 dao-monorepo-temp，吸顶固定。
 *
 * 标题区为**单行**布局（对齐 dao 的面包屑语义，但不重复正文 PageHeader 的标题+说明）：
 *  - 左：模块名（大标题），如「简历管理」
 *  - 右：当前页名（12px 灰字），如「简历编辑」
 * 根级页面（如「概览」）只显示一级标题。
 */
export function AdminHeader() {
  const pathname = usePathname()
  const trail = findNavigationTrail(adminNavigation, pathname)

  const primary = (trail.length > 1 ? trail[0] : trail.at(-1))?.label ?? '概览'
  const secondary = trail.length > 1 ? trail.at(-1)?.label : undefined

  return (
    <Header
      className="sticky top-0 z-20 flex items-center justify-between gap-3 border-b border-[var(--ant-color-split)] backdrop-blur"
      style={{
        background: 'var(--ant-color-bg-container)',
        height: 56,
        paddingInline: 24,
        lineHeight: 'normal',
      }}
    >
      <div className="flex min-w-0 items-baseline gap-2">
        <h1 className="truncate text-lg font-semibold tracking-tight text-[var(--ant-color-text)]">
          {primary}
        </h1>
        {secondary ? (
          <span className="shrink-0 text-xs text-[var(--ant-color-text-secondary)]">
            {secondary}
          </span>
        ) : null}
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
