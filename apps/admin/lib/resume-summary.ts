import type {
  LocalizedText,
  ResumeLocale,
  ResumeDraftSnapshot,
  ResumeDraftSummarySnapshot,
  ResumePublishedSnapshot,
  ResumePublishedSummarySnapshot,
  StandardResume,
} from './resume-types'

function projectLocalizedText(value: LocalizedText, locale: ResumeLocale): string {
  return value[locale]
}

function buildResumeSummary(
  resume: StandardResume,
  locale: ResumeLocale,
): ResumeDraftSummarySnapshot['resume'] {
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
  }
}

export function buildDraftSummarySnapshot(
  snapshot: ResumeDraftSnapshot,
  locale: ResumeLocale = snapshot.resume.meta.defaultLocale,
): ResumeDraftSummarySnapshot {
  return {
    status: snapshot.status,
    updatedAt: snapshot.updatedAt,
    resume: buildResumeSummary(snapshot.resume, locale),
  }
}

export function buildPublishedSummarySnapshot(
  snapshot: ResumePublishedSnapshot,
  locale: ResumeLocale = snapshot.resume.meta.defaultLocale,
): ResumePublishedSummarySnapshot {
  return {
    status: snapshot.status,
    publishedAt: snapshot.publishedAt,
    resume: buildResumeSummary(snapshot.resume, locale),
  }
}
