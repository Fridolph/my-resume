'use client'

import { clearCurrentUserSessionCache } from './admin-session-store'
import {
  fetchCachedAiWorkbenchReport,
  fetchCachedAiWorkbenchReports,
  fetchAiWorkbenchRuntime,
} from '../modules/ai/services/ai-workbench-api'
import type {
  AiWorkbenchCachedReportSummary,
  AiWorkbenchReport,
  AiWorkbenchRuntimeSummary,
} from '../modules/ai/types/ai-workbench.types'
import {
  fetchDraftResume,
  fetchDraftResumeSummary,
  fetchPublishedResumeSummary,
} from '../modules/resume/services/resume-draft-api'
import type {
  ResumeDraftSnapshot,
  ResumeLocale,
  ResumeDraftSummarySnapshot,
  ResumePublishedSummarySnapshot,
} from '../modules/resume/types/resume.types'

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

/**
 * 统一复用资源请求中的 promise / value，避免后台多个模块并发请求同一资源
 *
 * @param cache 对应资源的缓存 Map
 * @param key 当前请求的缓存键
 * @param loader 实际发起请求的加载函数
 * @returns 资源读取结果
 */
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

/**
 * 读取 AI 工作台运行时摘要，并按当前用户会话维度缓存
 *
 * @param input 读取 AI runtime 所需的会话参数
 * @returns AI 工作台运行时摘要
 */
export async function ensureAiRuntimeSummary(input: {
  accessToken: string
  apiBaseUrl: string
}) {
  const cacheKey = createBaseKey(input.apiBaseUrl, input.accessToken)

  return ensureCachedValue(aiRuntimeCache, cacheKey, () => fetchAiWorkbenchRuntime(input))
}

/**
 * 读取简历草稿快照，作为后台编辑器的远端基线
 *
 * @param input 读取草稿所需的会话参数
 * @returns 当前标准简历草稿快照
 */
export async function ensureDraftResume(input: {
  accessToken: string
  apiBaseUrl: string
}) {
  const cacheKey = createBaseKey(input.apiBaseUrl, input.accessToken)

  return ensureCachedValue(draftResumeCache, cacheKey, () => fetchDraftResume(input))
}

/**
 * 按 locale 读取草稿摘要，供后台概览和对照区域复用
 *
 * @param input 读取草稿摘要所需的会话参数
 * @returns 草稿摘要快照
 */
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

/**
 * 读取公开态摘要，用于后台对照当前草稿和最近发布版本
 *
 * @param input 读取发布摘要所需的会话参数
 * @returns 发布态摘要快照
 */
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

/**
 * 读取 AI 工作台缓存报告列表，供后台列表区复用
 *
 * @param input 读取缓存报告列表所需的会话参数
 * @returns AI 缓存报告列表
 */
export async function ensureCachedAiWorkbenchReports(input: {
  accessToken: string
  apiBaseUrl: string
}) {
  const cacheKey = createBaseKey(input.apiBaseUrl, input.accessToken)

  return ensureCachedValue(cachedAiReportsCache, cacheKey, () =>
    fetchCachedAiWorkbenchReports(input),
  )
}

/**
 * 读取单份 AI 缓存报告详情，并按报告 ID 缓存
 *
 * @param input 读取缓存报告详情所需的会话参数和报告 ID
 * @returns AI 缓存报告详情
 */
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

/**
 * 草稿保存后主动失效相关缓存，确保后续读取拿到最新快照
 *
 * @param input 当前会话和 API 地址
 * @returns 无返回值
 */
export function invalidateDraftResumeResources(input: {
  accessToken: string
  apiBaseUrl: string
}) {
  const baseKey = createBaseKey(input.apiBaseUrl, input.accessToken)

  draftResumeCache.delete(baseKey)
  invalidateCacheByBaseKey(draftResumeSummaryCache, baseKey)
}

/**
 * 发布后失效公开态摘要缓存，保证后台对照区读取最新发布结果
 *
 * @param input 当前会话和 API 地址
 * @returns 无返回值
 */
export function invalidatePublishedResumeSummaryResource(input: {
  accessToken: string
  apiBaseUrl: string
}) {
  invalidateCacheByBaseKey(
    publishedResumeSummaryCache,
    createBaseKey(input.apiBaseUrl, input.accessToken),
  )
}

/**
 * 在运行时摘要变更后失效对应缓存
 *
 * @param input 当前会话和 API 地址
 * @returns 无返回值
 */
export function invalidateAiRuntimeResource(input: {
  accessToken: string
  apiBaseUrl: string
}) {
  aiRuntimeCache.delete(createBaseKey(input.apiBaseUrl, input.accessToken))
}

/**
 * 清空后台资源缓存，避免不同账号或不同会话之间串数据
 *
 * @param input 可选的当前会话范围；缺省时清空全部缓存
 * @returns 无返回值
 */
export function clearAdminResourceStore(input?: {
  accessToken?: string | null
  apiBaseUrl?: string
}) {
  // 登出或切用户时要把资源缓存一起清空，避免不同会话串数据
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

/**
 * 重置后台资源缓存
 */
export function resetAdminResourceStore() {
  clearAdminResourceStore()
}
