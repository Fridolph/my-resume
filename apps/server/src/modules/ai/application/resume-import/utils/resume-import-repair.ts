import {
  createEmptyStandardResume,
  createLocalizedText,
  isLocalizedText,
  type LocalizedText,
  type StandardResume,
} from '../../../../resume/domain/standard-resume'

/**
 * AI 输出修复结果。
 */
export interface ResumeImportRepairResult {
  /** 修复后的 StandardResume 候选对象。 */
  resume: StandardResume
  /** 修复过程中记录的用户/开发可读说明。 */
  repairMessages: string[]
}

/**
 * 判断 unknown 是否为普通对象。
 */
function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value)
}

/**
 * 安全读取字符串字段。
 */
function readString(value: unknown): string {
  return typeof value === 'string' ? value.trim() : ''
}

/**
 * 创建中文 LocalizedText，英文先留空。
 */
function localizedZh(value: string): LocalizedText {
  return createLocalizedText(value.trim(), '')
}

/**
 * 将常见 LocalizedText 简写修复为 { zh, en } 结构。
 */
function repairLocalizedText(
  value: unknown,
  path: string,
  repairs: string[],
): LocalizedText {
  if (isLocalizedText(value)) {
    return value
  }

  if (typeof value === 'string') {
    repairs.push(`已自动修复 ${path}：string -> { zh, en }`)
    return localizedZh(value)
  }

  if (isRecord(value)) {
    const zh = readString(value.zh)
    const en = readString(value.en)

    if (zh || en) {
      repairs.push(`已自动补齐 ${path} 的 zh/en 字段`)
      return createLocalizedText(zh, en)
    }
  }

  repairs.push(`已将 ${path} 兜底为空 LocalizedText`)
  return localizedZh('')
}

/**
 * 修复 LocalizedText 数组字段。
 */
function repairLocalizedTextArray(
  value: unknown,
  path: string,
  repairs: string[],
): LocalizedText[] {
  if (!Array.isArray(value)) {
    if (typeof value !== 'undefined') {
      repairs.push(`已将 ${path} 非数组内容按空数组处理`)
    }

    return []
  }

  return value.map((item, index) =>
    repairLocalizedText(item, `${path}[${index}]`, repairs),
  )
}

/**
 * 修复 string[] 字段，忽略非字符串项。
 */
function repairStringArray(value: unknown, path: string, repairs: string[]): string[] {
  if (!Array.isArray(value)) {
    if (typeof value !== 'undefined') {
      repairs.push(`已将 ${path} 非数组内容按空数组处理`)
    }

    return []
  }

  return value
    .map((item) => (typeof item === 'string' ? item.trim() : ''))
    .filter(Boolean)
}

/**
 * 读取对象数组；非数组或非对象项会被丢弃并记录修复说明。
 */
function readRecordArray(
  value: unknown,
  path: string,
  repairs: string[],
): Record<string, unknown>[] {
  if (!Array.isArray(value)) {
    if (typeof value !== 'undefined') {
      repairs.push(`已将 ${path} 非数组内容按空数组处理`)
    }

    return []
  }

  return value.filter((item, index): item is Record<string, unknown> => {
    if (isRecord(item)) {
      return true
    }

    repairs.push(`已忽略 ${path}[${index}]：不是对象`)
    return false
  })
}

/**
 * 对 AI provider 返回的 resume 做导入专用修复。
 *
 * 注意：这里不放宽全局 StandardResume 校验，只把常见 AI 简写形态修成标准候选对象，后续仍必须 validate。
 */
