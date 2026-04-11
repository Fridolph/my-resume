import type { DndContext, DragEndEvent } from '@dnd-kit/core'
import type { ComponentProps, ReactNode } from 'react'

import type { StandardResume } from './resume.types'
import type {
  DraftFieldValues,
  EditorLocaleMode,
  SortableCollectionState,
} from './draft-editor.types'

export interface ProfileSectionProps {
  addProfileInterest: () => void
  addProfileLink: () => void
  draftFieldValues: DraftFieldValues
  editorLocaleMode: EditorLocaleMode
  handleProfileInterestsDragEnd: (event: DragEndEvent) => void
  handleProfileLinksDragEnd: (event: DragEndEvent) => void
  isTranslationMode: boolean
  removeProfileInterest: (index: number) => void
  removeProfileLink: (index: number) => void
  resumeDraft: StandardResume
  sensors: ComponentProps<typeof DndContext>['sensors']
  sortableCollections: SortableCollectionState
  translationAction?: ReactNode
  updateProfileHeroField: (
    field: 'frontImageUrl' | 'backImageUrl' | 'linkUrl',
    value: string,
  ) => void
  updateProfileHeroSlogans: (locale: 'zh' | 'en', value: string) => void
  updateProfileInterestField: (
    index: number,
    field: 'label' | 'icon',
    value: string,
    locale?: 'zh' | 'en',
  ) => void
  updateProfileLinkField: (
    index: number,
    field: 'label' | 'url' | 'icon',
    value: string,
    locale?: 'zh' | 'en',
  ) => void
  updateProfileLocalizedField: (
    field: 'fullName' | 'headline' | 'summary' | 'location',
    locale: 'zh' | 'en',
    value: string,
  ) => void
  updateProfilePlainField: (field: 'email' | 'phone' | 'website', value: string) => void
}
