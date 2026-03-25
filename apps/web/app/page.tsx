import { PublishedResumeShell } from '../components/published-resume-shell';
import { DEFAULT_API_BASE_URL } from '../lib/env';
import { fetchPublishedResume } from '../lib/published-resume-api';

export default async function WebHomePage() {
  const publishedResume = await fetchPublishedResume({
    apiBaseUrl: DEFAULT_API_BASE_URL,
  });

  return (
    <PublishedResumeShell
      apiBaseUrl={DEFAULT_API_BASE_URL}
      publishedResume={publishedResume}
    />
  );
}
