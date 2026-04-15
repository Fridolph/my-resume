import type { DragEndEvent } from '@dnd-kit/core'
import type { ReactNode } from 'react'

import type { StandardResume } from './resume.types'

export type DraftEditorStatus = 'idle' | 'loading' | 'ready' | 'error'
export type DraftFieldValues = Record<string, string>
export type EditorLocaleMode = 'zh' | 'en'
export type SortableCollectionKey =
  | 'profileLinks'
  | 'profileInterests'
  | 'education'
  | 'experiences'
  | 'projects'
  | 'skills'
  | 'highlights'
export type SortableCollectionState = Record<SortableCollectionKey, string[]>

export interface ResumeDraftMutationOptions {
  syncDraftFields?: boolean
}

export interface TranslationActionHandlers {
  onClear: () => void
  onCopy: () => void
}

export type ResumeDraftMutator = (draft: StandardResume) => void
export type UpdateResumeDraft = (
  mutator: ResumeDraftMutator,
  options?: ResumeDraftMutationOptions,
) => void
export type UpdateSortableCollection = (
  collection: SortableCollectionKey,
  updater: (currentIds: string[]) => string[],
) => void
export type HandleCollectionDragEnd = (
  collection: SortableCollectionKey,
  event: DragEndEvent,
) => void
export type RenderTranslationActions = (
  scopeTitle: string,
  handlers: TranslationActionHandlers,
) => ReactNode
