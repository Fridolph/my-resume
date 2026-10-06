import type { ReactNode } from 'react'

interface PageHeaderProps {
  title: string
  description?: string
  /** 右侧操作区（按钮等） */
  extra?: ReactNode
}

/**
 * 页面标题栏：统一标题/描述/操作区排版。
 */
export function PageHeader({ title, description, extra }: PageHeaderProps) {
  return (
    <div className="mb-4 flex flex-col justify-between gap-3 sm:flex-row sm:items-end">
      <div>
        <h1 className="text-xl font-semibold tracking-tight text-[var(--ant-color-text)]">
          {title}
        </h1>
        {description ? (
          <p className="mt-1 text-sm text-[var(--ant-color-text-secondary)]">{description}</p>
        ) : null}
      </div>
      {extra}
    </div>
  )
}