export function repairProviderResume(value: unknown): ResumeImportRepairResult {
  const repairs: string[] = []
  const defaults = createEmptyStandardResume()
  const source = isRecord(value) ? value : {}
  const profile = isRecord(source.profile) ? source.profile : {}
  const hero = isRecord(profile.hero) ? profile.hero : {}
  const defaultHero = defaults.profile.hero

  if (!isRecord(value)) {
    repairs.push('AI 返回的 resume 不是对象，已按空简历结构兜底')
  }

  if (!isRecord(source.meta)) {
    repairs.push('已补齐缺失的 meta 标准字段')
  }

  const resume: StandardResume = {
    meta: defaults.meta,
    profile: {
      fullName: repairLocalizedText(profile.fullName, 'profile.fullName', repairs),
      headline: repairLocalizedText(profile.headline, 'profile.headline', repairs),
      summary: repairLocalizedText(profile.summary, 'profile.summary', repairs),
      location: repairLocalizedText(profile.location, 'profile.location', repairs),
      email: readString(profile.email),
      phone: readString(profile.phone),
      website: readString(profile.website),
      hero: {
        frontImageUrl: readString(hero.frontImageUrl) || defaultHero.frontImageUrl,
        backImageUrl: readString(hero.backImageUrl) || defaultHero.backImageUrl,
        linkUrl: readString(hero.linkUrl) || defaultHero.linkUrl,
        slogans:
          Array.isArray(hero.slogans) && hero.slogans.length > 0
            ? repairLocalizedTextArray(hero.slogans, 'profile.hero.slogans', repairs)
            : defaultHero.slogans,
      },
      links: [],
      interests: [],
    },
    education: readRecordArray(source.education, 'education', repairs).map(
      (item, index) => ({
        schoolName: repairLocalizedText(
          item.schoolName,
          `education[${index}].schoolName`,
          repairs,
        ),
        degree: repairLocalizedText(item.degree, `education[${index}].degree`, repairs),
        fieldOfStudy: repairLocalizedText(
          item.fieldOfStudy,
          `education[${index}].fieldOfStudy`,
          repairs,
        ),
        startDate: readString(item.startDate),
        endDate: readString(item.endDate),
        location: repairLocalizedText(
          item.location,
          `education[${index}].location`,
          repairs,
        ),
        highlights: repairLocalizedTextArray(
          item.highlights,
          `education[${index}].highlights`,
          repairs,
        ),
      }),
    ),
    experiences: readRecordArray(source.experiences, 'experiences', repairs).map(
      (item, index) => ({
        companyName: repairLocalizedText(
          item.companyName,
          `experiences[${index}].companyName`,
          repairs,
        ),
        role: repairLocalizedText(item.role, `experiences[${index}].role`, repairs),
        employmentType: repairLocalizedText(
          item.employmentType,
          `experiences[${index}].employmentType`,
          repairs,
        ),
        startDate: readString(item.startDate),
        endDate: readString(item.endDate),
        location: repairLocalizedText(
          item.location,
          `experiences[${index}].location`,
          repairs,
        ),
        summary: repairLocalizedText(
          item.summary,
          `experiences[${index}].summary`,
          repairs,
        ),
        highlights: repairLocalizedTextArray(
          item.highlights,
          `experiences[${index}].highlights`,
          repairs,
        ),
        technologies: repairStringArray(
          item.technologies,
          `experiences[${index}].technologies`,
          repairs,
        ),
      }),
    ),
    projects: readRecordArray(source.projects, 'projects', repairs).map(
      (item, index) => ({
        name: repairLocalizedText(item.name, `projects[${index}].name`, repairs),
        role: repairLocalizedText(item.role, `projects[${index}].role`, repairs),
        startDate: readString(item.startDate),
        endDate: readString(item.endDate),
        summary: repairLocalizedText(item.summary, `projects[${index}].summary`, repairs),
        coreFunctions: repairLocalizedText(
          item.coreFunctions,
          `projects[${index}].coreFunctions`,
          repairs,
        ),
        highlights: repairLocalizedTextArray(
          item.highlights,
          `projects[${index}].highlights`,
          repairs,
        ),
        technologies: repairStringArray(
          item.technologies,
          `projects[${index}].technologies`,
          repairs,
        ),
        links: [],
      }),
    ),
    skills: readRecordArray(source.skills, 'skills', repairs).map((item, index) => ({
      name: repairLocalizedText(item.name, `skills[${index}].name`, repairs),
      keywords: repairLocalizedTextArray(
        item.keywords,
        `skills[${index}].keywords`,
        repairs,
      ),
      ...(typeof item.proficiency === 'number' && Number.isFinite(item.proficiency)
        ? { proficiency: item.proficiency }
        : {}),
    })),
    highlights: readRecordArray(source.highlights, 'highlights', repairs).map(
      (item, index) => ({
        title: repairLocalizedText(item.title, `highlights[${index}].title`, repairs),
        description: repairLocalizedText(
          item.description,
          `highlights[${index}].description`,
          repairs,
        ),
      }),
    ),
  }

  return {
    resume,
    repairMessages: repairs,
  }
}
