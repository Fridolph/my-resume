import type { DragEndEvent } from '@dnd-kit/core'
import type { ReactNode } from 'react'

import type { StandardResume } from './resume.types'

/**
 * 编辑器状态。
 */
export type DraftEditorStatus = 'idle' | 'loading' | 'ready' | 'error'

/**
 * 扁平字段缓存（用于受控输入回填）。
 */
export type DraftFieldValues = Record<string, string>

/**
 * 当前编辑语言模式。
 */
export type EditorLocaleMode = 'zh' | 'en'

/**
 * 可排序集合键。
 */
export type SortableCollectionKey =
  | 'profileLinks'
  | 'profileInterests'
  | 'education'
  | 'experiences'
  | 'projects'
  | 'skills'
  | 'highlights'

/**
 * 可排序集合状态映射。
 */
export type SortableCollectionState = Record<SortableCollectionKey, string[]>

/**
 * 草稿变更可选项。
 */
export interface ResumeDraftMutationOptions {
  syncDraftFields?: boolean
}

/**
 * 翻译动作处理器。
 */
export interface TranslationActionHandlers {
  onClear: () => void
  onCopy: () => void
}

/**
 * 草稿变更函数类型。
 */
export type ResumeDraftMutator = (draft: StandardResume) => void

/**
 * 更新草稿函数类型。
 */
export type UpdateResumeDraft = (
  mutator: ResumeDraftMutator,
  options?: ResumeDraftMutationOptions,
) => void

/**
 * 更新排序集合函数类型。
 */
export type UpdateSortableCollection = (
  collection: SortableCollectionKey,
  updater: (currentIds: string[]) => string[],
) => void

/**
 * 处理拖拽排序结束事件函数类型。
 */
export type HandleCollectionDragEnd = (
  collection: SortableCollectionKey,
  event: DragEndEvent,
) => void

/**
 * 渲染翻译动作函数类型。
 */
export type RenderTranslationActions = (
  scopeTitle: string,
  handlers: TranslationActionHandlers,
) => ReactNode
