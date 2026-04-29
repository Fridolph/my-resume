import { appendFileSync, mkdirSync } from 'node:fs'
import { join, resolve } from 'node:path'

import type { ResumeImportModuleStats } from '../types/resume-import.types'

export type ResumeImportAiLogStage =
  | 'accepted'
  | 'extracting'
  | 'text_validating'
  | 'raw_archiving'
  | 'format_normalizing'
  | 'safety_filtering'
  | 'ai_generating'
  | 'json_parsing'
  | 'schema_validating'
  | 'diff_building'
  | 'completed'
  | 'failed'

export interface ResumeImportAiLogEntry {
  charCount?: number
  durationMs?: number
  error?: string
  fallbackUsed?: boolean
  jobId: string
  langChainSucceeded?: boolean
  method?: 'functionCalling' | 'jsonMode'
  model?: string
  moduleStats?: ResumeImportModuleStats
  promptCharCount?: number
  provider?: string
  rawOutput?: unknown
  sourceHash?: string
  stage: ResumeImportAiLogStage
  stepSummary?: string
  traceId?: string
  warnings?: string[]
}

function findRepoRoot(startDirectory: string): string {
  let directory = resolve(startDirectory)

  for (let index = 0; index < 6; index += 1) {
    if (directory.endsWith('my-resume')) {
      return directory
    }

    const parent = resolve(directory, '..')

    if (parent === directory) {
      return startDirectory
    }

    directory = parent
  }

  return startDirectory
}

function resolveLogDirectory(): string {
  return (
    process.env.AI_RESUME_IMPORT_LOG_DIR?.trim() ||
    join(findRepoRoot(process.cwd()), 'logs', 'ai-server')
  )
}

function shouldLogRawOutput(): boolean {
  const value = process.env.AI_RESUME_IMPORT_LOG_RAW?.trim().toLowerCase()

  if (value) {
    return ['1', 'true', 'yes', 'on'].includes(value)
  }

  return process.env.NODE_ENV !== 'production'
}

function todayKey(): string {
  return new Date().toISOString().slice(0, 10)
}

function sanitizeEntry(entry: ResumeImportAiLogEntry) {
  return {
    ...entry,
    rawOutput: shouldLogRawOutput()
      ? entry.rawOutput
      : summarizeRawOutput(entry.rawOutput),
    timestamp: new Date().toISOString(),
  }
}

function summarizeRawOutput(value: unknown): unknown {
  if (typeof value === 'string') {
    const normalized = value.trim()

    if (normalized.length <= 240) {
      return normalized
    }

    return {
      length: normalized.length,
      previewStart: normalized.slice(0, 120),
      previewEnd: normalized.slice(-120),
    }
  }

  if (!value || typeof value !== 'object') {
    return value
  }

  try {
    const json = JSON.stringify(value)

    return {
      length: json.length,
      previewStart: json.slice(0, 120),
      previewEnd: json.slice(-120),
    }
  } catch {
    return '[unserializable]'
  }
}

/** 写入简历导入 AI 专用 NDJSON 诊断日志。 */
export function writeResumeImportAiLog(entry: ResumeImportAiLogEntry) {
  const directory = resolveLogDirectory()
  const filePath = join(directory, `${todayKey()}.resume-import.ndjson`)
  const sanitizedEntry = sanitizeEntry(entry)

  mkdirSync(directory, { recursive: true })
  appendFileSync(filePath, `${JSON.stringify(sanitizedEntry)}\n`, 'utf8')

  if (process.env.NODE_ENV !== 'test') {
    console.info('[ai-server][resume-import]', {
      durationMs: sanitizedEntry.durationMs,
      error: sanitizedEntry.error,
      jobId: sanitizedEntry.jobId,
      model: sanitizedEntry.model,
      moduleStats: sanitizedEntry.moduleStats,
      provider: sanitizedEntry.provider,
      stage: sanitizedEntry.stage,
      stepSummary: sanitizedEntry.stepSummary,
      traceId: sanitizedEntry.traceId,
    })
  }
}
