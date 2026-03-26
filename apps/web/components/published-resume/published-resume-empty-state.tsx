import { DisplaySectionIntro, DisplaySurfaceCard } from '@my-resume/ui/display';

import { resumeLabels } from './published-resume-utils';

export function PublishedResumeEmptyState() {
  const labels = resumeLabels.zh;

  return (
    <main className="page-shell">
      <DisplaySurfaceCard className="empty-card">
        <DisplaySectionIntro
          description={labels.emptyDescription}
          eyebrow={labels.pageEyebrow}
          title={labels.emptyTitle}
          titleAs="h1"
        />
      </DisplaySurfaceCard>
    </main>
  );
}
