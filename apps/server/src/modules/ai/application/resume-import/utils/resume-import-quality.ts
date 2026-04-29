import type { StandardResume } from '../../../../resume/domain/standard-resume'

/**
 * 从候选草稿中收集不阻断 apply 的质量提醒。
 */
export function collectResumeImportWarnings(resume: StandardResume): string[] {
  const warnings: string[] = []

  if (!resume.education.length) {
    warnings.push('教育经历未识别到内容，请在回填前确认。')
  }

  if (!resume.projects.length) {
    warnings.push('项目经历未识别到内容，请在回填前确认。')
  }

  if (!resume.profile.email || !resume.profile.phone) {
    warnings.push('基本信息中的联系方式不完整，请手动核对。')
  }

  if (resume.skills.length < 3) {
    warnings.push('专业技能模块偏少，建议回填前补充或调整。')
  }

  return warnings
}
