import { defaultApiClient as Alova } from './client'
import type {
  AuthenticatedResumeRequestInput,
  AuthenticatedResumeSummaryRequestInput,
  ResumeDraftSnapshot,
  ResumeDraftSummarySnapshot,
  ResumeExportFormat,
  ResumeLocale,
  ResumePublishedSnapshot,
  ResumePublishedSummarySnapshot,
  ResumeRequestInput,
  ResumeSummaryRequestInput,
  UpdateResumeDraftInput,
} from './types/resume.types'

export type {
  AuthenticatedResumeRequestInput,
  AuthenticatedResumeSummaryRequestInput,
  LocalizedText,
  ResumeDraftSnapshot,
  ResumeDraftSummarySnapshot,
  ResumeEducationItem,
  ResumeExperienceItem,
  ResumeExportFormat,
  ResumeHighlightItem,
  ResumeLocale,
  ResumeMeta,
  ResumeProfile,
  ResumeProfileHero,
  ResumeProfileInterestItem,
  ResumeProfileLink,
  ResumeProjectItem,
  ResumePublishedSnapshot,
  ResumePublishedSummarySnapshot,
  ResumeRequestInput,
  ResumeSkillGroup,
  ResumeSnapshot,
  ResumeSnapshotStatus,
  ResumeSummary,
  ResumeSummaryCounts,
  ResumeSummaryMeta,
  ResumeSummaryProfile,
  ResumeSummaryRequestInput,
  StandardResume,
  UpdateResumeDraftInput,
} from './types/resume.types'

function joinApiUrl(apiBaseUrl: string, pathname: string): string {
  return `${apiBaseUrl.replace(/\/$/, '')}${pathname}`
}

/**
 * 构造公开简历导出地址
 *
 * @param input 导出参数
 * @returns 导出下载链接
 */
export function buildPublishedResumeExportUrl(input: {
  apiBaseUrl: string
  format: ResumeExportFormat
  locale: ResumeLocale
}): string {
  return `${joinApiUrl(input.apiBaseUrl, '/resume/published/export/')}${input.format}?locale=${input.locale}`
}

/**
 * 构造读取已发布简历快照 Method
 *
 * @param input 请求参数
 * @returns 已发布快照请求 Method
 */
export function createFetchPublishedResumeMethod(input: ResumeRequestInput) {
  return Alova.createMethod<ResumePublishedSnapshot | null>({
    apiBaseUrl: input.apiBaseUrl,
    pathname: '/resume/published',
    requestInit: {
      cache: 'no-store',
    },
    fallbackErrorMessage: '公开简历读取失败',
    returnNullOnNotFound: true,
    requestPolicy: input.requestPolicy,
  })
}

/**
 * 读取已发布简历快照
 *
 * @param input 请求参数
 * @returns 已发布快照或 null
 */
export async function fetchPublishedResume(
  input: ResumeRequestInput,
): Promise<ResumePublishedSnapshot | null> {
  return Alova.send(createFetchPublishedResumeMethod(input), {
    method: 'GET',
    fallbackErrorMessage: '公开简历读取失败',
    requestPolicy: input.requestPolicy,
  })
}

/**
 * 构造读取草稿快照 Method
 *
 * @param input 请求参数
 * @returns 草稿快照请求 Method
 */
export function createFetchDraftResumeMethod(input: AuthenticatedResumeRequestInput) {
  return Alova.createMethod<ResumeDraftSnapshot>({
    apiBaseUrl: input.apiBaseUrl,
    pathname: '/resume/draft',
    accessToken: input.accessToken,
    fallbackErrorMessage: '草稿读取失败，请确认当前账号拥有编辑权限',
    requestPolicy: input.requestPolicy,
  })
}

/**
 * 读取草稿快照
 *
 * @param input 请求参数
 * @returns 草稿快照
 */
export async function fetchDraftResume(
  input: AuthenticatedResumeRequestInput,
): Promise<ResumeDraftSnapshot> {
  return Alova.send(createFetchDraftResumeMethod(input), {
    method: 'GET',
    fallbackErrorMessage: '草稿读取失败，请确认当前账号拥有编辑权限',
    requestPolicy: input.requestPolicy,
  })
}

/**
 * 构造读取草稿摘要 Method
 *
 * @param input 请求参数
 * @returns 草稿摘要请求 Method
 */
