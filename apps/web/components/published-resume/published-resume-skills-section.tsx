import {
  ResumeLocale,
  ResumeSkillGroup,
} from '../../lib/published-resume-types';
import { readLocalizedText, resumeLabels } from './published-resume-utils';
import { PublishedResumeSectionCard } from './published-resume-section-card';

interface PublishedResumeSkillsSectionProps {
  locale: ResumeLocale;
  skills: ResumeSkillGroup[];
}

export function PublishedResumeSkillsSection({
  locale,
  skills,
}: PublishedResumeSkillsSectionProps) {
  const labels = resumeLabels[locale];

  if (skills.length === 0) {
    return null;
  }

  return (
    <PublishedResumeSectionCard
      description={labels.skillsDescription}
      eyebrow={labels.skillsEyebrow}
      title={labels.skillsTitle}
    >
      <div className="timeline">
        {skills.map((group) => (
          <article
            className="timeline-item"
            key={`${group.name.en}-${group.keywords.join('-')}`}
          >
            <h3 className="item-title">{readLocalizedText(group.name, locale)}</h3>
            <div className="tag-grid">
              {group.keywords.map((keyword) => (
                <span className="meta-pill" key={`${group.name.en}-${keyword}`}>
                  {keyword}
                </span>
              ))}
            </div>
          </article>
        ))}
      </div>
    </PublishedResumeSectionCard>
  );
}
