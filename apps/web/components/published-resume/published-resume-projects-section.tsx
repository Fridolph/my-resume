import { Tag, TagGroup } from '@heroui/react';
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
              <div className="item-header-main">
                <span aria-hidden="true" className="timeline-accent" />
                <div className="item-heading-stack">
                  <h3 className="item-title">{readLocalizedText(project.name, locale)}</h3>
                  <p className="item-subtitle">{readLocalizedText(project.role, locale)}</p>
                </div>
              </div>
              <span className="meta-text">{formatPeriod(project)}</span>
            </div>

            <div className="item-stack">
              <div className="item-block">
                <p className="item-block-label">{locale === 'zh' ? '项目概览' : 'Summary'}</p>
                <p className="item-summary">{readLocalizedText(project.summary, locale)}</p>
              </div>
            </div>

            {project.highlights.length > 0 ? (
              <div className="item-block">
                <p className="item-block-label">{locale === 'zh' ? '关键亮点' : 'Highlights'}</p>
                <ul className="bullet-list">
                  {project.highlights.map((highlight) => (
                    <li key={`${project.name.en}-${highlight.en}`}>
                      {readLocalizedText(highlight, locale)}
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}

            {project.technologies.length > 0 ? (
              <div className="item-block">
                <p className="item-block-label">{locale === 'zh' ? '技术栈' : 'Tech Stack'}</p>
                <TagGroup.Root aria-label={`${readLocalizedText(project.name, locale)} 技术栈`}>
                  <TagGroup.List
                    className="tag-grid tag-grid--compact"
                    items={project.technologies.map((tech) => ({
                      id: tech,
                      label: tech,
                    }))}
                  >
                    {(tech) => (
                      <Tag.Root className="item-tag" id={tech.id} textValue={tech.label}>
                        {tech.label}
                      </Tag.Root>
                    )}
                  </TagGroup.List>
                </TagGroup.Root>
              </div>
            ) : null}

            {project.links.length > 0 ? (
              <div className="item-block">
                <p className="item-block-label">{locale === 'zh' ? '项目链接' : 'Links'}</p>
                <div className="link-grid link-grid--compact">
                  {project.links.map((link) => (
                    <DisplayPill
                      className="item-badge"
                      external
                      href={link.url}
                      key={link.url}
                    >
                      {readLocalizedText(link.label, locale)}
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
