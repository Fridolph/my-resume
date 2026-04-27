import type { DndContext, DragEndEvent } from '@dnd-kit/core'
import type { ComponentProps, ReactNode } from 'react'

import type { StandardResume } from './resume.types'
import type {
  DraftFieldValues,
  EditorLocaleMode,
  SortableCollectionState,
} from './draft-editor.types'

/**
 * 教育经历分节组件入参。
 */
export interface EducationSectionProps {
  addEducation: () => void
  draftFieldValues: DraftFieldValues
  editorLocaleMode: EditorLocaleMode
  handleDragEnd: (event: DragEndEvent) => void
  isTranslationMode: boolean
  removeEducation: (index: number) => void
  resumeDraft: StandardResume
  sensors: ComponentProps<typeof DndContext>['sensors']
  sortableCollections: SortableCollectionState
  translationAction?: ReactNode
  updateEducationHighlights: (index: number, locale: 'zh' | 'en', value: string) => void
  updateEducationLocalizedField: (
    index: number,
    field: 'schoolName' | 'degree' | 'fieldOfStudy' | 'location',
    locale: 'zh' | 'en',
    value: string,
  ) => void
  updateEducationPlainField: (
    index: number,
    field: 'startDate' | 'endDate',
    value: string,
  ) => void
}
