import { createAlova } from 'alova'
import adapterFetch from 'alova/fetch'
import reactHook from 'alova/react'

import { tokenStorage } from '@shared/lib/auth/token-storage'

import { apiBaseUrl } from './api-base'

/**
 * 全局 alova 实例（plugins 层）。
 *
 * 用途：需要直接发起、且不走 @my-resume/api-client 工厂的场景（如后续自定义请求）。
 * 数据层默认仍优先复用 api-client 的工厂函数（见 shared/lib/http/README）。
 *
 * 统一 baseURL + 鉴权头注入，避免 token 散落。
 */
export const alovaInstance = createAlova({
  baseURL: apiBaseUrl,
  statesHook: reactHook,
  requestAdapter: adapterFetch(),
  cacheFor: null,
  beforeRequest(method) {
    const token = tokenStorage.get()
    if (token) {
      method.config.headers = {
        ...method.config.headers,
        Authorization: `Bearer ${token}`,
      }
    }
  },
  responded: {
    onSuccess: async response => response.json(),
    onError: async error => {
      throw error
    },
  },
})
