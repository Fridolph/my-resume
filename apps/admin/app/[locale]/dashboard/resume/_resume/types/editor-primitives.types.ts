import type { ReactNode } from 'react'

import type { EditorLocaleMode } from './draft-editor.types'

/**
 * 图标按钮基础入参。
 */
export interface IconActionButtonProps {
  buttonProps?: Record<string, unknown>
  className?: string
  icon: ReactNode
  label: string
  onClick: () => void
  size?: 'compact' | 'default'
  tone?: 'default' | 'danger'
  variant?: 'ghost' | 'outline'
}

/**
 * 双语编辑字段入参。
 */
export interface LocalizedEditorFieldProps {
  label: string
  localeMode: EditorLocaleMode
  onChange: (value: string) => void
  rows?: number
  sourceValue?: string
  value: string
  variant?: 'input' | 'textarea'
}

/**
 * 编辑分节容器入参。
 */
export interface EditorSectionProps {
  action?: ReactNode
  children: ReactNode
  count?: number
  defaultExpanded?: boolean
  description: string
  title: string
}

/**
 * 编辑条目容器入参。
 */
export interface EditorEntryProps {
  action?: ReactNode
  children: ReactNode
  defaultExpanded?: boolean
  leadingAction?: ReactNode
  summary: string
  title: string
  toggleLabel: string
  variant?: 'default' | 'embedded'
}
