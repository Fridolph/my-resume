import { DisplayPill } from '@my-resume/ui/display';

import {
  ResumeLocale,
  ResumeProjectItem,
} from '../../lib/published-resume-types';
import {
  formatPeriod,
  readLocalizedText,
  resumeLabels,
} from './published-resume-utils';
import { PublishedResumeSectionCard } from './published-resume-section-card';

interface PublishedResumeProjectsSectionProps {
  locale: ResumeLocale;
  projects: ResumeProjectItem[];
}

export function PublishedResumeProjectsSection({
  locale,
  projects,
}: PublishedResumeProjectsSectionProps) {
  const labels = resumeLabels[locale];

  if (projects.length === 0) {
    return null;
  }

  return (
    <PublishedResumeSectionCard
      description={labels.projectsDescription}
      eyebrow={labels.projectsEyebrow}
      title={labels.projectsTitle}
    >
      <div className="timeline">
        {projects.map((project) => (
          <article className="timeline-item" key={`${project.name.en}-${project.startDate}`}>
            <div className="item-header">
              <div>
                <h3 className="item-title">{readLocalizedText(project.name, locale)}</h3>
                <p className="item-subtitle">{readLocalizedText(project.role, locale)}</p>
              </div>
              <span className="meta-text">{formatPeriod(project)}</span>
            </div>

            <p className="item-summary">{readLocalizedText(project.summary, locale)}</p>

            {project.highlights.length > 0 ? (
              <ul className="bullet-list">
                {project.highlights.map((highlight) => (
                  <li key={`${project.name.en}-${highlight.en}`}>
                    {readLocalizedText(highlight, locale)}
                  </li>
                ))}
              </ul>
            ) : null}

            {project.technologies.length > 0 ? (
              <div className="tag-grid">
                {project.technologies.map((tech) => (
                  <DisplayPill key={tech}>
                    {tech}
                  </DisplayPill>
                ))}
              </div>
            ) : null}

            {project.links.length > 0 ? (
              <div className="link-grid">
                {project.links.map((link) => (
                  <DisplayPill
                    external
                    href={link.url}
                    key={link.url}
                  >
                    {readLocalizedText(link.label, locale)}
                  </DisplayPill>
                ))}
              </div>
            ) : null}
          </article>
        ))}
      </div>
    </PublishedResumeSectionCard>
  );
}
