'use client';

import { useEffect, useMemo, useState } from 'react';

import { DEFAULT_API_BASE_URL } from '../lib/env';
import {
  LocalizedText,
  ResumeLocale,
  ResumeProjectItem,
  ResumePublishedSnapshot,
  ResumeSkillGroup,
} from '../lib/published-resume-types';

type ThemeMode = 'light' | 'dark';

function readLocalizedText(value: LocalizedText, locale: ResumeLocale): string {
  return value[locale];
}

function formatProjectPeriod(
  project: ResumeProjectItem,
  locale: ResumeLocale,
): string {
  if (locale === 'zh') {
    return `${project.startDate} - ${project.endDate}`;
  }

  return `${project.startDate} - ${project.endDate}`;
}

function renderSkillGroup(
  skillGroup: ResumeSkillGroup,
  locale: ResumeLocale,
): string {
  return `${readLocalizedText(skillGroup.name, locale)} · ${skillGroup.keywords.join(', ')}`;
}

export function PublishedResumeShell({
  apiBaseUrl = DEFAULT_API_BASE_URL,
  publishedResume,
}: {
  apiBaseUrl?: string;
  publishedResume: ResumePublishedSnapshot | null;
}) {
  const [locale, setLocale] = useState<ResumeLocale>('zh');
  const [theme, setTheme] = useState<ThemeMode>('light');

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
  }, [theme]);

  const rawProfile = publishedResume?.resume.profile;
  const skills = publishedResume?.resume.skills ?? [];
  const projects = publishedResume?.resume.projects ?? [];

  const localizedProfile = useMemo(() => {
    if (!rawProfile) {
      return null;
    }

    return {
      fullName: readLocalizedText(rawProfile.fullName, locale),
      headline: readLocalizedText(rawProfile.headline, locale),
      summary: readLocalizedText(rawProfile.summary, locale),
      location: readLocalizedText(rawProfile.location, locale),
      interests: rawProfile.interests.map((item) =>
        readLocalizedText(item, locale),
      ),
      links: rawProfile.links.map((link) => ({
        label: readLocalizedText(link.label, locale),
        url: link.url,
      })),
    };
  }, [locale, rawProfile]);

  if (!publishedResume || !localizedProfile || !rawProfile) {
    return (
      <main className="page-shell">
        <section className="empty-card">
          <p className="eyebrow">公开简历</p>
          <h1>当前还没有已发布的公开简历内容。</h1>
          <p className="muted">
            请先通过后台更新草稿并执行发布动作，公开站才会读取到最新已发布版本。
          </p>
        </section>
      </main>
    );
  }

  const profile = rawProfile;
  const markdownExportUrl = `${apiBaseUrl.replace(/\/$/, '')}/resume/published/export/markdown?locale=${locale}`;
  const pdfExportUrl = `${apiBaseUrl.replace(/\/$/, '')}/resume/published/export/pdf?locale=${locale}`;

  return (
    <main className="page-shell">
      <section className="hero-card">
        <div className="hero-header">
          <div className="hero-copy">
            <p className="eyebrow">公开简历</p>
            <h1 className="headline">{localizedProfile.fullName}</h1>
            <p className="subtitle">{localizedProfile.headline}</p>
            <p className="subtitle">{localizedProfile.summary}</p>
          </div>

          <div className="toolbar">
            <div aria-label="语言切换" className="toolbar-group" role="group">
              <button
                className={`toggle-button ${locale === 'zh' ? 'is-active' : ''}`}
                onClick={() => setLocale('zh')}
                type="button"
              >
                中文
              </button>
              <button
                className={`toggle-button ${locale === 'en' ? 'is-active' : ''}`}
                onClick={() => setLocale('en')}
                type="button"
              >
                EN
              </button>
            </div>

            <div aria-label="主题切换" className="toolbar-group" role="group">
              <button
                className={`toggle-button ${theme === 'light' ? 'is-active' : ''}`}
                onClick={() => setTheme('light')}
                type="button"
              >
                Light
              </button>
              <button
                className={`toggle-button ${theme === 'dark' ? 'is-active' : ''}`}
                onClick={() => setTheme('dark')}
                type="button"
              >
                Dark
              </button>
            </div>
          </div>
        </div>

        <div className="hero-meta">
          <span className="meta-pill">{localizedProfile.location}</span>
          <span className="meta-pill">{profile.email}</span>
          <span className="meta-pill">{profile.website}</span>
          <span className="meta-pill">
            {locale === 'zh' ? '已发布于' : 'Published at'}{' '}
            <span className="meta-text">{publishedResume.publishedAt}</span>
          </span>
        </div>

        <div className="link-grid">
          <a className="link-pill" href={markdownExportUrl}>
            {locale === 'zh' ? '导出 Markdown' : 'Export Markdown'}
          </a>
          <a className="link-pill" href={pdfExportUrl}>
            {locale === 'zh' ? '导出 PDF' : 'Export PDF'}
          </a>
        </div>

        {localizedProfile.links.length > 0 ? (
          <div className="link-grid">
            {localizedProfile.links.map((link) => (
              <a
                className="link-pill"
                href={link.url}
                key={link.url}
                rel="noreferrer"
                target="_blank"
              >
                {link.label}
              </a>
            ))}
          </div>
        ) : null}
      </section>

      <section className="section-grid">
        <section className="section-card">
          <div>
            <p className="eyebrow">
              {locale === 'zh' ? '项目经历' : 'Projects'}
            </p>
            <h2 className="section-title">
              {locale === 'zh' ? '已发布项目内容' : 'Published project content'}
            </h2>
            <p className="section-subtitle">
              {locale === 'zh'
                ? '公开站只读取已发布内容，不会直接暴露后台草稿。'
                : 'The public site only reads published content and never exposes draft data directly.'}
            </p>
          </div>

          <div className="timeline">
            {projects.map((project) => (
              <article className="timeline-item" key={project.name.en}>
                <div className="item-header">
                  <div>
                    <h3 className="item-title">
                      {readLocalizedText(project.name, locale)}
                    </h3>
                    <p className="item-subtitle">
                      {readLocalizedText(project.role, locale)}
                    </p>
                  </div>
                  <span className="meta-text">
                    {formatProjectPeriod(project, locale)}
                  </span>
                </div>

                <p className="item-summary">
                  {readLocalizedText(project.summary, locale)}
                </p>

                {project.technologies.length > 0 ? (
                  <div className="tag-grid">
                    {project.technologies.map((tech) => (
                      <span className="meta-pill" key={tech}>
                        {tech}
                      </span>
                    ))}
                  </div>
                ) : null}
              </article>
            ))}
          </div>
        </section>

        <section className="section-card">
          <div>
            <p className="eyebrow">{locale === 'zh' ? '技能' : 'Skills'}</p>
            <h2 className="section-title">
              {locale === 'zh' ? '公开技能摘要' : 'Published skill summary'}
            </h2>
          </div>

          <div className="timeline">
            {skills.map((skillGroup) => (
              <article
                className="timeline-item"
                key={`${skillGroup.name.en}-${skillGroup.keywords.join('-')}`}
              >
                <h3 className="item-title">
                  {readLocalizedText(skillGroup.name, locale)}
                </h3>
                <p className="item-summary">
                  {renderSkillGroup(skillGroup, locale)}
                </p>
              </article>
            ))}
          </div>

          {localizedProfile.interests.length > 0 ? (
            <>
              <div>
                <p className="eyebrow">
                  {locale === 'zh' ? '兴趣' : 'Interests'}
                </p>
                <h2 className="section-title">
                  {locale === 'zh' ? '个人兴趣' : 'Personal interests'}
                </h2>
              </div>
              <div className="tag-grid">
                {localizedProfile.interests.map((interest) => (
                  <span className="meta-pill" key={interest}>
                    {interest}
                  </span>
                ))}
              </div>
            </>
          ) : null}
        </section>
      </section>
    </main>
  );
}
