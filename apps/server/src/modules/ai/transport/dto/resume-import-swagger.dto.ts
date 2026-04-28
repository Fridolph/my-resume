import { ApiProperty } from '@nestjs/swagger'

import type {
  ResumeImportJobStage,
  ResumeImportJobStatus,
  ResumeImportJobStepStatus,
  ResumeImportModule,
} from '../../application/services/resume-import-recognition.service'

const RESUME_IMPORT_MODULE_ENUM: ResumeImportModule[] = [
  'profile',
  'education',
  'experiences',
  'projects',
  'skills',
  'highlights',
]

export class ApplyResumeImportBodyDto {
  @ApiProperty({
    description: '简历导入识别结果 ID',
    example: 'result-123456',
  })
  resultId!: string

  @ApiProperty({
    description: '要写回当前草稿的模块',
    enum: RESUME_IMPORT_MODULE_ENUM,
    example: ['profile', 'experiences', 'projects'],
    isArray: true,
  })
  modules!: ResumeImportModule[]
}

const RESUME_IMPORT_JOB_STAGE_ENUM: ResumeImportJobStage[] = [
  'accepted',
  'extracting',
  'text_validating',
  'ai_generating',
  'json_parsing',
  'schema_validating',
  'diff_building',
  'completed',
  'failed',
]

const RESUME_IMPORT_JOB_STATUS_ENUM: ResumeImportJobStatus[] = [
  'running',
  'completed',
  'failed',
]

const RESUME_IMPORT_JOB_STEP_STATUS_ENUM: ResumeImportJobStepStatus[] = [
  'pending',
  'running',
  'completed',
  'failed',
]

export class ResumeImportJobDto {
  @ApiProperty({
    description: '识别任务 ID',
    example: 'job-123456',
  })
  jobId!: string

  @ApiProperty({
    description: '任务状态',
    enum: RESUME_IMPORT_JOB_STATUS_ENUM,
    example: 'running',
  })
  status!: ResumeImportJobStatus

  @ApiProperty({
    description: '当前阶段',
    enum: RESUME_IMPORT_JOB_STAGE_ENUM,
    example: 'ai_generating',
  })
  currentStage!: ResumeImportJobStage

  @ApiProperty({
    description: '阶段时间线',
    isArray: true,
    type: Object,
  })
  steps!: Array<{
    stage: ResumeImportJobStage
    label: string
    status: ResumeImportJobStepStatus
    startedAt?: string
    completedAt?: string
    message?: string
  }>

  @ApiProperty({
    description: '任务创建时间',
    example: '2026-04-28T12:00:00.000Z',
  })
  createdAt!: string

  @ApiProperty({
    description: '任务更新时间',
    example: '2026-04-28T12:00:03.000Z',
  })
  updatedAt!: string

  @ApiProperty({
    description: '已耗时毫秒',
    example: 3200,
  })
  elapsedMs!: number

  @ApiProperty({
    description: '完成后的识别结果 ID',
    example: 'result-123456',
    required: false,
  })
  resultId?: string

  @ApiProperty({
    description: '失败详情',
    required: false,
    type: Object,
  })
  error?: {
    message: string
    traceId?: string
  }
}

export class ResumeImportResultDto {
  @ApiProperty({
    description: '识别结果 ID',
    example: 'result-123456',
  })
  resultId!: string

  @ApiProperty({
    description: '识别语言',
    example: 'zh',
  })
  locale!: string

  @ApiProperty({
    description: '上传文件名',
    example: 'lifeiyu-mock-zh.md',
  })
  fileName!: string

  @ApiProperty({
    description: '上传文件类型',
    enum: ['txt', 'md'],
    example: 'md',
  })
  fileType!: string

  @ApiProperty({
    description: '提取后文本长度',
    example: 12000,
  })
  charCount!: number

  @ApiProperty({
    description: '识别摘要',
    example: '已从上传简历中识别出结构化候选草稿。',
  })
  summary!: string

  @ApiProperty({
    description: '识别风险或质量提醒',
    isArray: true,
    type: 'string',
  })
  warnings!: string[]

  @ApiProperty({
    description: '发生变化的模块',
    enum: RESUME_IMPORT_MODULE_ENUM,
    isArray: true,
  })
  changedModules!: ResumeImportModule[]

  @ApiProperty({
    description: '模块级 diff',
    isArray: true,
    type: Object,
  })
  moduleDiffs!: Record<string, unknown>[]

  @ApiProperty({
    description: '模块统计',
    type: Object,
  })
  moduleStats!: Record<string, number>

  @ApiProperty({
    description: '创建时间',
    example: '2026-04-28T12:00:00.000Z',
  })
  createdAt!: string

  @ApiProperty({
    description: 'Provider 摘要',
    type: Object,
  })
  providerSummary!: Record<string, unknown>
}
