'use client'

import type { AuthUserView } from './auth-types'
import { fetchCurrentUser } from './auth-api'

interface ResourceCacheEntry<T> {
  promise?: Promise<T>
  value?: T
}

const currentUserCache = new Map<string, ResourceCacheEntry<AuthUserView>>()

function createBaseKey(apiBaseUrl: string, accessToken: string) {
  return `${apiBaseUrl.replace(/\/$/, '')}::${accessToken}`
}

async function ensureCachedValue<T>(
  cache: Map<string, ResourceCacheEntry<T>>,
  key: string,
  loader: () => Promise<T>,
): Promise<T> {
  const existingEntry = cache.get(key)

  if (existingEntry?.value !== undefined) {
    return existingEntry.value
  }

  if (existingEntry?.promise) {
    return existingEntry.promise
  }

  const nextPromise = loader()
    .then((value) => {
      cache.set(key, { value })
      return value
    })
    .catch((error) => {
      cache.delete(key)
      throw error
    })

  cache.set(key, { promise: nextPromise })

  return nextPromise
}

export function primeCurrentUserSession(input: {
  accessToken: string
  apiBaseUrl: string
  user: AuthUserView
}) {
  currentUserCache.set(createBaseKey(input.apiBaseUrl, input.accessToken), {
    value: input.user,
  })
}

export async function ensureCurrentUserSession(input: {
  accessToken: string
  apiBaseUrl: string
}) {
  const cacheKey = createBaseKey(input.apiBaseUrl, input.accessToken)

  return ensureCachedValue(currentUserCache, cacheKey, () => fetchCurrentUser(input))
}

export function clearCurrentUserSessionCache(input?: {
  accessToken?: string | null
  apiBaseUrl?: string
}) {
  if (!input?.accessToken || !input.apiBaseUrl) {
    currentUserCache.clear()
    return
  }

  currentUserCache.delete(createBaseKey(input.apiBaseUrl, input.accessToken))
}

export function resetAdminSessionStore() {
  clearCurrentUserSessionCache()
}
