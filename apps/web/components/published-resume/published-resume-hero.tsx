import { buildPublishedResumeExportUrl } from '@my-resume/api-client';
import {
  DisplayPill,
  DisplaySectionIntro,
  DisplaySurfaceCard,
} from '@my-resume/ui/display';
import type { ThemeMode } from '@my-resume/ui/theme';

import { ResumeLocale, ResumePublishedSnapshot } from '../../lib/published-resume-types';
import {
  formatPublishedAt,
  readLocalizedText,
  resumeLabels,
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
    <DisplaySurfaceCard className="hero-card">
      <div className="hero-header">
        <div className="hero-copy">
          <p className="eyebrow">{labels.pageEyebrow}</p>
          <h1 className="headline">{readLocalizedText(profile.fullName, locale)}</h1>
          <p className="subtitle">{readLocalizedText(profile.headline, locale)}</p>
          <p className="subtitle">{readLocalizedText(profile.summary, locale)}</p>
        </div>

        <aside className="hero-aside">
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

          <div className="hero-edition-card">
            <DisplaySectionIntro
              description={labels.standardEditionDescription}
              eyebrow={labels.standardEditionEyebrow}
              title={labels.standardEditionTitle}
              titleAs="h2"
            />
            <div className="link-grid">
              <DisplayPill href={markdownExportUrl}>
                {labels.exportMarkdown}
              </DisplayPill>
              <DisplayPill href={pdfExportUrl}>
                {labels.exportPdf}
              </DisplayPill>
            </div>
          </div>
        </aside>
      </div>

      <div className="hero-meta">
        <DisplayPill>{readLocalizedText(profile.location, locale)}</DisplayPill>
        <DisplayPill>{profile.email}</DisplayPill>
        <DisplayPill>{profile.phone}</DisplayPill>
        <DisplayPill>{profile.website}</DisplayPill>
        <DisplayPill>
          {labels.publishedAt}{' '}
          <span className="meta-text">
            {formatPublishedAt(publishedResume.publishedAt, locale)}
          </span>
        </DisplayPill>
      </div>

      {profile.links.length > 0 ? (
        <div className="link-grid">
          {profile.links.map((link) => (
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

      {localizedInterests.length > 0 ? (
        <div className="hero-block">
          <DisplaySectionIntro
            compact
            eyebrow={labels.interestsEyebrow}
            title={labels.interestsTitle}
          />
          <div className="tag-grid">
            {localizedInterests.map((interest) => (
              <DisplayPill key={interest}>
                {interest}
              </DisplayPill>
            ))}
          </div>
        </div>
      ) : null}
    </DisplaySurfaceCard>
  );
}
