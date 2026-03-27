import {
  AiWorkbenchLocale,
  AiWorkbenchRuntimeSummary,
  AiWorkbenchScenario,
  TriggerAiWorkbenchAnalysisResult,
} from './ai-workbench-types';

interface FetchAiWorkbenchRuntimeInput {
  apiBaseUrl: string;
  accessToken: string;
}

interface TriggerAiWorkbenchAnalysisInput extends FetchAiWorkbenchRuntimeInput {
  scenario: AiWorkbenchScenario;
  content: string;
  locale: AiWorkbenchLocale;
}

function joinApiUrl(apiBaseUrl: string, pathname: string): string {
  return `${apiBaseUrl.replace(/\/$/, '')}${pathname}`;
}

export async function fetchAiWorkbenchRuntime(
  input: FetchAiWorkbenchRuntimeInput,
): Promise<AiWorkbenchRuntimeSummary> {
  const response = await fetch(joinApiUrl(input.apiBaseUrl, '/ai/reports/runtime'), {
    headers: {
      Authorization: `Bearer ${input.accessToken}`,
    },
  });

  if (!response.ok) {
    throw new Error('AI 工作台运行时信息加载失败');
  }

  return (await response.json()) as AiWorkbenchRuntimeSummary;
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
  });

  if (!response.ok) {
    const payload = (await response.json().catch(() => null)) as
      | { message?: string | string[] }
      | null;

    const message = Array.isArray(payload?.message)
      ? payload.message[0]
      : payload?.message;

    throw new Error(message || '真实分析触发失败，请稍后重试');
  }

  return (await response.json()) as TriggerAiWorkbenchAnalysisResult;
}
