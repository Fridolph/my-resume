import { ResumeDraftSnapshot, StandardResume } from './resume-types';

interface ResumeDraftRequestInput {
  apiBaseUrl: string;
  accessToken: string;
}

interface UpdateResumeDraftInput extends ResumeDraftRequestInput {
  resume: StandardResume;
}

function joinApiUrl(apiBaseUrl: string, pathname: string): string {
  return `${apiBaseUrl.replace(/\/$/, '')}${pathname}`;
}

export async function fetchDraftResume(
  input: ResumeDraftRequestInput,
): Promise<ResumeDraftSnapshot> {
  const response = await fetch(joinApiUrl(input.apiBaseUrl, '/resume/draft'), {
    headers: {
      Authorization: `Bearer ${input.accessToken}`,
    },
  });

  if (!response.ok) {
    throw new Error('草稿读取失败，请确认当前账号拥有编辑权限');
  }

  return (await response.json()) as ResumeDraftSnapshot;
}

export async function updateDraftResume(
  input: UpdateResumeDraftInput,
): Promise<ResumeDraftSnapshot> {
  const response = await fetch(joinApiUrl(input.apiBaseUrl, '/resume/draft'), {
    method: 'PUT',
    headers: {
      Authorization: `Bearer ${input.accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(input.resume),
  });

  if (!response.ok) {
    throw new Error('草稿保存失败，请检查内容是否符合当前模型');
  }

  return (await response.json()) as ResumeDraftSnapshot;
}
