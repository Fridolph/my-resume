import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger'

export class RagSearchBodyDto {
  @ApiProperty({
    description: '检索关键词',
    example: '全栈项目中性能优化经验',
  })
  query!: string

  @ApiPropertyOptional({
    description: '返回数量上限',
    example: 5,
    minimum: 1,
    maximum: 20,
  })
  limit?: number
}

export class RagAskBodyDto {
  @ApiProperty({
    description: '提问内容',
    example: '你在简历里最能体现业务价值的项目是什么',
  })
  question!: string

  @ApiPropertyOptional({
    description: '用于拼接上下文的检索数量',
    example: 4,
    minimum: 1,
    maximum: 20,
  })
  limit?: number

  @ApiPropertyOptional({
    description: '回答语言',
    enum: ['zh', 'en'],
    example: 'zh',
  })
  locale?: 'zh' | 'en'
}

export class RagSearchMatchDto {
  @ApiProperty({
    description: '命中文档块 ID',
    example: 'experience-1',
  })
  id!: string

  @ApiProperty({
    description: '命中文档标题',
    example: 'XX 公司中后台重构项目',
  })
  title!: string

  @ApiProperty({
    description: '命中文档分区',
    example: 'experiences',
  })
  section!: string

  @ApiProperty({
    description: '命中文档内容',
  })
  content!: string

  @ApiProperty({
    description: '混合检索分数',
    example: 0.876543,
  })
  score!: number

  @ApiPropertyOptional({
    description: '来源类型',
    enum: ['resume', 'knowledge'],
    example: 'resume',
  })
  sourceType?: 'resume' | 'knowledge'

  @ApiPropertyOptional({
    description: '来源文件路径',
    example: 'docs/knowledge/opensource.md',
  })
  sourcePath?: string
}

export class RagAskResultDto {
  @ApiProperty({
    description: '问答结果文本',
    example: '你在 XX 项目中主导了架构重构并提升了交付效率',
  })
  answer!: string

  @ApiProperty({
    description: '命中的上下文片段',
    isArray: true,
    type: () => RagSearchMatchDto,
  })
  matches!: RagSearchMatchDto[]

  @ApiProperty({
    description: '本次问答使用的 provider 摘要',
    type: Object,
  })
  providerSummary!: Record<string, unknown>
}

export class RagStatusDto {
  @ApiProperty({
    description: '源简历文件路径',
    example: '/workspace/apps/server/resources/rag/resume.yaml',
  })
  sourcePath!: string

  @ApiProperty({
    description: '知识库目录路径',
    example: '/workspace/docs/knowledge',
  })
  blogDirectoryPath!: string

  @ApiProperty({
    description: '索引文件路径',
    example: '/workspace/.data/rag/index.json',
  })
  indexPath!: string

  @ApiProperty({
    description: '索引是否已构建',
    example: true,
  })
  indexed!: boolean

  @ApiProperty({
    description: '索引是否过期',
    example: false,
  })
  stale!: boolean

  @ApiProperty({
    description: '总 chunk 数',
    example: 42,
  })
  chunkCount!: number

  @ApiProperty({
    description: '简历来源 chunk 数',
    example: 28,
  })
  resumeChunkCount!: number

  @ApiProperty({
    description: '知识库来源 chunk 数',
    example: 14,
  })
  knowledgeChunkCount!: number

  @ApiPropertyOptional({
    description: '索引生成时间',
    example: '2026-04-20T12:00:00.000Z',
    nullable: true,
  })
  generatedAt!: string | null

  @ApiProperty({
    description: '当前源内容哈希',
    example: 'sha256-hash',
  })
  currentSourceHash!: string

  @ApiProperty({
    description: '当前知识库哈希',
    example: 'sha256-hash',
  })
  currentKnowledgeHash!: string

  @ApiPropertyOptional({
    description: '已索引源内容哈希',
    nullable: true,
    example: 'sha256-hash',
  })
  indexedSourceHash!: string | null

  @ApiPropertyOptional({
    description: '已索引知识库哈希',
    nullable: true,
    example: 'sha256-hash',
  })
  indexedKnowledgeHash!: string | null

  @ApiProperty({
    description: '当前 provider 摘要',
    type: Object,
  })
  providerSummary!: Record<string, unknown>

  @ApiPropertyOptional({
    description: '索引构建时 provider 摘要',
    nullable: true,
    type: Object,
  })
  indexedProviderSummary!: Record<string, unknown> | null
}
