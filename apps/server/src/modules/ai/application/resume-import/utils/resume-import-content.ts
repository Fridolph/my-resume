import type {
  LocalizedText,
  ResumeEducationItem,
  ResumeExperienceItem,
  ResumeHighlightItem,
  ResumeProjectItem,
  ResumeSkillGroup,
  StandardResume,
} from '../../../../resume/domain/standard-resume'
import { RESUME_IMPORT_MODULES } from '../constants/resume-import.constants'
import { getResumeImportModuleTitle } from './resume-import-diff'
import type {
  ResumeImportModule,
  ResumeImportModuleContent,
  ResumeImportModuleContentItem,
} from '../types/resume-import.types'

function readLocalizedText(value: LocalizedText | undefined): string {
  return value?.zh.trim() || value?.en.trim() || ''
}

function compactStrings(values: Array<string | undefined | null>): string[] {
  return values.map((value) => value?.trim() ?? '').filter(Boolean)
}

function formatPeriod(startDate: string, endDate: string): string {
  return compactStrings([startDate, endDate]).join(' - ')
}

function formatLocalizedLines(values: LocalizedText[] | undefined): string[] {
  return (values ?? []).map(readLocalizedText).filter(Boolean)
}

function buildProfileItems(resume: StandardResume): ResumeImportModuleContentItem[] {
  const profile = resume.profile
  const links = profile.links
    .map((link) => compactStrings([readLocalizedText(link.label), link.url]).join('：'))
    .filter(Boolean)
  const interests = profile.interests
    .map((item) => readLocalizedText(item.label))
    .filter(Boolean)
  const slogans = profile.hero.slogans.map(readLocalizedText).filter(Boolean)

  return [
    {
      key: 'profile',
      title: readLocalizedText(profile.fullName) || '未识别姓名',
      subtitle: readLocalizedText(profile.headline),
      meta: compactStrings([
        profile.email ? `邮箱：${profile.email}` : '',
        profile.phone ? `电话：${profile.phone}` : '',
        readLocalizedText(profile.location)
          ? `所在地：${readLocalizedText(profile.location)}`
          : '',
        profile.website ? `网站：${profile.website}` : '',
      ]),
      body: compactStrings([
        readLocalizedText(profile.summary),
        links.length > 0 ? `链接：${links.join('；')}` : '',
        interests.length > 0 ? `兴趣：${interests.join('、')}` : '',
        slogans.length > 0 ? `Slogan：${slogans.join(' / ')}` : '',
      ]),
    },
  ]
}

function buildEducationItems(
  items: ResumeEducationItem[],
): ResumeImportModuleContentItem[] {
  return items.map((item, index) => ({
    key: `education-${index}`,
    title: readLocalizedText(item.schoolName) || `教育经历 ${index + 1}`,
    subtitle: compactStrings([
      readLocalizedText(item.degree),
      readLocalizedText(item.fieldOfStudy),
    ]).join(' / '),
    meta: compactStrings([
      formatPeriod(item.startDate, item.endDate),
      readLocalizedText(item.location),
    ]),
    body: formatLocalizedLines(item.highlights),
  }))
}

function buildExperienceItems(
  items: ResumeExperienceItem[],
): ResumeImportModuleContentItem[] {
  return items.map((item, index) => ({
    key: `experience-${index}`,
    title: readLocalizedText(item.companyName) || `工作经历 ${index + 1}`,
    subtitle: compactStrings([
      readLocalizedText(item.role),
      readLocalizedText(item.employmentType),
    ]).join(' / '),
    meta: compactStrings([
      formatPeriod(item.startDate, item.endDate),
      readLocalizedText(item.location),
      item.technologies.length > 0 ? `技术栈：${item.technologies.join(' / ')}` : '',
    ]),
    body: compactStrings([
      readLocalizedText(item.summary),
      ...formatLocalizedLines(item.highlights),
    ]),
  }))
}

