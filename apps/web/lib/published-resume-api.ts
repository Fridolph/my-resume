import { ResumePublishedSnapshot } from './published-resume-types';

interface FetchPublishedResumeInput {
  apiBaseUrl: string;
}

function joinApiUrl(apiBaseUrl: string, pathname: string): string {
  return `${apiBaseUrl.replace(/\/$/, '')}${pathname}`;
}

export async function fetchPublishedResume(
  input: FetchPublishedResumeInput,
): Promise<ResumePublishedSnapshot | null> {
  const response = await fetch(
    joinApiUrl(input.apiBaseUrl, '/resume/published'),
    {
      cache: 'no-store',
    },
  );

  if (response.status === 404) {
    return null;
  }

  if (!response.ok) {
    throw new Error('公开简历读取失败');
  }

  return (await response.json()) as ResumePublishedSnapshot;
}
