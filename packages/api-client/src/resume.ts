export type ResumeLocale = 'zh' | 'en';
export type ResumeExportFormat = 'markdown' | 'pdf';

export interface LocalizedText {
  zh: string;
  en: string;
}

export interface ResumeMeta {
  slug: 'standard-resume';
  version: 1;
  defaultLocale: ResumeLocale;
  locales: ResumeLocale[];
}

export interface ResumeProfileLink {
  label: LocalizedText;
  url: string;
  icon?: string;
}

export interface ResumeProfileInterestItem {
  label: LocalizedText;
  icon?: string;
}

export interface ResumeProfileHero {
  frontImageUrl: string;
  backImageUrl: string;
  linkUrl: string;
  slogans: LocalizedText[];
}

export interface ResumeProfile {
  fullName: LocalizedText;
  headline: LocalizedText;
  summary: LocalizedText;
  location: LocalizedText;
  email: string;
  phone: string;
  website: string;
  hero: ResumeProfileHero;
  links: ResumeProfileLink[];
  interests: ResumeProfileInterestItem[];
}

export interface ResumeEducationItem {
  schoolName: LocalizedText;
  degree: LocalizedText;
  fieldOfStudy: LocalizedText;
  startDate: string;
  endDate: string;
  location: LocalizedText;
  highlights: LocalizedText[];
}

export interface ResumeExperienceItem {
  companyName: LocalizedText;
  role: LocalizedText;
  employmentType: LocalizedText;
  startDate: string;
  endDate: string;
  location: LocalizedText;
  summary: LocalizedText;
  highlights: LocalizedText[];
  technologies: string[];
}

export interface ResumeProjectItem {
  name: LocalizedText;
  role: LocalizedText;
  startDate: string;
  endDate: string;
  summary: LocalizedText;
  highlights: LocalizedText[];
  technologies: string[];
  links: ResumeProfileLink[];
}

export interface ResumeSkillGroup {
  name: LocalizedText;
  keywords: string[];
}

export interface ResumeHighlightItem {
  title: LocalizedText;
  description: LocalizedText;
}

export interface StandardResume {
  meta: ResumeMeta;
  profile: ResumeProfile;
  education: ResumeEducationItem[];
  experiences: ResumeExperienceItem[];
  projects: ResumeProjectItem[];
  skills: ResumeSkillGroup[];
  highlights: ResumeHighlightItem[];
}

export interface ResumeDraftSnapshot {
  status: 'draft';
  updatedAt: string;
  resume: StandardResume;
}

export interface ResumePublishedSnapshot {
  status: 'published';
  publishedAt: string;
  resume: StandardResume;
}

interface ResumeRequestInput {
  apiBaseUrl: string;
}

interface AuthenticatedResumeRequestInput extends ResumeRequestInput {
  accessToken: string;
}

interface UpdateResumeDraftInput extends AuthenticatedResumeRequestInput {
  resume: StandardResume;
}

function joinApiUrl(apiBaseUrl: string, pathname: string): string {
  return `${apiBaseUrl.replace(/\/$/, '')}${pathname}`;
}

async function resolveApiErrorMessage(
  response: Response,
  fallbackMessage: string,
): Promise<string> {
  try {
    const payload = (await response.json()) as {
      error?: unknown;
      message?: unknown;
    };

    if (typeof payload.message === 'string' && payload.message.trim()) {
      return payload.message;
    }

    if (Array.isArray(payload.message)) {
      const messages = payload.message.filter(
        (item): item is string => typeof item === 'string' && item.trim().length > 0,
      );

      if (messages.length > 0) {
        return messages.join('；');
      }
    }

    if (typeof payload.error === 'string' && payload.error.trim()) {
      return payload.error;
    }
  } catch {
    // Ignore parsing errors and fall back to the default message.
  }

  return fallbackMessage;
}

export function buildPublishedResumeExportUrl(input: {
  apiBaseUrl: string;
  format: ResumeExportFormat;
  locale: ResumeLocale;
}): string {
  return `${joinApiUrl(input.apiBaseUrl, '/resume/published/export/')}${input.format}?locale=${input.locale}`;
}

export async function fetchPublishedResume(
  input: ResumeRequestInput,
): Promise<ResumePublishedSnapshot | null> {
  const response = await fetch(joinApiUrl(input.apiBaseUrl, '/resume/published'), {
    cache: 'no-store',
  });

  if (response.status === 404) {
    return null;
  }

  if (!response.ok) {
    throw new Error('公开简历读取失败');
  }

  return (await response.json()) as ResumePublishedSnapshot;
}

export async function fetchDraftResume(
  input: AuthenticatedResumeRequestInput,
): Promise<ResumeDraftSnapshot> {
  const response = await fetch(joinApiUrl(input.apiBaseUrl, '/resume/draft'), {
    headers: {
      Authorization: `Bearer ${input.accessToken}`,
    },
  });

  if (!response.ok) {
    throw new Error(
      await resolveApiErrorMessage(
        response,
        '草稿读取失败，请确认当前账号拥有编辑权限',
      ),
    );
  }

  return (await response.json()) as ResumeDraftSnapshot;
}

export async function updateDraftResume(
  input: UpdateResumeDraftInput,
): Promise<ResumeDraftSnapshot> {
  const response = await fetch(joinApiUrl(input.apiBaseUrl, '/resume/draft'), {
    method: 'PUT',
    headers: {
      Authorization: `Bearer ${input.accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(input.resume),
  });

  if (!response.ok) {
    throw new Error(
      await resolveApiErrorMessage(
        response,
        '草稿保存失败，请检查内容是否符合当前模型',
      ),
    );
  }

  return (await response.json()) as ResumeDraftSnapshot;
}

export async function publishResume(
  input: AuthenticatedResumeRequestInput,
): Promise<ResumePublishedSnapshot> {
  const response = await fetch(joinApiUrl(input.apiBaseUrl, '/resume/publish'), {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${input.accessToken}`,
    },
  });

  if (!response.ok) {
    throw new Error(
      await resolveApiErrorMessage(
        response,
        '发布失败，请确认当前账号拥有发布权限',
      ),
    );
  }

  return (await response.json()) as ResumePublishedSnapshot;
}
