import {
  ResumeExperienceItem,
  ResumeLocale,
} from '../../lib/published-resume-types';
import {
  formatPeriod,
  readLocalizedText,
  resumeLabels,
} from './published-resume-utils';
import { PublishedResumeSectionCard } from './published-resume-section-card';

interface PublishedResumeExperienceSectionProps {
  locale: ResumeLocale;
  experiences: ResumeExperienceItem[];
}

export function PublishedResumeExperienceSection({
  locale,
  experiences,
}: PublishedResumeExperienceSectionProps) {
  const labels = resumeLabels[locale];

  if (experiences.length === 0) {
    return null;
  }

  return (
    <PublishedResumeSectionCard
      description={labels.experienceDescription}
      eyebrow={labels.experienceEyebrow}
      title={labels.experienceTitle}
    >
      <div className="timeline">
        {experiences.map((experience) => (
          <article
            className="timeline-item"
            key={`${experience.companyName.en}-${experience.startDate}`}
          >
            <div className="item-header">
              <div>
                <h3 className="item-title">
                  {readLocalizedText(experience.companyName, locale)}
                </h3>
                <p className="item-subtitle">
                  {readLocalizedText(experience.role, locale)} ·{' '}
                  {readLocalizedText(experience.employmentType, locale)}
                </p>
              </div>
              <span className="meta-text">{formatPeriod(experience)}</span>
            </div>

            <p className="item-summary">
              {readLocalizedText(experience.summary, locale)}
            </p>
            <p className="meta-text">
              {readLocalizedText(experience.location, locale)}
            </p>

            {experience.highlights.length > 0 ? (
              <ul className="bullet-list">
                {experience.highlights.map((highlight) => (
                  <li key={`${experience.companyName.en}-${highlight.en}`}>
                    {readLocalizedText(highlight, locale)}
                  </li>
                ))}
              </ul>
            ) : null}

            {experience.technologies.length > 0 ? (
              <div className="tag-grid">
                {experience.technologies.map((tech) => (
                  <span className="meta-pill" key={tech}>
                    {tech}
                  </span>
                ))}
              </div>
            ) : null}
          </article>
        ))}
      </div>
    </PublishedResumeSectionCard>
  );
}
