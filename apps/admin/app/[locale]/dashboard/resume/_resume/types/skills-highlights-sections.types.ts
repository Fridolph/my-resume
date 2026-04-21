import type { DndContext, DragEndEvent } from '@dnd-kit/core'
import type { ComponentProps, ReactNode } from 'react'

import type { StandardResume } from './resume.types'
import type {
  DraftFieldValues,
  EditorLocaleMode,
  SortableCollectionState,
} from './draft-editor.types'

/**
 * 技能分组分节组件入参。
 */
export interface SkillsSectionProps {
  addSkillGroup: () => void
  draftFieldValues: DraftFieldValues
  editorLocaleMode: EditorLocaleMode
  handleDragEnd: (event: DragEndEvent) => void
  isTranslationMode: boolean
  removeSkillGroup: (index: number) => void
  resumeDraft: StandardResume
  sensors: ComponentProps<typeof DndContext>['sensors']
  sortableCollections: SortableCollectionState
  translationAction?: ReactNode
  updateSkillKeywords: (index: number, value: string) => void
  updateSkillLocalizedField: (index: number, locale: 'zh' | 'en', value: string) => void
  updateSkillProficiency: (index: number, value: string) => void
}

/**
 * 亮点分节组件入参。
 */
export interface HighlightsSectionProps {
  addHighlight: () => void
  editorLocaleMode: EditorLocaleMode
  handleDragEnd: (event: DragEndEvent) => void
  isTranslationMode: boolean
  removeHighlight: (index: number) => void
  resumeDraft: StandardResume
  sensors: ComponentProps<typeof DndContext>['sensors']
  sortableCollections: SortableCollectionState
  translationAction?: ReactNode
  updateHighlightLocalizedField: (
    index: number,
    field: 'title' | 'description',
    locale: 'zh' | 'en',
    value: string,
  ) => void
}
