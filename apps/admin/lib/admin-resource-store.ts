'use client'

import { clearCurrentUserSessionCache } from './admin-session-store'
import {
  fetchCachedAiWorkbenchReport,
  fetchCachedAiWorkbenchReports,
  fetchAiWorkbenchRuntime,
} from './ai-workbench-api'
import type {
  AiWorkbenchCachedReportSummary,
  AiWorkbenchReport,
  AiWorkbenchRuntimeSummary,
} from './ai-workbench-types'
import {
  fetchDraftResume,
  fetchDraftResumeSummary,
  fetchPublishedResumeSummary,
} from './resume-draft-api'
import type {
  ResumeDraftSnapshot,
  ResumeLocale,
  ResumeDraftSummarySnapshot,
  ResumePublishedSummarySnapshot,
} from './resume-types'

interface ResourceCacheEntry<T> {
  promise?: Promise<T>
  value?: T
}

const aiRuntimeCache = new Map<string, ResourceCacheEntry<AiWorkbenchRuntimeSummary>>()
const draftResumeCache = new Map<string, ResourceCacheEntry<ResumeDraftSnapshot>>()
const draftResumeSummaryCache = new Map<
  string,
  ResourceCacheEntry<ResumeDraftSummarySnapshot>
>()
const publishedResumeSummaryCache = new Map<
  string,
  ResourceCacheEntry<ResumePublishedSummarySnapshot | null>
>()
const cachedAiReportsCache = new Map<
  string,
  ResourceCacheEntry<AiWorkbenchCachedReportSummary[]>
>()
const cachedAiReportDetailCache = new Map<string, ResourceCacheEntry<AiWorkbenchReport>>()

function createBaseKey(apiBaseUrl: string, accessToken: string) {
  return `${apiBaseUrl.replace(/\/$/, '')}::${accessToken}`
}

function createDetailKey(apiBaseUrl: string, accessToken: string, detailKey: string) {
  return `${createBaseKey(apiBaseUrl, accessToken)}::${detailKey}`
}

function createLocaleKey(apiBaseUrl: string, accessToken: string, locale?: ResumeLocale) {
  return createDetailKey(apiBaseUrl, accessToken, `locale:${locale ?? 'default'}`)
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
      cache.set(key, {
        value,
      })

      return value
    })
    .catch((error) => {
      cache.delete(key)
      throw error
    })

  cache.set(key, {
    promise: nextPromise,
  })

  return nextPromise
}

function invalidateCacheByBaseKey<T>(
  cache: Map<string, ResourceCacheEntry<T>>,
  baseKey: string,
) {
  for (const key of cache.keys()) {
    if (key === baseKey || key.startsWith(`${baseKey}::`)) {
      cache.delete(key)
    }
  }
}

export async function ensureAiRuntimeSummary(input: {
  accessToken: string
  apiBaseUrl: string
}) {
  const cacheKey = createBaseKey(input.apiBaseUrl, input.accessToken)

  return ensureCachedValue(aiRuntimeCache, cacheKey, () => fetchAiWorkbenchRuntime(input))
}

export async function ensureDraftResume(input: {
  accessToken: string
  apiBaseUrl: string
}) {
  const cacheKey = createBaseKey(input.apiBaseUrl, input.accessToken)

  return ensureCachedValue(draftResumeCache, cacheKey, () => fetchDraftResume(input))
}

export async function ensureDraftResumeSummary(input: {
  accessToken: string
  apiBaseUrl: string
  locale?: ResumeLocale
}) {
  const cacheKey = createLocaleKey(input.apiBaseUrl, input.accessToken, input.locale)

  return ensureCachedValue(draftResumeSummaryCache, cacheKey, () =>
    fetchDraftResumeSummary(input),
  )
}

export async function ensurePublishedResumeSummary(input: {
  accessToken: string
  apiBaseUrl: string
  locale?: ResumeLocale
}) {
  const cacheKey = createLocaleKey(input.apiBaseUrl, input.accessToken, input.locale)

  return ensureCachedValue(publishedResumeSummaryCache, cacheKey, () =>
    fetchPublishedResumeSummary({
      apiBaseUrl: input.apiBaseUrl,
      locale: input.locale,
    }),
  )
}

export async function ensureCachedAiWorkbenchReports(input: {
  accessToken: string
  apiBaseUrl: string
}) {
  const cacheKey = createBaseKey(input.apiBaseUrl, input.accessToken)

  return ensureCachedValue(cachedAiReportsCache, cacheKey, () =>
    fetchCachedAiWorkbenchReports(input),
  )
}

export async function ensureCachedAiWorkbenchReport(input: {
  accessToken: string
  apiBaseUrl: string
  reportId: string
}) {
  const cacheKey = createDetailKey(
    input.apiBaseUrl,
    input.accessToken,
    `report:${input.reportId}`,
  )

  return ensureCachedValue(cachedAiReportDetailCache, cacheKey, () =>
    fetchCachedAiWorkbenchReport(input),
  )
}

export function invalidateDraftResumeResources(input: {
  accessToken: string
  apiBaseUrl: string
}) {
  const baseKey = createBaseKey(input.apiBaseUrl, input.accessToken)

  draftResumeCache.delete(baseKey)
  invalidateCacheByBaseKey(draftResumeSummaryCache, baseKey)
}

export function invalidatePublishedResumeSummaryResource(input: {
  accessToken: string
  apiBaseUrl: string
}) {
  invalidateCacheByBaseKey(
    publishedResumeSummaryCache,
    createBaseKey(input.apiBaseUrl, input.accessToken),
  )
}

export function invalidateAiRuntimeResource(input: {
  accessToken: string
  apiBaseUrl: string
}) {
  aiRuntimeCache.delete(createBaseKey(input.apiBaseUrl, input.accessToken))
}

export function clearAdminResourceStore(input?: {
  accessToken?: string | null
  apiBaseUrl?: string
}) {
  clearCurrentUserSessionCache(input)

  if (!input?.accessToken || !input.apiBaseUrl) {
    aiRuntimeCache.clear()
    draftResumeCache.clear()
    draftResumeSummaryCache.clear()
    publishedResumeSummaryCache.clear()
    cachedAiReportsCache.clear()
    cachedAiReportDetailCache.clear()
    return
  }

  const baseKey = createBaseKey(input.apiBaseUrl, input.accessToken)

  aiRuntimeCache.delete(baseKey)
  draftResumeCache.delete(baseKey)
  invalidateCacheByBaseKey(draftResumeSummaryCache, baseKey)
  invalidateCacheByBaseKey(publishedResumeSummaryCache, baseKey)
  cachedAiReportsCache.delete(baseKey)
  invalidateCacheByBaseKey(cachedAiReportDetailCache, baseKey)
}

export function resetAdminResourceStore() {
  clearAdminResourceStore()
}
