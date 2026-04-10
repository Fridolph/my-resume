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

/**
 * 维护简历草稿编辑器的核心运行时状态，包括工作副本、排序态与提交反馈
 *
 * @param accessToken 当前登录会话的访问令牌
 * @param apiBaseUrl 当前后台访问的 API 基地址
 * @param canEdit 当前角色是否具备草稿编辑权限
 * @param loadDraft 草稿加载函数
 * @returns 编辑器状态与动作集合
 */
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

/**
 * 根据最新简历结构重建拖拽排序所需的前端 ID 序列
 *
 * @param nextResume 最新的简历工作副本
 * @returns 无返回值
 */
const replaceSortableCollections = useCallback(
    (nextResume: StandardResume) => {
      setSortableCollections(buildSortableCollectionState(nextResume, nextSortableId))
    },
    [nextSortableId],
  )

/**
 * 用服务端草稿快照重置编辑器基线，同时刷新工作副本、字符串表单态和排序态
 *
 * @param snapshot 最新的草稿快照
 * @returns 无返回值
 */
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

/**
 * 更新某个拖拽集合的前端排序 ID 映射
 *
 * @param collection 当前操作的集合类型
 * @param updater 生成下一组排序 ID 的更新函数
 * @returns 无返回值
 */
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

/**
 * 更新当前简历工作副本，并在必要时同步字符串输入缓存层
 *
 * @param mutator 对简历工作副本的变更函数
 * @param options 额外的同步选项
 * @returns 无返回值
 */
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

      // 某些数组字段会额外投影成字符串输入态，必要时同步刷新这层缓存
      if (options?.syncDraftFields && nextDraftForDraftFields) {
        setDraftFieldValues(buildDraftFieldValues(nextDraftForDraftFields))
      }
    },
    [],
  )

/**
 * 处理拖拽排序：先更新前端排序 ID，再同步重排真实简历数组
 *
 * @param collection 当前拖拽的集合类型
 * @param event dnd-kit 返回的拖拽结束事件
 * @returns 无返回值
 */
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
          // sortable ID 只是交互层映射，真正变化的是业务数组顺序
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

    // 编辑器初始化时先读取一次远端草稿，再在浏览器里维护工作副本
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
