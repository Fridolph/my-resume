import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@heroui/react';

import { resumeLabels } from './published-resume-utils';

export function PublishedResumeEmptyState() {
  const labels = resumeLabels.zh;

  return (
    <main className="web-page-shell">
      <section className="mx-auto grid w-full max-w-5xl gap-6">
        <Card className="border-white/70 bg-white/84 shadow-[0_24px_70px_rgba(15,23,42,0.08)] dark:border-white/10 dark:bg-slate-950/84">
          <CardHeader className="gap-3">
            <p className="web-eyebrow">{labels.pageEyebrow}</p>
            <CardTitle className="text-3xl text-slate-950 dark:text-white">
              {labels.emptyTitle}
            </CardTitle>
            <CardDescription className="text-base leading-7 text-slate-500 dark:text-slate-400">
              {labels.emptyDescription}
            </CardDescription>
          </CardHeader>
          <CardContent />
        </Card>
      </section>
    </main>
  );
}
