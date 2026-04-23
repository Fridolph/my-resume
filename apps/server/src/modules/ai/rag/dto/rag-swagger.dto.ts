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

  @ApiPropertyOptional({
    description: '最低分数阈值（低于该分数的结果会被过滤）',
    example: 0.55,
    minimum: 0,
  })
  minScore?: number

  @ApiPropertyOptional({
    description: 'Top1 与 Top2 分数断层阈值（达到阈值仅保留 Top1）',
    example: 0.15,
    minimum: 0,
  })
  minScoreGap?: number

  @ApiPropertyOptional({
    description: '是否强制走向量存储检索（用于实验，默认走环境配置）',
    example: true,
  })
  useVectorStore?: boolean

  @ApiPropertyOptional({
    description: '向量检索 scope（用于实验，默认走环境配置）',
    enum: ['draft', 'published', 'all'],
    example: 'published',
  })
  vectorScope?: 'draft' | 'published' | 'all'

  @ApiPropertyOptional({
    description: '向量检索为空/异常时是否回退本地检索（用于实验）',
    example: true,
  })
  vectorFallbackToLocal?: boolean
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

export class RagResumeSyncBodyDto {
  @ApiPropertyOptional({
    description: '简历检索同步范围',
    enum: ['draft', 'published', 'all'],
    example: 'all',
  })
  scope?: 'draft' | 'published' | 'all'
}

export class RagResumeSyncResultDto {
  @ApiProperty({
    description: '草稿态同步结果',
    type: Object,
    example: {
      synced: true,
      sourceVersion: 'draft:1760000000000',
    },
  })
  draft!: {
    synced: boolean
    sourceVersion: string | null
  }

  @ApiProperty({
    description: '发布态同步结果',
    type: Object,
    example: {
      synced: false,
      sourceVersion: null,
    },
  })
  published!: {
    synced: boolean
    sourceVersion: string | null
  }
}

export class RagUserDocIngestBodyDto {
  @ApiPropertyOptional({
    description: 'user_docs 入库作用域',
    enum: ['draft', 'published'],
    example: 'draft',
  })
  scope?: 'draft' | 'published'
}

export class RagUserDocIngestResultDto {
  @ApiProperty({
    description: '文档记录 ID',
    example: 'user-doc:adf932d7b65f01a9eb87bc2d:und',
  })
  documentId!: string

  @ApiProperty({
    description: '来源 ID',
    example: 'adf932d7b65f01a9eb87bc2d',
  })
  sourceId!: string

  @ApiProperty({
    description: '入库作用域',
    enum: ['draft', 'published'],
    example: 'draft',
  })
  sourceScope!: 'draft' | 'published'

  @ApiProperty({
    description: '来源版本键',
    example: 'upload:1776839100000',
  })
  sourceVersion!: string

  @ApiProperty({
    description: '切块数量',
    example: 12,
  })
  chunkCount!: number

  @ApiProperty({
    description: '上传文件名',
    example: 'rag-notes.md',
  })
  fileName!: string

  @ApiProperty({
    description: '上传文件类型',
    enum: ['txt', 'md', 'pdf', 'docx'],
    example: 'md',
  })
  fileType!: 'txt' | 'md' | 'pdf' | 'docx'

  @ApiProperty({
    description: '上传时间（ISO）',
    example: '2026-04-22T03:45:00.000Z',
  })
  uploadedAt!: string
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
