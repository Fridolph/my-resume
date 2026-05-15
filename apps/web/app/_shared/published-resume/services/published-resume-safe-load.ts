import type { ResumePublishedSnapshot } from '../types/published-resume.types'
import { createFetchPublishedResumeMethod } from './published-resume-api'

export type SafePublishedResumeLoadResult =
  | {
      status: 'ok'
      initialLoadError: null
      publishedResume: ResumePublishedSnapshot
    }
  | {
      status: 'empty'
      initialLoadError: null
      publishedResume: null
    }
  | {
      status: 'unavailable'
      initialLoadError: string
      publishedResume: null
    }

function normalizePublishedResumeLoadError(error: unknown): string {
  if (error instanceof Error && error.message.trim()) {
    return error.message
  }

  return 'Published resume service is temporarily unavailable.'
}

export async function loadPublishedResumeSafely(input: {
  apiBaseUrl: string
}): Promise<SafePublishedResumeLoadResult> {
  try {
    const publishedResume = await createFetchPublishedResumeMethod({
      apiBaseUrl: input.apiBaseUrl,
    })

    if (!publishedResume) {
      return {
        status: 'empty',
        initialLoadError: null,
        publishedResume: null,
      }
    }

    return {
      status: 'ok',
      initialLoadError: null,
      publishedResume,
    }
  } catch (error) {
    return {
      status: 'unavailable',
      initialLoadError: normalizePublishedResumeLoadError(error),
      publishedResume: null,
    }
  }
}