export function createFetchDraftResumeSummaryMethod(
  input: AuthenticatedResumeSummaryRequestInput,
) {
  return Alova.createMethod<ResumeDraftSummarySnapshot>({
    apiBaseUrl: input.apiBaseUrl,
    pathname: '/resume/draft/summary',
    query: input.locale
      ? {
          locale: input.locale,
        }
      : undefined,
    accessToken: input.accessToken,
    fallbackErrorMessage: '草稿摘要读取失败，请确认当前账号拥有编辑权限',
    requestPolicy: input.requestPolicy,
  })
}

/**
 * 读取草稿摘要
 *
 * @param input 请求参数
 * @returns 草稿摘要快照
 */
export async function fetchDraftResumeSummary(
  input: AuthenticatedResumeSummaryRequestInput,
): Promise<ResumeDraftSummarySnapshot> {
  return Alova.send(createFetchDraftResumeSummaryMethod(input), {
    method: 'GET',
    fallbackErrorMessage: '草稿摘要读取失败，请确认当前账号拥有编辑权限',
    requestPolicy: input.requestPolicy,
  })
}

/**
 * 构造更新草稿 Method
 *
 * @param input 请求参数
 * @returns 更新草稿请求 Method
 */
export function createUpdateDraftResumeMethod(input: UpdateResumeDraftInput) {
  return Alova.createMethod<ResumeDraftSnapshot>({
    apiBaseUrl: input.apiBaseUrl,
    pathname: '/resume/draft',
    method: 'PUT',
    accessToken: input.accessToken,
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(input.resume),
    fallbackErrorMessage: '草稿保存失败，请检查内容是否符合当前模型',
    requestPolicy: input.requestPolicy,
  })
}

/**
 * 更新草稿
 *
 * @param input 请求参数
 * @returns 更新后的草稿快照
 */
export async function updateDraftResume(
  input: UpdateResumeDraftInput,
): Promise<ResumeDraftSnapshot> {
  return Alova.send(createUpdateDraftResumeMethod(input), {
    method: 'PUT',
    fallbackErrorMessage: '草稿保存失败，请检查内容是否符合当前模型',
    requestPolicy: input.requestPolicy,
  })
}

/**
 * 构造发布当前草稿 Method
 *
 * @param input 请求参数
 * @returns 发布请求 Method
 */
export function createPublishResumeMethod(input: AuthenticatedResumeRequestInput) {
  return Alova.createMethod<ResumePublishedSnapshot>({
    apiBaseUrl: input.apiBaseUrl,
    pathname: '/resume/publish',
    method: 'POST',
    accessToken: input.accessToken,
    fallbackErrorMessage: '发布失败，请确认当前账号拥有发布权限',
    requestPolicy: input.requestPolicy,
  })
}

/**
 * 发布当前草稿
 *
 * @param input 请求参数
 * @returns 已发布快照
 */
export async function publishResume(
  input: AuthenticatedResumeRequestInput,
): Promise<ResumePublishedSnapshot> {
  return Alova.send(createPublishResumeMethod(input), {
    method: 'POST',
    fallbackErrorMessage: '发布失败，请确认当前账号拥有发布权限',
    requestPolicy: input.requestPolicy,
  })
}

/**
 * 构造读取已发布摘要 Method
 *
 * @param input 请求参数
 * @returns 发布摘要请求 Method
 */
export function createFetchPublishedResumeSummaryMethod(input: ResumeSummaryRequestInput) {
  return Alova.createMethod<ResumePublishedSummarySnapshot | null>({
    apiBaseUrl: input.apiBaseUrl,
    pathname: '/resume/published/summary',
    query: input.locale
      ? {
          locale: input.locale,
        }
      : undefined,
    requestInit: {
      cache: 'no-store',
    },
    fallbackErrorMessage: '公开简历摘要读取失败',
    returnNullOnNotFound: true,
    requestPolicy: input.requestPolicy,
  })
}

/**
 * 读取已发布摘要
 *
 * @param input 请求参数
 * @returns 发布摘要快照或 null
 */
export async function fetchPublishedResumeSummary(
  input: ResumeSummaryRequestInput,
): Promise<ResumePublishedSummarySnapshot | null> {
  return Alova.send(createFetchPublishedResumeSummaryMethod(input), {
    method: 'GET',
    fallbackErrorMessage: '公开简历摘要读取失败',
    requestPolicy: input.requestPolicy,
  })
}
