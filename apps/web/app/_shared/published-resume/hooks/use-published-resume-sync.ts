'use client'

import { useRequest } from 'alova/client'
import { useEffect, useRef, useState } from 'react'

import type { ResumePublishedSnapshot } from '../types/published-resume.types'
import { createFetchPublishedResumeMethod } from '../services/published-resume-api'

/**
 * 公开简历同步状态
 */
export type PublishedResumeSyncState = 'idle' | 'syncing' | 'error'

interface UsePublishedResumeSyncInput {
  apiBaseUrl: string
  createSyncPublishedResumeMethod?: typeof createFetchPublishedResumeMethod
  enableClientSync: boolean
  publishedResume: ResumePublishedSnapshot | null
}

type IdleWindow = Window & {
  cancelIdleCallback?: (handle: number) => void
  requestIdleCallback?: (callback: () => void) => number
}

/**
 * 选择可用于页面渲染的最新发布快照
 *
 * @param currentSnapshot 当前快照
 * @param nextSnapshot 新快照
 * @returns 更新后的快照
 */
function pickLatestPublishedSnapshot(
  currentSnapshot: ResumePublishedSnapshot | null,
  nextSnapshot: ResumePublishedSnapshot | null,
): ResumePublishedSnapshot | null {
  if (!nextSnapshot) {
    return currentSnapshot
  }

  if (!currentSnapshot) {
    return nextSnapshot
  }

  const currentPublishedAt = Date.parse(currentSnapshot.publishedAt)
  const nextPublishedAt = Date.parse(nextSnapshot.publishedAt)

  // 解析失败时优先采用新快照，避免卡在旧数据
  if (Number.isNaN(currentPublishedAt) || Number.isNaN(nextPublishedAt)) {
    return nextSnapshot
  }

  // 只前进不回退，防止接口抖动导致页面闪回旧版本
  return nextPublishedAt > currentPublishedAt ? nextSnapshot : currentSnapshot
}

/**
 * 在保留 SSR 首屏数据的前提下，客户端挂载后校准最新发布快照
 *
 * @param input 同步参数
 * @returns 当前快照与同步状态
 */
export function usePublishedResumeSync({
  apiBaseUrl,
  createSyncPublishedResumeMethod = createFetchPublishedResumeMethod,
  enableClientSync,
  publishedResume,
}: UsePublishedResumeSyncInput) {
  const [currentPublishedResume, setCurrentPublishedResume] = useState(publishedResume)
  const [syncState, setSyncState] = useState<PublishedResumeSyncState>('idle')
  const [syncMessage, setSyncMessage] = useState<string | null>(null)
  const { send: syncPublishedResume } = useRequest(
    () =>
      createSyncPublishedResumeMethod({
        apiBaseUrl,
      }),
    {
      force: true,
      immediate: false,
      initialData: publishedResume ?? undefined,
    },
  )
  const syncPublishedResumeRef = useRef(syncPublishedResume)
  const syncRequestKeyRef = useRef<string | null>(null)
  const syncRequestKey = enableClientSync
    ? `${apiBaseUrl}:${publishedResume?.publishedAt ?? 'empty'}`
    : null

  useEffect(() => {
    syncPublishedResumeRef.current = syncPublishedResume
  }, [syncPublishedResume])

  useEffect(() => {
    setCurrentPublishedResume(publishedResume)
    setSyncMessage(null)
    setSyncState('idle')
  }, [publishedResume])

  useEffect(() => {
    if (!syncRequestKey) {
      syncRequestKeyRef.current = null
      return
    }

    if (syncRequestKeyRef.current === syncRequestKey) {
      return
    }

    syncRequestKeyRef.current = syncRequestKey
    let cancelled = false
    setSyncMessage(null)
    const hasRenderableSnapshot = Boolean(publishedResume)
    const idleWindow =
      typeof window !== 'undefined' ? (window as IdleWindow) : null
    let timeoutId: number | null = null
    let idleId: number | null = null

    if (!hasRenderableSnapshot) {
      setSyncState('syncing')
    }

    const runSync = () => {
      if (cancelled) {
        return
      }

      void syncPublishedResumeRef.current()
        .then((nextSnapshot: ResumePublishedSnapshot | null) => {
          if (cancelled) {
            return
          }

          setCurrentPublishedResume((currentSnapshot) =>
            pickLatestPublishedSnapshot(currentSnapshot, nextSnapshot),
          )
          setSyncState('idle')
        })
        .catch((error: unknown) => {
          if (cancelled) {
            return
          }

          setSyncState('error')
          setSyncMessage(error instanceof Error ? error.message : '公开简历同步失败')
        })
    }

    if (idleWindow && typeof idleWindow.requestIdleCallback === 'function') {
      idleId = idleWindow.requestIdleCallback(runSync)
    } else if (typeof window !== 'undefined') {
      timeoutId = window.setTimeout(runSync, 0)
    } else {
      runSync()
    }

    return () => {
      cancelled = true

      if (idleWindow && idleId !== null && typeof idleWindow.cancelIdleCallback === 'function') {
        idleWindow.cancelIdleCallback(idleId)
      }

      if (timeoutId !== null && typeof window !== 'undefined') {
        window.clearTimeout(timeoutId)
      }
    }
  }, [publishedResume, syncRequestKey])

  return {
    currentPublishedResume,
    syncState,
    syncMessage,
  }
}
