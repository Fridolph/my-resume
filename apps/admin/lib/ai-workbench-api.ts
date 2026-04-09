import {
  ApplyAiResumeOptimizationInput,
  ApplyAiResumeOptimizationResult,
  AiResumeOptimizationResult,
  AiWorkbenchCachedReportSummary,
  AiWorkbenchLocale,
  AiWorkbenchReport,
  AiWorkbenchRuntimeSummary,
  AiWorkbenchScenario,
  TriggerAiWorkbenchAnalysisResult,
} from './ai-workbench-types'

interface FetchAiWorkbenchRuntimeInput {
  apiBaseUrl: string
  accessToken: string
}

interface TriggerAiWorkbenchAnalysisInput extends FetchAiWorkbenchRuntimeInput {
  scenario: AiWorkbenchScenario
  content: string
  locale: AiWorkbenchLocale
}

interface GenerateAiResumeOptimizationInput extends FetchAiWorkbenchRuntimeInput {
  instruction: string
  locale: AiWorkbenchLocale
}

function joinApiUrl(apiBaseUrl: string, pathname: string): string {
  return `${apiBaseUrl.replace(/\/$/, '')}${pathname}`
}

export async function fetchAiWorkbenchRuntime(
  input: FetchAiWorkbenchRuntimeInput,
): Promise<AiWorkbenchRuntimeSummary> {
  const response = await fetch(joinApiUrl(input.apiBaseUrl, '/ai/reports/runtime'), {
    headers: {
      Authorization: `Bearer ${input.accessToken}`,
    },
  })

  if (!response.ok) {
    throw new Error('AI 工作台运行时信息加载失败')
  }

  return (await response.json()) as AiWorkbenchRuntimeSummary
}

export async function triggerAiWorkbenchAnalysis(
  input: TriggerAiWorkbenchAnalysisInput,
): Promise<TriggerAiWorkbenchAnalysisResult> {
  const response = await fetch(joinApiUrl(input.apiBaseUrl, '/ai/reports/analyze'), {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${input.accessToken}`,
    },
    body: JSON.stringify({
      scenario: input.scenario,
      content: input.content,
      locale: input.locale,
    }),
  })

  if (!response.ok) {
    const payload = (await response.json().catch(() => null)) as {
      message?: string | string[]
    } | null

    const message = Array.isArray(payload?.message)
      ? payload.message[0]
      : payload?.message

    throw new Error(message || '真实分析触发失败，请稍后重试')
  }

  return (await response.json()) as TriggerAiWorkbenchAnalysisResult
}

export async function generateAiResumeOptimization(
  input: GenerateAiResumeOptimizationInput,
): Promise<AiResumeOptimizationResult> {
  const response = await fetch(
    joinApiUrl(input.apiBaseUrl, '/ai/reports/resume-optimize'),
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${input.accessToken}`,
      },
      body: JSON.stringify({
        instruction: input.instruction,
        locale: input.locale,
      }),
    },
  )

  if (!response.ok) {
    const payload = (await response.json().catch(() => null)) as {
      message?: string | string[]
    } | null

    const message = Array.isArray(payload?.message)
      ? payload.message[0]
      : payload?.message

    throw new Error(message || '结构化简历建议生成失败，请稍后重试')
  }

  return (await response.json()) as AiResumeOptimizationResult
}

export async function applyAiResumeOptimization(
  input: ApplyAiResumeOptimizationInput,
): Promise<ApplyAiResumeOptimizationResult> {
  const response = await fetch(
    joinApiUrl(input.apiBaseUrl, '/ai/reports/resume-optimize/apply'),
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${input.accessToken}`,
      },
      body: JSON.stringify({
        draftUpdatedAt: input.draftUpdatedAt,
        modules: input.modules,
        patch: input.patch,
      }),
    },
  )

  if (!response.ok) {
    const payload = (await response.json().catch(() => null)) as {
      message?: string | string[]
    } | null

    const message = Array.isArray(payload?.message)
      ? payload.message[0]
      : payload?.message

    throw new Error(message || 'AI 建议稿应用失败，请稍后重试')
  }

  return (await response.json()) as ApplyAiResumeOptimizationResult
}

export async function fetchCachedAiWorkbenchReports(
  input: FetchAiWorkbenchRuntimeInput,
): Promise<AiWorkbenchCachedReportSummary[]> {
  const response = await fetch(joinApiUrl(input.apiBaseUrl, '/ai/reports/cache'), {
    headers: {
      Authorization: `Bearer ${input.accessToken}`,
    },
  })

  if (!response.ok) {
    throw new Error('缓存报告列表加载失败')
  }

  const payload = (await response.json()) as {
    reports: AiWorkbenchCachedReportSummary[]
  }

  return payload.reports
}

export async function fetchCachedAiWorkbenchReport(
  input: FetchAiWorkbenchRuntimeInput & {
    reportId: string
  },
): Promise<AiWorkbenchReport> {
  const response = await fetch(
    joinApiUrl(input.apiBaseUrl, `/ai/reports/cache/${input.reportId}`),
    {
      headers: {
        Authorization: `Bearer ${input.accessToken}`,
      },
    },
  )

  if (!response.ok) {
    throw new Error('缓存报告详情加载失败')
  }

  return (await response.json()) as AiWorkbenchReport
}
