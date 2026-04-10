'use client'

import { useEffect, useState } from 'react'

import type { ResumePublishedSnapshot } from '../types/published-resume.types'
import { fetchPublishedResume } from '../services/published-resume-api'

/**
 * 公开简历同步状态
 */
export type PublishedResumeSyncState = 'idle' | 'syncing' | 'error'

interface UsePublishedResumeSyncInput {
  apiBaseUrl: string
  enableClientSync: boolean
  publishedResume: ResumePublishedSnapshot | null
  syncPublishedResume?: typeof fetchPublishedResume
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
  enableClientSync,
  publishedResume,
  syncPublishedResume = fetchPublishedResume,
}: UsePublishedResumeSyncInput) {
  const [currentPublishedResume, setCurrentPublishedResume] = useState(publishedResume)
  const [syncState, setSyncState] = useState<PublishedResumeSyncState>('idle')
  const [syncMessage, setSyncMessage] = useState<string | null>(null)

  useEffect(() => {
    setCurrentPublishedResume(publishedResume)
  }, [publishedResume])

  useEffect(() => {
    if (!enableClientSync) {
      return
    }

    let cancelled = false
    setSyncState('syncing')
    setSyncMessage(null)

    syncPublishedResume({
      apiBaseUrl,
    })
      .then((nextSnapshot) => {
        if (cancelled) {
          return
        }

        setCurrentPublishedResume((currentSnapshot) =>
          pickLatestPublishedSnapshot(currentSnapshot, nextSnapshot),
        )
        setSyncState('idle')
      })
      .catch((error) => {
        if (cancelled) {
          return
        }

        setSyncState('error')
        setSyncMessage(error instanceof Error ? error.message : '公开简历同步失败')
      })

    return () => {
      cancelled = true
    }
  }, [apiBaseUrl, enableClientSync, syncPublishedResume])

  return {
    currentPublishedResume,
    syncState,
    syncMessage,
  }
}

