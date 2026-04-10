import {
  KeyboardSensor,
  PointerSensor,
  TouchSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core'
import { arrayMove, sortableKeyboardCoordinates } from '@dnd-kit/sortable'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'

import type { ResumeDraftSnapshot, StandardResume } from '../types/resume.types'
import {
  buildDraftFieldValues,
  buildSortableCollectionState,
  cloneResume,
  collectionNeedsDraftFieldSync,
  createEmptySortableCollectionState,
  formatIsoDateTime,
  reorderResumeCollection,
} from '../editor/draft-editor-helpers'
import type { ResumeDraftEditorPanelProps } from '../types/draft-editor-panel.types'
import type {
  DraftEditorStatus,
  DraftFieldValues,
  EditorLocaleMode,
  ResumeDraftMutationOptions,
  SortableCollectionKey,
  SortableCollectionState,
} from '../types/draft-editor.types'

type UseResumeDraftEditorStateArgs = Pick<
  ResumeDraftEditorPanelProps,
  'accessToken' | 'apiBaseUrl' | 'canEdit' | 'loadDraft'
> & {
  loadDraft: NonNullable<ResumeDraftEditorPanelProps['loadDraft']>
}

export function useResumeDraftEditorState({
  accessToken,
  apiBaseUrl,
  canEdit,
  loadDraft,
}: UseResumeDraftEditorStateArgs) {
  const [status, setStatus] = useState<DraftEditorStatus>('idle')
  const [draftSnapshot, setDraftSnapshot] = useState<ResumeDraftSnapshot | null>(null)
  const [resumeDraft, setResumeDraft] = useState<StandardResume | null>(null)
  const [draftFieldValues, setDraftFieldValues] = useState<DraftFieldValues>({})
  const [sortableCollections, setSortableCollections] = useState<SortableCollectionState>(
    createEmptySortableCollectionState(),
  )
  const [editorLocaleMode, setEditorLocaleMode] = useState<EditorLocaleMode>('zh')
  const [pendingSave, setPendingSave] = useState(false)
  const [feedbackMessage, setFeedbackMessage] = useState<string | null>(null)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const sortableIdCounterRef = useRef(0)

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(TouchSensor, {
      activationConstraint: {
        delay: 180,
        tolerance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  )

  const nextSortableId = useCallback((scope: SortableCollectionKey) => {
    sortableIdCounterRef.current += 1
    return `${scope}-${sortableIdCounterRef.current}`
  }, [])

  const replaceSortableCollections = useCallback(
    (nextResume: StandardResume) => {
      setSortableCollections(buildSortableCollectionState(nextResume, nextSortableId))
    },
    [nextSortableId],
  )

  const hydrateDraft = useCallback(
    (snapshot: ResumeDraftSnapshot) => {
      setDraftSnapshot(snapshot)
      setResumeDraft(cloneResume(snapshot.resume))
      setDraftFieldValues(buildDraftFieldValues(snapshot.resume))
      replaceSortableCollections(snapshot.resume)
      setStatus('ready')
    },
    [replaceSortableCollections],
  )

  const updateSortableCollection = useCallback(
    (
      collection: SortableCollectionKey,
      updater: (currentIds: string[]) => string[],
    ) => {
      setSortableCollections((current) => ({
        ...current,
        [collection]: updater(current[collection]),
      }))
    },
    [],
  )

  const updateResumeDraft = useCallback(
    (
      mutator: (draft: StandardResume) => void,
      options?: ResumeDraftMutationOptions,
    ) => {
      let nextDraftForDraftFields: StandardResume | null = null

      setResumeDraft((current) => {
        if (!current) {
          return current
        }

        const nextDraft = cloneResume(current)
        mutator(nextDraft)
        nextDraftForDraftFields = nextDraft
        return nextDraft
      })

      if (options?.syncDraftFields && nextDraftForDraftFields) {
        setDraftFieldValues(buildDraftFieldValues(nextDraftForDraftFields))
      }
    },
    [],
  )

  const handleCollectionDragEnd = useCallback(
    (collection: SortableCollectionKey, event: { active: { id: string | number }; over: { id: string | number } | null }) => {
      const { active, over } = event

      if (!resumeDraft || !over || active.id === over.id) {
        return
      }

      const collectionIds = sortableCollections[collection]
      const fromIndex = collectionIds.indexOf(String(active.id))
      const toIndex = collectionIds.indexOf(String(over.id))

      if (fromIndex === -1 || toIndex === -1 || fromIndex === toIndex) {
        return
      }

      updateSortableCollection(collection, (currentIds) =>
        arrayMove(currentIds, fromIndex, toIndex),
      )

      updateResumeDraft(
        (draft) => {
          const nextDraft = reorderResumeCollection(draft, collection, fromIndex, toIndex)

          draft.meta = nextDraft.meta
          draft.profile = nextDraft.profile
          draft.education = nextDraft.education
          draft.experiences = nextDraft.experiences
          draft.projects = nextDraft.projects
          draft.skills = nextDraft.skills
          draft.highlights = nextDraft.highlights
        },
        {
          syncDraftFields: collectionNeedsDraftFieldSync(collection),
        },
      )
    },
    [resumeDraft, sortableCollections, updateResumeDraft, updateSortableCollection],
  )

  useEffect(() => {
    if (!canEdit) {
      return
    }

    setStatus('loading')
    setErrorMessage(null)
    setFeedbackMessage(null)

    loadDraft({
      apiBaseUrl,
      accessToken,
    })
      .then((snapshot) => {
        hydrateDraft(snapshot)
      })
      .catch((error) => {
        setErrorMessage(
          error instanceof Error ? error.message : '草稿读取失败，请稍后重试',
        )
        setStatus('error')
      })
  }, [accessToken, apiBaseUrl, canEdit, hydrateDraft, loadDraft])

  const lastUpdatedLabel = useMemo(() => {
    if (!draftSnapshot) {
      return null
    }

    return formatIsoDateTime(draftSnapshot.updatedAt)
  }, [draftSnapshot])

  const isTranslationMode = editorLocaleMode === 'en'

  return {
    draftFieldValues,
    draftSnapshot,
    editorLocaleMode,
    errorMessage,
    feedbackMessage,
    handleCollectionDragEnd,
    hydrateDraft,
    isTranslationMode,
    lastUpdatedLabel,
    nextSortableId,
    pendingSave,
    replaceSortableCollections,
    resumeDraft,
    sensors,
    setDraftFieldValues,
    setEditorLocaleMode,
    setErrorMessage,
    setFeedbackMessage,
    setPendingSave,
    sortableCollections,
    status,
    updateResumeDraft,
    updateSortableCollection,
  }
}
