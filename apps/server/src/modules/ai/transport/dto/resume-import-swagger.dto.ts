import { ApiProperty } from '@nestjs/swagger'

import type { ResumeImportModule } from '../../application/services/resume-import-recognition.service'

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
