import type { StandardResume } from '../../../../resume/domain/standard-resume'
import { RESUME_IMPORT_MODULES } from '../constants/resume-import.constants'
import type {
  ResumeImportDiffStatus,
  ResumeImportModule,
  ResumeImportModuleDiff,
} from '../types/resume-import.types'

/**
 * 生成模块摘要，避免 diff 看台直接展示完整 JSON。
 */
function summarizeModule(value: unknown): string {
  if (Array.isArray(value)) {
    return `${value.length} 条`
  }

  if (!value || typeof value !== 'object') {
    return ''
  }

  return JSON.stringify(value).slice(0, 180)
}

/**
 * 判断候选草稿与当前草稿在指定模块上是否有差异。
 */
export function isResumeImportModuleChanged(
  currentResume: StandardResume,
  candidateResume: StandardResume,
  module: ResumeImportModule,
): boolean {
  return JSON.stringify(currentResume[module]) !== JSON.stringify(candidateResume[module])
}

/**
 * 模块名到中文展示标题的映射。
 */
export function getResumeImportModuleTitle(module: ResumeImportModule): string {
  const titles: Record<ResumeImportModule, string> = {
    profile: '基本信息',
    education: '教育经历',
    experiences: '工作经历',
    projects: '项目经历',
    skills: '专业技能',
    highlights: '核心竞争力',
  }

  return titles[module]
}

/**
 * 构建当前 draft 与候选草稿之间的模块级 diff。
 */
export function buildResumeImportModuleDiffs(
  currentResume: StandardResume,
  candidateResume: StandardResume,
  warnings: readonly string[],
): ResumeImportModuleDiff[] {
  return RESUME_IMPORT_MODULES.map((module) => {
    const currentValue = currentResume[module]
    const suggestedValue = candidateResume[module]
    const changed = isResumeImportModuleChanged(currentResume, candidateResume, module)
    const currentEmpty = Array.isArray(currentValue) ? currentValue.length === 0 : false
    const suggestedEmpty = Array.isArray(suggestedValue)
      ? suggestedValue.length === 0
      : false
    const title = getResumeImportModuleTitle(module)
    const warning = warnings.find((item) => item.includes(title))
    const status: ResumeImportDiffStatus = warning
      ? 'warning'
      : changed && currentEmpty && !suggestedEmpty
        ? 'added'
        : changed
          ? 'changed'
          : 'unchanged'

    return {
      module,
      title,
      status,
      reason: changed
        ? `AI 识别结果与当前草稿的${title}存在差异，可按模块确认后写回。`
        : `AI 识别结果与当前草稿的${title}暂无明显差异。`,
      entries: [
        {
          key: module,
          label: title,
          currentValue: summarizeModule(currentValue),
          suggestedValue: summarizeModule(suggestedValue),
          status,
          warning,
        },
      ],
    }
  })
}
