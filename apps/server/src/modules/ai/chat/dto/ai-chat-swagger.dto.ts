import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger'

export class AiChatLeadBodyDto {
  @ApiProperty({ example: '李飞宇' })
  displayName!: string

  @ApiPropertyOptional({ example: '某科技公司' })
  companyName?: string

  @ApiPropertyOptional({ example: 'wechat / email / phone' })
  contact?: string

  @ApiProperty({ example: '想了解候选人的项目经历与技术深度。' })
  message!: string

  @ApiPropertyOptional({ enum: ['zh', 'en'], example: 'zh' })
  locale?: 'zh' | 'en'
}

export class AiChatClaimUseKeyBodyDto {
  @ApiProperty({ example: 'FY-1A2B3C4D' })
  useKey!: string

  @ApiPropertyOptional({ enum: ['zh', 'en'], example: 'zh' })
  locale?: 'zh' | 'en'
}

export class AiChatClaimPublicSessionBodyDto {
  @ApiProperty({ example: true })
  consentAccepted!: boolean

  @ApiPropertyOptional({ enum: ['zh', 'en'], example: 'zh' })
  locale?: 'zh' | 'en'
}

export class AiChatAskMessageBodyDto {
  @ApiProperty({ example: '他最近几年做过哪些项目？' })
  content!: string

  @ApiProperty({ example: 'FY-1A2B3C4D' })
  useKey!: string

  @ApiPropertyOptional({ enum: ['zh', 'en'], example: 'zh' })
  locale?: 'zh' | 'en'
}

export class AiChatCloseSessionBodyDto {
  @ApiProperty({ example: 'FY-1A2B3C4D' })
  useKey!: string
}

export class AiChatIssueUseKeyBodyDto {
  @ApiProperty({ example: 'lead-001' })
  leadId!: string

  @ApiPropertyOptional({ example: '2026-05-31T23:59:59.000Z' })
  expiresAt?: string

  @ApiPropertyOptional({ enum: ['zh', 'en'], example: 'zh' })
  locale?: 'zh' | 'en'
}