function buildProjectItems(items: ResumeProjectItem[]): ResumeImportModuleContentItem[] {
  return items.map((item, index) => {
    const links = item.links
      .map((link) => compactStrings([readLocalizedText(link.label), link.url]).join('：'))
      .filter(Boolean)

    return {
      key: `project-${index}`,
      title: readLocalizedText(item.name) || `项目经历 ${index + 1}`,
      subtitle: readLocalizedText(item.role),
      meta: compactStrings([
        formatPeriod(item.startDate, item.endDate),
        item.technologies.length > 0 ? `技术栈：${item.technologies.join(' / ')}` : '',
        links.length > 0 ? `链接：${links.join('；')}` : '',
      ]),
      body: compactStrings([
        readLocalizedText(item.summary),
        readLocalizedText(item.coreFunctions)
          ? `核心功能：${readLocalizedText(item.coreFunctions)}`
          : '',
        ...formatLocalizedLines(item.highlights),
      ]),
    }
  })
}

function buildSkillItems(items: ResumeSkillGroup[]): ResumeImportModuleContentItem[] {
  return items.map((item, index) => ({
    key: `skill-${index}`,
    title: readLocalizedText(item.name) || `技能分组 ${index + 1}`,
    meta: typeof item.proficiency === 'number' ? [`熟练度：${item.proficiency}`] : [],
    body: item.keywords.map(readLocalizedText).filter(Boolean),
  }))
}

function buildHighlightItems(
  items: ResumeHighlightItem[],
): ResumeImportModuleContentItem[] {
  return items.map((item, index) => ({
    key: `highlight-${index}`,
    title: readLocalizedText(item.title) || `亮点 ${index + 1}`,
    meta: [],
    body: compactStrings([readLocalizedText(item.description)]),
  }))
}

function buildModuleItems(
  resume: StandardResume,
  module: ResumeImportModule,
): ResumeImportModuleContentItem[] {
  switch (module) {
    case 'profile':
      return buildProfileItems(resume)
    case 'education':
      return buildEducationItems(resume.education)
    case 'experiences':
      return buildExperienceItems(resume.experiences)
    case 'projects':
      return buildProjectItems(resume.projects)
    case 'skills':
      return buildSkillItems(resume.skills)
    case 'highlights':
      return buildHighlightItems(resume.highlights)
  }
}

function warningMatchesModule(warning: string, module: ResumeImportModule): boolean {
  const title = getResumeImportModuleTitle(module)
  const moduleTerms: Record<ResumeImportModule, string[]> = {
    profile: ['profile', '基本信息', '联系方式', '姓名', '邮箱', '电话'],
    education: ['education', '教育经历', '学校', '学历'],
    experiences: ['experiences', '工作经历', '公司', '职位'],
    projects: ['projects', '项目经历', '项目'],
    skills: ['skills', '专业技能', '技能'],
    highlights: ['highlights', '核心竞争力', '亮点'],
  }

  return [title, ...moduleTerms[module]].some((term) => warning.includes(term))
}

const REPAIR_WARNING_PREFIX = 'AI 输出已自动修正：'

const FIELD_LABELS: Record<string, string> = {
  companyName: '公司',
  coreFunctions: '核心功能',
  degree: '学历',
  description: '描述',
  employmentType: '雇佣类型',
  fieldOfStudy: '专业',
  fullName: '姓名',
  headline: '标题',
  highlights: '亮点',
  keywords: '关键词',
  location: '地点',
  name: '名称',
  role: '角色',
  schoolName: '学校',
  slogans: '标语',
  summary: '摘要',
  title: '标题',
}

interface RepairWarningSummary {
  fallbackRecordIndexes: Set<string>
  fallbackFields: Set<string>
  stringFieldCounts: Map<string, number>
  shorthandFields: Set<string>
  otherWarnings: Set<string>
}

function createRepairWarningSummary(): RepairWarningSummary {
  return {
    fallbackRecordIndexes: new Set(),
    fallbackFields: new Set(),
    stringFieldCounts: new Map(),
    shorthandFields: new Set(),
    otherWarnings: new Set(),
  }
}

