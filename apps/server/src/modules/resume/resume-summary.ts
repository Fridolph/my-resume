import type {
  LocalizedText,
  ResumeLocale,
  ResumeMeta,
  StandardResume,
} from './domain/standard-resume';

const RESUME_LOCALE_COOKIE_KEY = 'my-resume-locale';

export interface ResumeSummaryMeta {
  slug: ResumeMeta['slug'];
  defaultLocale: ResumeMeta['defaultLocale'];
  locale: ResumeLocale;
}

export interface ResumeSummaryProfile {
  headline: string;
  summary: string;
}

export interface ResumeSummaryCounts {
  education: number;
  experiences: number;
  projects: number;
  skills: number;
  highlights: number;
}

export interface ResumeSummary {
  meta: ResumeSummaryMeta;
  profile: ResumeSummaryProfile;
  counts: ResumeSummaryCounts;
}

export function projectLocalizedText(
  value: LocalizedText,
  locale: ResumeLocale,
): string {
  return value[locale];
}

export function buildResumeSummary(
  resume: StandardResume,
  locale: ResumeLocale,
): ResumeSummary {
  return {
    meta: {
      slug: resume.meta.slug,
      defaultLocale: resume.meta.defaultLocale,
      locale,
    },
    profile: {
      headline: projectLocalizedText(resume.profile.headline, locale),
      summary: projectLocalizedText(resume.profile.summary, locale),
    },
    counts: {
      education: resume.education.length,
      experiences: resume.experiences.length,
      projects: resume.projects.length,
      skills: resume.skills.length,
      highlights: resume.highlights.length,
    },
  };
}

export function parseResumeLocale(value: string | undefined): ResumeLocale | null {
  if (value === 'zh' || value === 'en') {
    return value;
  }

  return null;
}

export function readResumeLocaleFromCookie(
  cookieHeader: string | undefined,
): ResumeLocale | null {
  if (!cookieHeader) {
    return null;
  }

  const cookieEntries = cookieHeader.split(';');

  for (const cookieEntry of cookieEntries) {
    const [rawKey, ...rawValueParts] = cookieEntry.trim().split('=');

    if (rawKey !== RESUME_LOCALE_COOKIE_KEY) {
      continue;
    }

    const cookieValue = rawValueParts.join('=');

    try {
      return parseResumeLocale(decodeURIComponent(cookieValue));
    } catch {
      return parseResumeLocale(cookieValue);
    }
  }

  return null;
}

export function resolveResumeSummaryLocale(input: {
  localeQuery?: string;
  cookieHeader?: string;
  fallbackLocale: ResumeLocale;
}): { locale: ResumeLocale; queryInvalid: boolean } {
  if (input.localeQuery !== undefined) {
    const queryLocale = parseResumeLocale(input.localeQuery);

    if (!queryLocale) {
      return {
        locale: input.fallbackLocale,
        queryInvalid: true,
      };
    }

    return {
      locale: queryLocale,
      queryInvalid: false,
    };
  }

  const cookieLocale = readResumeLocaleFromCookie(input.cookieHeader);

  return {
    locale: cookieLocale ?? input.fallbackLocale,
    queryInvalid: false,
  };
}
