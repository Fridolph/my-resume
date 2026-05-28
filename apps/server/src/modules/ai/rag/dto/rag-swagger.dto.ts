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

  @ApiPropertyOptional({
    description: '切片策略 profile（默认 semantic 按 ## 标题分段）',
    enum: ['balanced', 'contextual', 'semantic'],
    example: 'semantic',
  })
  chunkingProfile?: 'balanced' | 'contextual' | 'semantic'

  @ApiPropertyOptional({
    description: '内容类型：article=文章，hobby=兴趣爱好，media=媒体/视频，general=通用',
    enum: ['article', 'hobby', 'media', 'general'],
    example: 'article',
  })
  contentType?: 'article' | 'hobby' | 'media' | 'general'

  @ApiPropertyOptional({
    description: '资料标题（优先于文件名），支持 UTF-8 中文',
    example: '我的易经学习心得',
  })
  title?: string

  @ApiPropertyOptional({
    description: '自定义切片大小，优先级高于 profile',
    maximum: 6666,
    minimum: 4,
    example: 512,
  })
  chunkSize?: number

  @ApiPropertyOptional({
    description: '自定义切片重叠，必须小于 chunkSize',
    maximum: 300,
    minimum: 0,
    example: 100,
  })
  chunkOverlap?: number
}

export class RagCustomBodyDto {
  @ApiPropertyOptional({ description: '资料标题', example: '我的易经学习心得' })
  title?: string

  @ApiProperty({ description: '正文内容，支持 Markdown', example: '# 易经\n\n这是我的易经学习笔记...' })
  content!: string

  @ApiPropertyOptional({ description: '内容类型', enum: ['article', 'hobby', 'media', 'general'], example: 'hobby' })
  contentType?: 'article' | 'hobby' | 'media' | 'general'

  @ApiPropertyOptional({ description: '入库作用域', enum: ['draft', 'published'], example: 'published' })
  scope?: 'draft' | 'published'

  @ApiPropertyOptional({ description: '相关链接', example: 'https://example.com' })
  linkUrl?: string
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
    description: '切片策略 profile',
    enum: ['balanced', 'contextual'],
    example: 'balanced',
  })
  chunkingProfile!: 'balanced' | 'contextual'

  @ApiProperty({
    description: '切片大小（字符）',
    example: 500,
  })
  chunkSize!: number

  @ApiProperty({
    description: '切片重叠（字符）',
    example: 50,
  })
  chunkOverlap!: number

  @ApiProperty({
    description: '上传时间（ISO）',
    example: '2026-04-22T03:45:00.000Z',
  })
  uploadedAt!: string

  @ApiProperty({
    description: '本次 user_docs 同步使用的向量存储后端',
    enum: ['local', 'milvus'],
    example: 'local',
  })
  vectorStoreBackend!: 'local' | 'milvus'

  @ApiProperty({
    description: '向量存储是否同步成功；false 表示已降级，仅 SQLite 检索态成功',
    example: false,
  })
  vectorStoreSynced!: boolean

  @ApiPropertyOptional({
    description: '向量存储降级提示；为 null 表示未发生降级',
    nullable: true,
    example: 'Milvus search unavailable at http://127.0.0.1:19530: connect ECONNREFUSED',
  })
  vectorStoreWarning!: string | null
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
    enum: ['resume', 'knowledge', 'resume_core', 'user_docs'],
    example: 'resume_core',
  })
  sourceType?: 'resume' | 'knowledge' | 'resume_core' | 'user_docs'

  @ApiPropertyOptional({
    description: '来源文件路径',
    example: 'docs/knowledge/opensource.md',
  })
  sourcePath?: string
}

export class RagAskCitationDto {
  @ApiProperty({
    description: '回答引用序号',
    example: '#1',
  })
  ref!: string

  @ApiProperty({
    description: '命中 chunk ID',
    example: 'experience-1',
  })
  id!: string

  @ApiProperty({
    description: '引用来源标题',
    example: 'XX 公司中后台重构项目',
  })
  title!: string

  @ApiProperty({
    description: '引用来源分区',
    example: 'experiences',
  })
  section!: string

  @ApiProperty({
    description: '统一后的引用来源类型',
    enum: ['resume_core', 'user_docs'],
    example: 'resume_core',
  })
  sourceType!: 'resume_core' | 'user_docs'

  @ApiPropertyOptional({
    description: '来源文件路径或文件名',
    example: 'rag-notes.md',
  })
  sourcePath?: string

  @ApiProperty({
    description: '检索分数',
    example: 0.876543,
  })
  score!: number

  @ApiProperty({
    description: '引用片段短摘录',
    example: '负责 ToB 安全平台的前端架构与交付...',
  })
  snippet!: string
}

export class RagAskResultDto {
  @ApiProperty({
    description: '问答结果文本',
    example: '你在 XX 项目中主导了架构重构并提升了交付效率',
  })
  answer!: string

  @ApiProperty({
    description: '回答引用列表；为空时表示上下文不足，回答不得编造。',
    isArray: true,
    type: () => RagAskCitationDto,
  })
  citations!: RagAskCitationDto[]

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

  @ApiProperty({
    description: '当前配置的向量后端',
    enum: ['local', 'milvus'],
    example: 'local',
  })
  configuredVectorBackend!: 'local' | 'milvus'

  @ApiProperty({
    description: '当前是否启用了向量检索链路',
    example: false,
  })
  vectorStoreEnabled!: boolean

  @ApiPropertyOptional({
    description: '向量存储可用性；local 模式返回 null',
    nullable: true,
    example: false,
  })
  vectorStoreAvailable!: boolean | null

  @ApiProperty({
    description: '当前生效的检索模式',
    enum: ['local', 'vector', 'vector_with_local_fallback'],
    example: 'vector_with_local_fallback',
  })
  effectiveSearchMode!: 'local' | 'vector' | 'vector_with_local_fallback'

  @ApiPropertyOptional({
    description: '最近一次向量存储错误；无错误时返回 null',
    nullable: true,
    example: 'Milvus search unavailable at http://127.0.0.1:19530: connect ECONNREFUSED',
  })
  lastVectorStoreError!: string | null

  @ApiPropertyOptional({
    description: '索引构建时 provider 摘要',
    nullable: true,
    type: Object,
  })
  indexedProviderSummary!: Record<string, unknown> | null
}
