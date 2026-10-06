import { createFetchCurrentUserMethod } from '@my-resume/api-client'

import { apiBaseUrl } from '@shared/lib/http/api-base'

/** 用令牌校验并获取当前用户（返回 alova Method）。 */
export function fetchCurrentUser(accessToken: string) {
  return createFetchCurrentUserMethod({ apiBaseUrl, accessToken })
}
