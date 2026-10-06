import { createFetchDraftResumeMethod } from '@my-resume/api-client'

import { tokenStorage } from '@shared/lib/auth/token-storage'
import { apiBaseUrl } from '@shared/lib/http/api-base'

/**
 * 构造简历草稿快照请求 Method（示例数据链路）。
 * 返回 alova Method，由 hooks 的 useRequest 消费；数据请求集中在 apis/。
 */
export function getDraftResume() {
  const accessToken = tokenStorage.get()
  if (!accessToken) {
    throw new Error('未登录：缺少访问令牌')
  }
  return createFetchDraftResumeMethod({ apiBaseUrl, accessToken })
}
