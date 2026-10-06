'use client'

import { useRequest } from 'alova/client'

import { getDraftResume } from '../apis/get-draft-resume'

/**
 * 简历草稿数据 hook（示例）。
 * 暴露 alova useRequest 的 { data, loading, error, send }。
 */
export function useDraftResume() {
  return useRequest(getDraftResume)
}
