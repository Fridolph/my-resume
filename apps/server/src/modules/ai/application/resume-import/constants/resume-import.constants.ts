import type {
  ResumeImportJobStage,
  ResumeImportModule,
} from '../types/resume-import.types'

/** 简历导入上传文件大小上限：1MB。 */
export const RESUME_IMPORT_MAX_FILE_SIZE_BYTES = 1024 * 1024

/** 可稳定识别的最小文本长度。 */
export const RESUME_IMPORT_MIN_TEXT_CHARS = 500

/** 防止过长文本直接进入 LLM 的最大文本长度。 */
export const RESUME_IMPORT_MAX_TEXT_CHARS = 50_000

/** 识别结果内存缓存 TTL。MVP 暂不落库。 */
export const RESUME_IMPORT_RESULT_TTL_MS = 30 * 60 * 1000

/** 识别结果内存缓存最大数量。 */
export const RESUME_IMPORT_MAX_RESULT_COUNT = 20

/** 识别任务内存缓存 TTL，与结果缓存保持一致。 */
export const RESUME_IMPORT_JOB_TTL_MS = RESUME_IMPORT_RESULT_TTL_MS

/** 识别任务内存缓存最大数量。 */
export const RESUME_IMPORT_MAX_JOB_COUNT = RESUME_IMPORT_MAX_RESULT_COUNT

/** 第一版支持回填的模块顺序。 */
export const RESUME_IMPORT_MODULES: readonly ResumeImportModule[] = [
  'profile',
  'education',
  'experiences',
  'projects',
  'skills',
  'highlights',
]

/** 异步识别 Job 的固定阶段定义。 */
export const RESUME_IMPORT_JOB_STEPS: Array<{
  stage: Exclude<ResumeImportJobStage, 'completed' | 'failed'>
  label: string
}> = [
  {
    stage: 'accepted',
    label: '已接收上传请求',
  },
  {
    stage: 'extracting',
    label: '正在提取文件文本',
  },
  {
    stage: 'text_validating',
    label: '正在校验文本边界',
  },
  {
    stage: 'raw_archiving',
    label: '正在备份上传原文',
  },
  {
    stage: 'format_normalizing',
    label: '正在归一化简历格式',
  },
  {
    stage: 'safety_filtering',
    label: '正在生成输入治理报告',
  },
  {
    stage: 'ai_generating',
    label: '正在调用 AI 生成候选草稿',
  },
  {
    stage: 'json_parsing',
    label: '正在解析 AI JSON 输出',
  },
  {
    stage: 'schema_validating',
    label: '正在校验 StandardResume 结构',
  },
  {
    stage: 'diff_building',
    label: '正在生成模块 diff 看台',
  },
]
