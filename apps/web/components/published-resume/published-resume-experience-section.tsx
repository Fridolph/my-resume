import { DisplayPill } from '@my-resume/ui/display';

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
              <div className="item-header-main">
                <span aria-hidden="true" className="timeline-accent" />
                <div className="item-heading-stack">
                  <h3 className="item-title">
                    {readLocalizedText(experience.companyName, locale)}
                  </h3>
                  <p className="item-subtitle">
                    {readLocalizedText(experience.role, locale)} ·{' '}
                    {readLocalizedText(experience.employmentType, locale)}
                  </p>
                </div>
              </div>
              <span className="meta-text">{formatPeriod(experience)}</span>
            </div>

            <div className="item-stack">
              <div className="item-block">
                <p className="item-block-label">{locale === 'zh' ? '职责概览' : 'Summary'}</p>
                <p className="item-summary">
                  {readLocalizedText(experience.summary, locale)}
                </p>
              </div>
              <div className="item-block">
                <p className="item-block-label">{locale === 'zh' ? '地点' : 'Location'}</p>
                <p className="meta-text">
                  {readLocalizedText(experience.location, locale)}
                </p>
              </div>
            </div>

            {experience.highlights.length > 0 ? (
              <div className="item-block">
                <p className="item-block-label">{locale === 'zh' ? '关键亮点' : 'Highlights'}</p>
                <ul className="bullet-list">
                  {experience.highlights.map((highlight) => (
                    <li key={`${experience.companyName.en}-${highlight.en}`}>
                      {readLocalizedText(highlight, locale)}
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}

            {experience.technologies.length > 0 ? (
              <div className="item-block">
                <p className="item-block-label">{locale === 'zh' ? '技术栈' : 'Tech Stack'}</p>
                <div className="tag-grid tag-grid--compact">
                  {experience.technologies.map((tech) => (
                    <DisplayPill className="item-badge" key={tech}>
                      {tech}
                    </DisplayPill>
                  ))}
                </div>
              </div>
            ) : null}
          </article>
        ))}
      </div>
    </PublishedResumeSectionCard>
  );
}
