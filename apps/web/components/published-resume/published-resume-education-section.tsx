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
      <div className="timeline">
        {education.map((item) => (
          <article className="timeline-item" key={`${item.schoolName.en}-${item.startDate}`}>
            <div className="item-header">
              <div>
                <h3 className="item-title">{readLocalizedText(item.schoolName, locale)}</h3>
                <p className="item-subtitle">
                  {readLocalizedText(item.degree, locale)} ·{' '}
                  {readLocalizedText(item.fieldOfStudy, locale)}
                </p>
              </div>
              <span className="meta-text">{formatPeriod(item)}</span>
            </div>

            <p className="meta-text">{readLocalizedText(item.location, locale)}</p>

            {item.highlights.length > 0 ? (
              <ul className="bullet-list">
                {item.highlights.map((highlight) => (
                  <li key={`${item.schoolName.en}-${highlight.en}`}>
                    {readLocalizedText(highlight, locale)}
                  </li>
                ))}
              </ul>
            ) : null}
          </article>
        ))}
      </div>
    </PublishedResumeSectionCard>
  );
}
