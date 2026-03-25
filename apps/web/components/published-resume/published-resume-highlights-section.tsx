import {
  ResumeHighlightItem,
  ResumeLocale,
} from '../../lib/published-resume-types';
import { readLocalizedText, resumeLabels } from './published-resume-utils';
import { PublishedResumeSectionCard } from './published-resume-section-card';

interface PublishedResumeHighlightsSectionProps {
  locale: ResumeLocale;
  highlights: ResumeHighlightItem[];
}

export function PublishedResumeHighlightsSection({
  locale,
  highlights,
}: PublishedResumeHighlightsSectionProps) {
  const labels = resumeLabels[locale];

  if (highlights.length === 0) {
    return null;
  }

  return (
    <PublishedResumeSectionCard
      description={labels.highlightsDescription}
      eyebrow={labels.highlightsEyebrow}
      title={labels.highlightsTitle}
    >
      <div className="timeline">
        {highlights.map((item) => (
          <article className="timeline-item" key={`${item.title.en}-${item.description.en}`}>
            <h3 className="item-title">{readLocalizedText(item.title, locale)}</h3>
            <p className="item-summary">{readLocalizedText(item.description, locale)}</p>
          </article>
        ))}
      </div>
    </PublishedResumeSectionCard>
  );
}
