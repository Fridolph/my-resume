import { AiWorkbenchRuntimeSummary } from './ai-workbench-types';

interface FetchAiWorkbenchRuntimeInput {
  apiBaseUrl: string;
  accessToken: string;
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
