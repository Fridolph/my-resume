import type {
  ProjectRecord,
  ProjectVersionRecord,
  ResumeDocument,
  ResumeVersionRecord,
  TranslationRecord,
  TranslationVersionRecord,
  WebLocale
} from '@repo/types'

interface VersionInsightItem {
  label: string
  value: string
  hint?: string
}

interface VersionInsightResult {
  changed: boolean
  changeLabel: string
  changeColor: 'success' | 'warning' | 'neutral'
  highlights: string[]
  summaryItems: VersionInsightItem[]
}

function uniqueHighlights(items: string[]) {
  return [...new Set(items.filter(Boolean))].slice(0, 4)
}

export function useContentVersionInsights() {
  function getTranslationVersionInsights(version: TranslationVersionRecord, currentRecord: TranslationRecord): VersionInsightResult {
    const sameValue = version.snapshot.value === currentRecord.value
    const sameStatus = version.status === currentRecord.status
    const valueLength = String(version.snapshot.value || '').length
    const currentLength = String(currentRecord.value || '').length
    const highlights = uniqueHighlights([
      sameValue ? '' : '文案内容不同',
      sameStatus ? '' : '发布状态不同',
      valueLength === currentLength ? '' : '文案长度不同'
    ])

    return {
      changed: !(sameValue && sameStatus),
      changeLabel: sameValue && sameStatus ? '与当前内容一致' : '与当前内容有差异',
      changeColor: sameValue && sameStatus ? 'success' : 'warning',
      highlights,
      summaryItems: [
        {
          label: '历史状态',
          value: version.status,
          hint: sameStatus ? '与当前状态一致。' : `当前状态为 ${currentRecord.status}。`
        },
        {
          label: '历史文案长度',
          value: String(valueLength),
          hint: `当前文案长度为 ${currentLength}。`
        }
      ]
    }
  }

  function getResumeVersionInsights(version: ResumeVersionRecord, currentDocument: ResumeDocument, locale: WebLocale): VersionInsightResult {
    const versionLocale = version.snapshot.locales[locale]
    const currentLocale = currentDocument.locales[locale]

    const versionEducationCount = versionLocale?.education.length ?? 0
    const currentEducationCount = currentLocale?.education.length ?? 0
    const versionExperienceCount = versionLocale?.experiences.length ?? 0
    const currentExperienceCount = currentLocale?.experiences.length ?? 0
    const versionSkillGroupCount = versionLocale?.skillGroups.length ?? 0
    const currentSkillGroupCount = currentLocale?.skillGroups.length ?? 0
    const versionContactCount = versionLocale?.contacts.length ?? 0
    const currentContactCount = currentLocale?.contacts.length ?? 0
    const sameHeadline = versionLocale?.baseInfo.headline === currentLocale?.baseInfo.headline

    const highlights = uniqueHighlights([
      sameHeadline ? '' : '岗位标题不同',
      versionEducationCount === currentEducationCount ? '' : '教育经历数量不同',
      versionExperienceCount === currentExperienceCount ? '' : '工作经历数量不同',
      versionSkillGroupCount === currentSkillGroupCount ? '' : '技能组数量不同',
      versionContactCount === currentContactCount ? '' : '联系方式数量不同'
    ])

    return {
      changed: highlights.length > 0,
      changeLabel: highlights.length > 0 ? '与当前简历有差异' : '与当前简历结构一致',
      changeColor: highlights.length > 0 ? 'warning' : 'success',
      highlights,
      summaryItems: [
        {
          label: '教育经历',
          value: String(versionEducationCount),
          hint: `当前为 ${currentEducationCount} 条。`
        },
        {
          label: '工作经历',
          value: String(versionExperienceCount),
          hint: `当前为 ${currentExperienceCount} 条。`
        },
        {
          label: '技能组',
          value: String(versionSkillGroupCount),
          hint: `当前为 ${currentSkillGroupCount} 组。`
        },
        {
          label: '联系方式',
          value: String(versionContactCount),
          hint: `当前为 ${currentContactCount} 条。`
        }
      ]
    }
  }

  function getProjectVersionInsights(version: ProjectVersionRecord, currentProject: ProjectRecord, locale: WebLocale): VersionInsightResult {
    const versionLocale = version.snapshot.locales[locale]
    const currentLocale = currentProject.locales[locale]
    const sameTitle = versionLocale?.title === currentLocale?.title
    const sameSortOrder = version.snapshot.sortOrder === currentProject.sortOrder
    const sameTagsCount = version.snapshot.tags.length === currentProject.tags.length
    const sameExternalUrl = version.snapshot.externalUrl === currentProject.externalUrl
    const sameCover = version.snapshot.cover === currentProject.cover

    const highlights = uniqueHighlights([
      sameTitle ? '' : '项目标题不同',
      sameSortOrder ? '' : '排序值不同',
      sameTagsCount ? '' : '标签数量不同',
      sameExternalUrl ? '' : '项目外链不同',
      sameCover ? '' : '封面图不同'
    ])

    return {
      changed: highlights.length > 0,
      changeLabel: highlights.length > 0 ? '与当前项目有差异' : '与当前项目结构一致',
      changeColor: highlights.length > 0 ? 'warning' : 'success',
      highlights,
      summaryItems: [
        {
          label: '标签数量',
          value: String(version.snapshot.tags.length),
          hint: `当前为 ${currentProject.tags.length} 个。`
        },
        {
          label: '排序值',
          value: String(version.snapshot.sortOrder),
          hint: `当前为 ${currentProject.sortOrder}。`
        },
        {
          label: '外链状态',
          value: version.snapshot.externalUrl ? '已填写' : '未填写',
          hint: currentProject.externalUrl ? '当前外链已填写。' : '当前外链未填写。'
        },
        {
          label: '封面状态',
          value: version.snapshot.cover ? '已填写' : '未填写',
          hint: currentProject.cover ? '当前封面已填写。' : '当前封面未填写。'
        }
      ]
    }
  }

  return {
    getTranslationVersionInsights,
    getResumeVersionInsights,
    getProjectVersionInsights
  }
}
