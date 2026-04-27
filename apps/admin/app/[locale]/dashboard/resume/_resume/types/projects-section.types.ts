import type { DndContext, DragEndEvent } from '@dnd-kit/core'
import type { ComponentProps, ReactNode } from 'react'

import type { StandardResume } from './resume.types'
import type {
  DraftFieldValues,
  EditorLocaleMode,
  SortableCollectionState,
} from './draft-editor.types'

/**
 * 项目经历分节组件入参。
 */
export interface ProjectsSectionProps {
  addProject: () => void
  addProjectLink: (projectIndex: number) => void
  draftFieldValues: DraftFieldValues
  editorLocaleMode: EditorLocaleMode
  handleDragEnd: (event: DragEndEvent) => void
  isTranslationMode: boolean
  removeProject: (index: number) => void
  removeProjectLink: (projectIndex: number, linkIndex: number) => void
  resumeDraft: StandardResume
  sensors: ComponentProps<typeof DndContext>['sensors']
  sortableCollections: SortableCollectionState
  translationAction?: ReactNode
  updateProjectHighlights: (index: number, locale: 'zh' | 'en', value: string) => void
  updateProjectLinkField: (
    projectIndex: number,
    linkIndex: number,
    field: 'label' | 'url',
    value: string,
    locale?: 'zh' | 'en',
  ) => void
  updateProjectLocalizedField: (
    index: number,
    field: 'name' | 'role' | 'summary' | 'coreFunctions',
    locale: 'zh' | 'en',
    value: string,
  ) => void
  updateProjectPlainField: (
    index: number,
    field: 'startDate' | 'endDate',
    value: string,
  ) => void
  updateProjectTechnologies: (index: number, value: string) => void
}
