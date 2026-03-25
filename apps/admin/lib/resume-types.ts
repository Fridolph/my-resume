export type ResumeLocale = 'zh' | 'en';

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
}

export interface ResumeProfile {
  fullName: LocalizedText;
  headline: LocalizedText;
  summary: LocalizedText;
  location: LocalizedText;
  email: string;
  phone: string;
  website: string;
  links: ResumeProfileLink[];
  interests: LocalizedText[];
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