function readRepairPath(
  warning: string,
  module: ResumeImportModule,
): { field?: string; recordIndex?: string } | null {
  const escapedModule = module.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  const match = warning.match(new RegExp(`${escapedModule}(?:\\[(\\d+)\\])?\\.([\\w]+)`))

  if (!match) {
    return null
  }

  return {
    recordIndex: match[1],
    field: match[2],
  }
}

function fieldLabel(field: string): string {
  return FIELD_LABELS[field] ?? field
}

function joinLabels(labels: string[]): string {
  return labels.join('、')
}

function summarizeRepairWarning(
  summary: RepairWarningSummary,
  warning: string,
  module: ResumeImportModule,
) {
  const repairBody = warning.replace(REPAIR_WARNING_PREFIX, '')
  const path = readRepairPath(repairBody, module)

  if (!path?.field) {
    summary.otherWarnings.add(warning)
    return
  }

  if (repairBody.includes('兜底为空 LocalizedText')) {
    summary.fallbackFields.add(path.field)

    if (path.recordIndex) {
      summary.fallbackRecordIndexes.add(path.recordIndex)
    }

    return
  }

  if (repairBody.includes('string -> { zh, en }')) {
    summary.stringFieldCounts.set(
      path.field,
      (summary.stringFieldCounts.get(path.field) ?? 0) + 1,
    )
    return
  }

  if (repairBody.includes('补齐') || repairBody.includes('自动修复')) {
    summary.shorthandFields.add(path.field)
    return
  }

  summary.otherWarnings.add(warning)
}

function aggregateModuleWarnings(
  warnings: readonly string[],
  module: ResumeImportModule,
): string[] {
  const moduleWarnings = warnings.filter((warning) =>
    warningMatchesModule(warning, module),
  )
  const businessWarnings = Array.from(
    new Set(
      moduleWarnings.filter((warning) => !warning.startsWith(REPAIR_WARNING_PREFIX)),
    ),
  )
  const repairSummary = createRepairWarningSummary()

  for (const warning of moduleWarnings) {
    if (!warning.startsWith(REPAIR_WARNING_PREFIX)) {
      continue
    }

    summarizeRepairWarning(repairSummary, warning, module)
  }

  const title = getResumeImportModuleTitle(module)
  const repairWarnings: string[] = []

  if (repairSummary.fallbackFields.size > 0) {
    const recordCount = Math.max(1, repairSummary.fallbackRecordIndexes.size)
    repairWarnings.push(
      `${REPAIR_WARNING_PREFIX}${title}中 ${recordCount} 条记录的${joinLabels(
        Array.from(repairSummary.fallbackFields).map(fieldLabel),
      )}已按空值兜底。`,
    )
  }

  for (const [field, count] of repairSummary.stringFieldCounts.entries()) {
    repairWarnings.push(
      `${REPAIR_WARNING_PREFIX}${title}中 ${count} 条${fieldLabel(
        field,
      )}已从 string 转为 { zh, en }。`,
    )
  }

  if (repairSummary.shorthandFields.size > 0) {
    repairWarnings.push(
      `${REPAIR_WARNING_PREFIX}${title}的${joinLabels(
        Array.from(repairSummary.shorthandFields).map(fieldLabel),
      )}已补齐为 { zh, en } 结构。`,
    )
  }

  return [...businessWarnings, ...repairWarnings, ...repairSummary.otherWarnings]
}

/**
 * 构建结果页展示用的完整模块内容。
 */
export function buildResumeImportModuleContents(
  currentResume: StandardResume,
  candidateResume: StandardResume,
  warnings: readonly string[],
): ResumeImportModuleContent[] {
  return RESUME_IMPORT_MODULES.map((module) => ({
    module,
    title: getResumeImportModuleTitle(module),
    currentItems: buildModuleItems(currentResume, module),
    candidateItems: buildModuleItems(candidateResume, module),
    warnings: aggregateModuleWarnings(warnings, module),
  }))
}
