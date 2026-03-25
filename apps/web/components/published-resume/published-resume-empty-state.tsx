import { resumeLabels } from './published-resume-utils';

export function PublishedResumeEmptyState() {
  const labels = resumeLabels.zh;

  return (
    <main className="page-shell">
      <section className="empty-card">
        <p className="eyebrow">{labels.pageEyebrow}</p>
        <h1>{labels.emptyTitle}</h1>
        <p className="muted">{labels.emptyDescription}</p>
      </section>
    </main>
  );
}
