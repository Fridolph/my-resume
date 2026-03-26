import { buildPublishedResumeExportUrl } from '@my-resume/api-client';

import { ResumeLocale, ResumePublishedSnapshot } from '../../lib/published-resume-types';
import {
  formatPublishedAt,
  readLocalizedText,
  resumeLabels,
  ThemeMode,
} from './published-resume-utils';

interface PublishedResumeHeroProps {
  apiBaseUrl: string;
  locale: ResumeLocale;
  publishedResume: ResumePublishedSnapshot;
  theme: ThemeMode;
  onChangeLocale: (locale: ResumeLocale) => void;
  onChangeTheme: (theme: ThemeMode) => void;
}

export function PublishedResumeHero({
  apiBaseUrl,
  locale,
  publishedResume,
  theme,
  onChangeLocale,
  onChangeTheme,
}: PublishedResumeHeroProps) {
  const labels = resumeLabels[locale];
  const profile = publishedResume.resume.profile;
  const markdownExportUrl = buildPublishedResumeExportUrl({
    apiBaseUrl,
    format: 'markdown',
    locale,
  });
  const pdfExportUrl = buildPublishedResumeExportUrl({
    apiBaseUrl,
    format: 'pdf',
    locale,
  });
  const localizedInterests = profile.interests.map((item) =>
    readLocalizedText(item, locale),
  );

  return (
    <section className="hero-card">
      <div className="hero-header">
        <div className="hero-copy">
          <p className="eyebrow">{labels.pageEyebrow}</p>
          <h1 className="headline">{readLocalizedText(profile.fullName, locale)}</h1>
          <p className="subtitle">{readLocalizedText(profile.headline, locale)}</p>
          <p className="subtitle">{readLocalizedText(profile.summary, locale)}</p>
        </div>

        <div className="toolbar">
          <div aria-label="语言切换" className="toolbar-group" role="group">
            <button
              className={`toggle-button ${locale === 'zh' ? 'is-active' : ''}`}
              onClick={() => onChangeLocale('zh')}
              type="button"
            >
              中文
            </button>
            <button
              className={`toggle-button ${locale === 'en' ? 'is-active' : ''}`}
              onClick={() => onChangeLocale('en')}
              type="button"
            >
              EN
            </button>
          </div>

          <div aria-label="主题切换" className="toolbar-group" role="group">
            <button
              className={`toggle-button ${theme === 'light' ? 'is-active' : ''}`}
              onClick={() => onChangeTheme('light')}
              type="button"
            >
              Light
            </button>
            <button
              className={`toggle-button ${theme === 'dark' ? 'is-active' : ''}`}
              onClick={() => onChangeTheme('dark')}
              type="button"
            >
              Dark
            </button>
          </div>
        </div>
      </div>

      <div className="hero-meta">
        <span className="meta-pill">{readLocalizedText(profile.location, locale)}</span>
        <span className="meta-pill">{profile.email}</span>
        <span className="meta-pill">{profile.phone}</span>
        <span className="meta-pill">{profile.website}</span>
        <span className="meta-pill">
          {labels.publishedAt}{' '}
          <span className="meta-text">
            {formatPublishedAt(publishedResume.publishedAt, locale)}
          </span>
        </span>
      </div>

      <div className="link-grid">
        <a className="link-pill" href={markdownExportUrl}>
          {labels.exportMarkdown}
        </a>
        <a className="link-pill" href={pdfExportUrl}>
          {labels.exportPdf}
        </a>
      </div>

      {profile.links.length > 0 ? (
        <div className="link-grid">
          {profile.links.map((link) => (
            <a
              className="link-pill"
              href={link.url}
              key={link.url}
              rel="noreferrer"
              target="_blank"
            >
              {readLocalizedText(link.label, locale)}
            </a>
          ))}
        </div>
      ) : null}

      {localizedInterests.length > 0 ? (
        <div className="hero-block">
          <div className="section-header compact">
            <p className="eyebrow">{labels.interestsEyebrow}</p>
            <h2 className="section-title">{labels.interestsTitle}</h2>
          </div>
          <div className="tag-grid">
            {localizedInterests.map((interest) => (
              <span className="meta-pill" key={interest}>
                {interest}
              </span>
            ))}
          </div>
        </div>
      ) : null}
    </section>
  );
}
