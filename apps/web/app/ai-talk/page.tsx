import { AiTalkPlaceholderShell } from '../../components/ai-talk-placeholder-shell';
import { DEFAULT_API_BASE_URL } from '../../lib/env';
import { fetchPublishedResume } from '../../lib/published-resume-api';

export default async function AiTalkPage() {
  const publishedResume = await fetchPublishedResume({
    apiBaseUrl: DEFAULT_API_BASE_URL,
  });

  return (
    <AiTalkPlaceholderShell
      apiBaseUrl={DEFAULT_API_BASE_URL}
      publishedResume={publishedResume}
    />
  );
}
