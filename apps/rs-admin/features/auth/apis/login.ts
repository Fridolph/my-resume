import { createLoginWithPasswordMethod } from '@my-resume/api-client'

import { apiBaseUrl } from '@shared/lib/http/api-base'

/** 账号密码登录（返回 alova Method）。 */
export function loginWithPassword(username: string, password: string) {
  return createLoginWithPasswordMethod({ apiBaseUrl, username, password })
}
