import { BadRequestException } from '@nestjs/common'

import type { StandardResume } from '../../../../resume/domain/standard-resume'
import { RESUME_IMPORT_MODULES } from '../constants/resume-import.constants'
import type { ResumeImportModule } from '../types/resume-import.types'

/**
 * 格式化上传文件大小，用于 Job 阶段摘要。
 */
export function formatResumeImportFileSize(size: number): string {
  if (size < 1024) {
    return `${size} B`
  }

  return `${(size / 1024).toFixed(1)} KB`
}

/**
 * 读取上传文件扩展名，用于导入识别第一层文件类型边界。
 */
export function readFileExtension(fileName: string): string {
  return fileName.split('.').pop()?.trim().toLowerCase() ?? ''
}

/**
 * 深拷贝 StandardResume，避免 apply 时意外修改缓存或原始 draft。
 */
export function cloneResume(resume: StandardResume): StandardResume {
  return JSON.parse(JSON.stringify(resume)) as StandardResume
}

/**
 * 归一化 apply 请求中的模块列表，并拒绝空选择或非法模块。
 */
export function normalizeResumeImportModules(modules: unknown): ResumeImportModule[] {
  if (!Array.isArray(modules)) {
    throw new BadRequestException('请选择要回填的简历模块')
  }

  const selectedModules = modules.filter((module): module is ResumeImportModule =>
    RESUME_IMPORT_MODULES.includes(module as ResumeImportModule),
  )

  if (selectedModules.length === 0) {
    throw new BadRequestException('请选择至少一个可回填模块')
  }

  return Array.from(new Set(selectedModules))
}

/**
 * 把 StandardResume 校验错误转换为更适合在 Job 详情中展示的中文文案。
 */
export function formatResumeImportValidationError(error: string): string {
  const localizedTextMatch = error.match(
    /^(profile|education|experiences|projects|skills|highlights)(?:\[(\d+)])?\.?(.+?) must be a localized text object$/,
  )

  if (!localizedTextMatch) {
    return error
  }

  const [, module, index, field] = localizedTextMatch
  const moduleLabels: Record<string, string> = {
    profile: '基本信息',
    education: '教育经历',
    experiences: '工作经历',
    projects: '项目经历',
    skills: '专业技能',
    highlights: '核心竞争力',
  }
  const prefix =
    typeof index === 'string'
      ? `${moduleLabels[module] ?? module}第 ${Number(index) + 1} 条`
      : (moduleLabels[module] ?? module)

  return `${prefix}：${field} 必须是 { zh, en } 结构`
}
