import type { DndContext, DragEndEvent } from '@dnd-kit/core'
import type { ComponentProps, ReactNode } from 'react'

import type { StandardResume } from './resume.types'
import type {
  DraftFieldValues,
  EditorLocaleMode,
  SortableCollectionState,
} from './draft-editor.types'

/**
 * 工作经历分节组件入参。
 */
export interface ExperiencesSectionProps {
  addExperience: () => void
  draftFieldValues: DraftFieldValues
  editorLocaleMode: EditorLocaleMode
  handleDragEnd: (event: DragEndEvent) => void
  isTranslationMode: boolean
  removeExperience: (index: number) => void
  resumeDraft: StandardResume
  sensors: ComponentProps<typeof DndContext>['sensors']
  sortableCollections: SortableCollectionState
  translationAction?: ReactNode
  updateExperienceHighlights: (index: number, locale: 'zh' | 'en', value: string) => void
  updateExperienceLocalizedField: (
    index: number,
    field: 'companyName' | 'role' | 'employmentType' | 'location' | 'summary',
    locale: 'zh' | 'en',
    value: string,
  ) => void
  updateExperiencePlainField: (
    index: number,
    field: 'startDate' | 'endDate',
    value: string,
  ) => void
  updateExperienceTechnologies: (index: number, value: string) => void
}
