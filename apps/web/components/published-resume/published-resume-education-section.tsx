import {
  ResumeEducationItem,
  ResumeLocale,
} from '../../lib/published-resume-types';
import {
  formatPeriod,
  readLocalizedText,
  resumeLabels,
} from './published-resume-utils';
import { PublishedResumeSectionCard } from './published-resume-section-card';

interface PublishedResumeEducationSectionProps {
  locale: ResumeLocale;
  education: ResumeEducationItem[];
}

export function PublishedResumeEducationSection({
  locale,
  education,
}: PublishedResumeEducationSectionProps) {
  const labels = resumeLabels[locale];

  if (education.length === 0) {
    return null;
  }

  return (
    <PublishedResumeSectionCard
      description={labels.educationDescription}
      eyebrow={labels.educationEyebrow}
      title={labels.educationTitle}
    >
      <div className="grid gap-4">
        {education.map((item) => (
          <article
            className="rounded-[28px] border border-slate-200/80 bg-slate-50/80 p-5 shadow-[0_12px_28px_rgba(15,23,42,0.04)] dark:border-white/10 dark:bg-white/[0.04] sm:p-6"
            key={`${item.schoolName.en}-${item.startDate}`}
          >
            <div className="grid gap-4">
              <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                <div className="space-y-1.5">
                  <h3 className="text-[20px] font-bold tracking-tight text-slate-950 dark:text-white">
                    {readLocalizedText(item.schoolName, locale)}
                  </h3>
                  <p className="text-base leading-7 text-slate-500 dark:text-slate-300">
                    {readLocalizedText(item.degree, locale)} /{' '}
                    {readLocalizedText(item.fieldOfStudy, locale)}
                  </p>
                </div>
                <span className="text-base font-medium text-slate-500 dark:text-slate-400">
                  {formatPeriod(item)}
                </span>
              </div>

              {readLocalizedText(item.location, locale) ? (
                <p className="text-sm font-medium leading-6 text-slate-500 dark:text-slate-400">
                  {readLocalizedText(item.location, locale)}
                </p>
              ) : null}

              {item.highlights.length > 0 ? (
                <ul className="grid gap-2 pl-5 text-sm leading-7 text-slate-600 dark:text-slate-300">
                  {item.highlights.map((highlight) => (
                    <li key={`${item.schoolName.en}-${highlight.en}`}>
                      {readLocalizedText(highlight, locale)}
                    </li>
                  ))}
                </ul>
              ) : null}
            </div>
          </article>
        ))}
      </div>
    </PublishedResumeSectionCard>
  );
}
