import {
  BadGatewayException,
  BadRequestException,
  ConflictException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common'
import { randomUUID } from 'node:crypto'

import { ResumePublicationService } from '../../../resume/resume-publication.service'
import {
  createEmptyStandardResume,
  createLocalizedText,
  normalizeStandardResume,
  validateStandardResume,
  type LocalizedText,
  type ResumeHighlightItem,
  type ResumeLocale,
  type StandardResume,
} from '../../../resume/domain/standard-resume'
import { AiService } from './ai.service'
import { FileExtractionService } from './file-extraction.service'

export type ResumeImportModule =
  | 'profile'
  | 'education'
  | 'experiences'
  | 'projects'
  | 'skills'
  | 'highlights'

export type ResumeImportDiffStatus = 'added' | 'changed' | 'unchanged' | 'warning'

export interface RecognizeResumeImportInput {
  buffer: Buffer
  traceId?: string
  originalname: string
  mimetype: string
  size: number
}

export interface ApplyResumeImportInput {
  resultId: string
  modules: ResumeImportModule[]
}

export interface ResumeImportModuleDiffEntry {
  key: string
  label: string
  currentValue: string
  suggestedValue: string
  status: ResumeImportDiffStatus
  warning?: string
}

export interface ResumeImportModuleDiff {
  module: ResumeImportModule
  title: string
  status: ResumeImportDiffStatus
  reason: string
  entries: ResumeImportModuleDiffEntry[]
}

export interface ResumeImportResultDetail {
  resultId: string
  locale: ResumeLocale
  fileName: string
  fileType: 'txt' | 'md'
  charCount: number
  summary: string
  warnings: string[]
  changedModules: ResumeImportModule[]
  moduleDiffs: ResumeImportModuleDiff[]
  moduleStats: {
    education: number
    experiences: number
    projects: number
    skills: number
    highlights: number
  }
  createdAt: string
  providerSummary: {
    provider: string
    model: string
    mode: string
  }
}

export type ResumeImportJobStage =
  | 'accepted'
  | 'extracting'
  | 'text_validating'
  | 'ai_generating'
  | 'json_parsing'
  | 'schema_validating'
  | 'diff_building'
  | 'completed'
  | 'failed'

export type ResumeImportJobStatus = 'running' | 'completed' | 'failed'

export type ResumeImportJobStepStatus = 'pending' | 'running' | 'completed' | 'failed'

export interface ResumeImportJobStep {
  stage: ResumeImportJobStage
  label: string
  status: ResumeImportJobStepStatus
  startedAt?: string
  completedAt?: string
  message?: string
}

export interface ResumeImportJobError {
  message: string
  traceId?: string
}

export interface ResumeImportJobDetail {
  jobId: string
  status: ResumeImportJobStatus
  currentStage: ResumeImportJobStage
  steps: ResumeImportJobStep[]
  createdAt: string
  updatedAt: string
  elapsedMs: number
  resultId?: string
  error?: ResumeImportJobError
}

interface CachedResumeImportResult {
  candidateResume: StandardResume
  createdAt: string
  detail: ResumeImportResultDetail
  draftUpdatedAt: string
}

interface CachedResumeImportJob {
  createdAt: string
  detail: Omit<ResumeImportJobDetail, 'elapsedMs'>
}

interface ProviderResumeImportPayload {
  resume: StandardResume
  summary?: string
  warnings?: string[]
}

const MAX_FILE_SIZE_BYTES = 1024 * 1024
const MIN_TEXT_CHARS = 500
const MAX_TEXT_CHARS = 50_000
const RESULT_TTL_MS = 30 * 60 * 1000
const MAX_RESULT_COUNT = 20
const JOB_TTL_MS = RESULT_TTL_MS
const MAX_JOB_COUNT = MAX_RESULT_COUNT
const RESUME_IMPORT_MODULES: readonly ResumeImportModule[] = [
  'profile',
  'education',
  'experiences',
  'projects',
  'skills',
  'highlights',
]
const RESUME_IMPORT_JOB_STEPS: Array<{
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

function readFileExtension(fileName: string): string {
  return fileName.split('.').pop()?.trim().toLowerCase() ?? ''
}

function cloneResume(resume: StandardResume): StandardResume {
  return JSON.parse(JSON.stringify(resume)) as StandardResume
}

function localizedZh(value: string): LocalizedText {
  return createLocalizedText(value.trim(), '')
}

function sectionBetween(text: string, startTitle: string, endTitles: string[]): string {
  const startIndex = text.indexOf(startTitle)

  if (startIndex < 0) {
    return ''
  }

  const contentStart = startIndex + startTitle.length
  const endIndexes = endTitles
    .map((title) => text.indexOf(title, contentStart))
    .filter((index) => index >= 0)
  const endIndex = endIndexes.length > 0 ? Math.min(...endIndexes) : text.length

  return text.slice(contentStart, endIndex).trim()
}

function splitByMarkdownHeading(
  section: string,
): Array<{ title: string; meta: string; body: string }> {
  const headingPattern = /^ {0,4}###\s+(?:\*\*(.+?)\*\*|(.+?))(?:\s*（(.+?)）)?\s*$/gm
  const matches = Array.from(section.matchAll(headingPattern))

  return matches.map((match, index) => {
    const start = (match.index ?? 0) + match[0].length
    const end = matches[index + 1]?.index ?? section.length

    return {
      title: (match[1] ?? match[2] ?? '').trim(),
      meta: match[3]?.trim() ?? '',
      body: section.slice(start, end).trim(),
    }
  })
}

function extractField(body: string, label: string): string {
  const escapedLabel = label.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  const pattern = new RegExp(`\\*\\*${escapedLabel}：\\*\\*\\s*([^\\n]+)`)
  const match = body.match(pattern)

  return match?.[1]?.trim() ?? ''
}

function extractListAfterLabel(body: string, label: string): string[] {
  const escapedLabel = label.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  const pattern = new RegExp(
    `\\*\\*${escapedLabel}：\\*\\*([\\s\\S]*?)(?=\\n\\s*\\*\\*|$)`,
  )
  const match = body.match(pattern)

  if (!match?.[1]) {
    return []
  }

  return match[1]
    .split('\n')
    .map((line) => line.replace(/^\s*-\s*/, '').trim())
    .filter(Boolean)
}

function splitTechStack(value: string): string[] {
  return value
    .split('/')
    .map((item) => item.trim())
    .filter(Boolean)
}

function splitPeriod(value: string): { startDate: string; endDate: string } {
  const [startDate = '', endDate = ''] = value.split('-').map((item) => item.trim())

  return {
    startDate,
    endDate,
  }
}

function summarizeModule(value: unknown): string {
  if (Array.isArray(value)) {
    return `${value.length} 条`
  }

  if (!value || typeof value !== 'object') {
    return ''
  }

  return JSON.stringify(value).slice(0, 180)
}

function isModuleChanged(
  currentResume: StandardResume,
  candidateResume: StandardResume,
  module: ResumeImportModule,
): boolean {
  return JSON.stringify(currentResume[module]) !== JSON.stringify(candidateResume[module])
}

function moduleTitle(module: ResumeImportModule): string {
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

function buildModuleDiffs(
  currentResume: StandardResume,
  candidateResume: StandardResume,
  warnings: readonly string[],
): ResumeImportModuleDiff[] {
  return RESUME_IMPORT_MODULES.map((module) => {
    const currentValue = currentResume[module]
    const suggestedValue = candidateResume[module]
    const changed = isModuleChanged(currentResume, candidateResume, module)
    const currentEmpty = Array.isArray(currentValue) ? currentValue.length === 0 : false
    const suggestedEmpty = Array.isArray(suggestedValue)
      ? suggestedValue.length === 0
      : false
    const warning = warnings.find((item) => item.includes(moduleTitle(module)))
    const status: ResumeImportDiffStatus = warning
      ? 'warning'
      : changed && currentEmpty && !suggestedEmpty
        ? 'added'
        : changed
          ? 'changed'
          : 'unchanged'

    return {
      module,
      title: moduleTitle(module),
      status,
      reason: changed
        ? `AI 识别结果与当前草稿的${moduleTitle(module)}存在差异，可按模块确认后写回。`
        : `AI 识别结果与当前草稿的${moduleTitle(module)}暂无明显差异。`,
      entries: [
        {
          key: module,
          label: moduleTitle(module),
          currentValue: summarizeModule(currentValue),
          suggestedValue: summarizeModule(suggestedValue),
          status,
          warning,
        },
      ],
    }
  })
}

function extractJsonObject(rawText: string): string {
  const fencedMatch = rawText.match(/```(?:json)?\s*([\s\S]*?)```/i)

  if (fencedMatch?.[1]) {
    return fencedMatch[1].trim()
  }

  const firstBrace = rawText.indexOf('{')
  const lastBrace = rawText.lastIndexOf('}')

  if (firstBrace < 0 || lastBrace <= firstBrace) {
    throw new BadGatewayException('AI 未返回可解析的 JSON 结果')
  }

  return rawText.slice(firstBrace, lastBrace + 1).trim()
}

function parseProfileTable(text: string) {
  const tableRows = text
    .split('\n')
    .filter((line) => line.startsWith('|') && !line.includes('---') && line.includes('|'))
  const tableRow = tableRows.find((line) => !line.includes('姓名')) ?? tableRows[0]
  const cells =
    tableRow
      ?.split('|')
      .map((item) => item.trim())
      .filter(Boolean) ?? []

  return {
    fullName: cells[0] ?? '',
    education: cells[1] ?? '',
    experienceYears: cells[2] ?? '',
    headline: cells[3] ?? '',
    location: cells[4] ?? '',
  }
}

function parseMockResumeFromMarkdown(text: string): StandardResume {
  const resume = createEmptyStandardResume()
  const profileTable = parseProfileTable(text)
  const headingName = text.match(/^#\s+(.+)$/m)?.[1]?.trim() ?? profileTable.fullName
  const email = text.match(/Email:\s*([^\s|]+)/i)?.[1]?.trim() ?? ''
  const phone = text.match(/Phone:\s*([^\s|]+)/i)?.[1]?.trim() ?? ''
  const profileSection = sectionBetween(text, '## 基本信息', ['## 核心竞争力'])
  const summary = profileSection
    .split('\n')
    .map((line) => line.trim())
    .filter(
      (line) =>
        line &&
        !line.startsWith('#') &&
        !line.startsWith('|') &&
        !line.includes('Email:'),
    )
    .join('\n')

  resume.profile.fullName = localizedZh(headingName)
  resume.profile.headline = localizedZh(profileTable.headline)
  resume.profile.summary = localizedZh(summary)
  resume.profile.location = localizedZh(profileTable.location)
  resume.profile.email = email
  resume.profile.phone = phone

  const strengthsSection = sectionBetween(text, '## 核心竞争力', ['## 教育经历'])
  resume.highlights = strengthsSection
    .split('\n')
    .map((line) => line.trim())
    .filter((line) => line.startsWith('-'))
    .map((line): ResumeHighlightItem => {
      const normalized = line.replace(/^-\s*/, '')
      const match = normalized.match(/^\*\*(.+?)\*\*[:：]\s*(.+)$/)

      return {
        title: localizedZh(match?.[1] ?? normalized.slice(0, 24)),
        description: localizedZh(match?.[2] ?? normalized),
      }
    })

  const educationSection = sectionBetween(text, '## 教育经历', ['## 专业技能'])
  resume.education = splitByMarkdownHeading(educationSection).map((item) => {
    const periodLine = item.body
      .split('\n')
      .map((line) => line.trim())
      .find((line) => /\d{4}\.\d{2}/.test(line))
    const parts = periodLine?.split(/\s{2,}/).map((part) => part.trim()) ?? []
    const period = splitPeriod(parts[0] ?? '')
    const degreeParts = (parts[1] ?? '').split('/').map((part) => part.trim())

    return {
      schoolName: localizedZh(item.title),
      degree: localizedZh(degreeParts.slice(0, 2).join(' / ')),
      fieldOfStudy: localizedZh(degreeParts[2] ?? ''),
      startDate: period.startDate,
      endDate: period.endDate,
      location: localizedZh(''),
      highlights: [],
    }
  })

  const skillsSection = sectionBetween(text, '## 专业技能', ['## 工作经历'])
  resume.skills = splitByMarkdownHeading(skillsSection).map((item) => ({
    name: localizedZh(item.title),
    keywords: item.body
      .split('\n')
      .map((line) => line.replace(/^\s*-\s*/, '').trim())
      .filter(Boolean)
      .map((line) => localizedZh(line)),
  }))

  const experienceSection = sectionBetween(text, '## 工作经历', ['## 核心项目经历'])
  resume.experiences = splitByMarkdownHeading(experienceSection).map((item) => {
    const period = splitPeriod(item.meta)
    const role = extractField(item.body, '职位与类型')
    const summaryText = extractField(item.body, '工作概述')
    const highlights = extractListAfterLabel(item.body, '主要成果')
    const technologies = splitTechStack(extractField(item.body, '技术栈'))

    return {
      companyName: localizedZh(item.title),
      role: localizedZh(role),
      employmentType: localizedZh('全职'),
      startDate: period.startDate,
      endDate: period.endDate,
      location: localizedZh(''),
      summary: localizedZh(summaryText),
      highlights: highlights.map((line) => localizedZh(line)),
      technologies,
    }
  })

  const projectsSection = sectionBetween(text, '## 核心项目经历', ['## 自我评价'])
  resume.projects = splitByMarkdownHeading(projectsSection).map((item) => {
    const period = splitPeriod(item.meta)
    const role = extractField(item.body, '角色')
    const summaryText = extractField(item.body, '项目概览')
    const coreFunctions = extractField(item.body, '项目核心功能')
    const highlights = extractListAfterLabel(item.body, '亮点、难点与解决方案')
    const technologies = splitTechStack(extractField(item.body, '技术栈'))

    return {
      name: localizedZh(item.title),
      role: localizedZh(role),
      startDate: period.startDate,
      endDate: period.endDate,
      summary: localizedZh(summaryText),
      coreFunctions: localizedZh(coreFunctions),
      highlights: highlights.map((line) => localizedZh(line)),
      technologies,
      links: [],
    }
  })

  return normalizeStandardResume(resume)
}

function collectWarnings(resume: StandardResume): string[] {
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

function normalizeModules(modules: unknown): ResumeImportModule[] {
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

function createInitialJobDetail(jobId: string): Omit<ResumeImportJobDetail, 'elapsedMs'> {
  const now = new Date().toISOString()

  return {
    jobId,
    status: 'running',
    currentStage: 'accepted',
    steps: RESUME_IMPORT_JOB_STEPS.map((step) => ({
      ...step,
      status: step.stage === 'accepted' ? 'running' : 'pending',
      ...(step.stage === 'accepted' ? { startedAt: now } : {}),
    })),
    createdAt: now,
    updatedAt: now,
  }
}

function cloneJobDetail(job: CachedResumeImportJob): ResumeImportJobDetail {
  return {
    ...job.detail,
    steps: job.detail.steps.map((step) => ({ ...step })),
    error: job.detail.error ? { ...job.detail.error } : undefined,
    elapsedMs: Date.now() - new Date(job.createdAt).getTime(),
  }
}

function normalizeErrorMessage(error: unknown): string {
  if (error instanceof Error && error.message.trim()) {
    return error.message
  }

  return '简历导入识别失败，请稍后重试'
}

@Injectable()
export class ResumeImportRecognitionService {
  private readonly resultMap = new Map<string, CachedResumeImportResult>()
  private readonly insertionOrder: string[] = []
  private readonly jobMap = new Map<string, CachedResumeImportJob>()
  private readonly jobInsertionOrder: string[] = []

  constructor(
    @Inject(FileExtractionService)
    private readonly fileExtractionService: FileExtractionService,
    @Inject(AiService)
    private readonly aiService: AiService,
    @Inject(ResumePublicationService)
    private readonly resumePublicationService: ResumePublicationService,
  ) {}

  recognize(input: RecognizeResumeImportInput): ResumeImportJobDetail {
    const jobId = randomUUID()
    const detail = createInitialJobDetail(jobId)
    const job = {
      createdAt: detail.createdAt,
      detail,
    }

    this.storeJob(job)
    void this.runRecognitionJob(jobId, input)

    return cloneJobDetail(job)
  }

  getJob(jobId: string): ResumeImportJobDetail {
    return cloneJobDetail(this.getJobOrThrow(jobId))
  }

  private async runRecognitionJob(jobId: string, input: RecognizeResumeImportInput) {
    try {
      const detail = await this.createRecognitionResult(jobId, input)
      this.completeJob(jobId, detail.resultId)
    } catch (error) {
      this.failJob(jobId, normalizeErrorMessage(error), input.traceId)
    }
  }

  private async createRecognitionResult(
    jobId: string,
    input: RecognizeResumeImportInput,
  ): Promise<ResumeImportResultDetail> {
    this.startJobStage(jobId, 'extracting')
    const extension = readFileExtension(input.originalname)

    if (extension !== 'md' && extension !== 'txt') {
      throw new BadRequestException('第一版仅支持上传 md/txt 简历文件')
    }

    if (input.size > MAX_FILE_SIZE_BYTES) {
      throw new BadRequestException('简历文件不能超过 1MB，请精简后再上传')
    }

    const extracted = await this.fileExtractionService.extractText(input)

    this.startJobStage(jobId, 'text_validating')
    if (extracted.charCount < MIN_TEXT_CHARS) {
      throw new BadRequestException('简历文本过短，无法稳定识别为结构化简历')
    }

    if (extracted.charCount > MAX_TEXT_CHARS) {
      throw new BadRequestException('简历文本过长，请精简到 50000 字以内后再上传')
    }

    const draft = await this.resumePublicationService.getDraft()
    const providerSummary = this.aiService.getProviderSummary()

    this.startJobStage(jobId, 'ai_generating')
    const payload =
      providerSummary.mode === 'mock'
        ? {
            resume: parseMockResumeFromMarkdown(extracted.text),
            summary: '已从上传简历中识别出结构化候选草稿。',
          }
        : await this.generateProviderRecognition(extracted.text, jobId)

    this.startJobStage(jobId, 'schema_validating')
    const candidateResume = normalizeStandardResume(payload.resume)
    const validationResult = validateStandardResume(candidateResume)

    if (!validationResult.valid) {
      throw new BadGatewayException(
        validationResult.errors[0] ?? 'AI 识别结果未通过简历结构校验',
      )
    }

    this.startJobStage(jobId, 'diff_building')
    const warnings = [...collectWarnings(candidateResume), ...(payload.warnings ?? [])]
    const changedModules = RESUME_IMPORT_MODULES.filter((module) =>
      isModuleChanged(draft.resume, candidateResume, module),
    )
    const createdAt = new Date().toISOString()
    const resultId = randomUUID()
    const detail: ResumeImportResultDetail = {
      resultId,
      locale: 'zh',
      fileName: extracted.fileName,
      fileType: extracted.fileType as 'txt' | 'md',
      charCount: extracted.charCount,
      summary: payload.summary ?? '已生成结构化候选草稿，请确认后按模块回填。',
      warnings,
      changedModules,
      moduleDiffs: buildModuleDiffs(draft.resume, candidateResume, warnings),
      moduleStats: {
        education: candidateResume.education.length,
        experiences: candidateResume.experiences.length,
        projects: candidateResume.projects.length,
        skills: candidateResume.skills.length,
        highlights: candidateResume.highlights.length,
      },
      createdAt,
      providerSummary,
    }

    this.storeResult({
      candidateResume,
      createdAt,
      detail,
      draftUpdatedAt: draft.updatedAt,
    })

    return detail
  }

  getResult(resultId: string): ResumeImportResultDetail {
    return this.getResultOrThrow(resultId).detail
  }

  async apply(input: ApplyResumeImportInput) {
    const selectedModules = normalizeModules(input.modules)
    const cachedResult = this.getResultOrThrow(input.resultId)
    const draft = await this.resumePublicationService.getDraft()

    if (draft.updatedAt !== cachedResult.draftUpdatedAt) {
      throw new ConflictException('当前草稿已发生变化，请重新识别后再回填')
    }

    const nextResume = cloneResume(draft.resume)

    for (const selectedModule of selectedModules) {
      nextResume[selectedModule] = cloneResume(cachedResult.candidateResume)[
        selectedModule
      ] as never
    }

    const appliedModules = RESUME_IMPORT_MODULES.filter((module) =>
      isModuleChanged(draft.resume, nextResume, module),
    )

    if (appliedModules.length === 0) {
      throw new BadRequestException('当前选择的模块没有实际变化可回填')
    }

    const validationResult = validateStandardResume(nextResume)

    if (!validationResult.valid) {
      throw new BadGatewayException(
        validationResult.errors[0] ?? '回填后的简历未通过结构校验',
      )
    }

    return this.resumePublicationService.updateDraft(nextResume)
  }

  private async generateProviderRecognition(
    text: string,
    jobId: string,
  ): Promise<ProviderResumeImportPayload> {
    const result = await this.aiService.generateText({
      systemPrompt:
        '你是一个简历结构化识别助手。你只能输出合法 JSON，不要输出 Markdown。',
      temperature: 0.1,
      maxTokens: 8192,
      responseFormat: {
        type: 'json_object',
      },
      prompt: this.buildPrompt(text),
    })

    this.startJobStage(jobId, 'json_parsing')
    const jsonText = extractJsonObject(result.text)

    try {
      const payload = JSON.parse(jsonText) as ProviderResumeImportPayload

      if (!payload.resume || typeof payload.resume !== 'object') {
        throw new BadGatewayException('AI 识别结果缺少 resume 字段')
      }

      return payload
    } catch (error) {
      if (error instanceof BadGatewayException) {
        throw error
      }

      throw new BadGatewayException(
        error instanceof Error
          ? `AI 识别结果无法解析：${error.message}`
          : 'AI 识别结果无法解析',
      )
    }
  }

  private buildPrompt(text: string): string {
    const schema = {
      summary: 'string',
      warnings: ['string'],
      resume: createEmptyStandardResume(),
    }

    return [
      '任务：把用户上传的中文简历文本识别成 StandardResume JSON。',
      '重要规则：',
      '1. 只能基于原文事实识别，不要虚构公司、项目、日期、邮箱、电话或技能。',
      '2. 所有 LocalizedText 字段都必须包含 zh 和 en；第一版以中文识别为主，en 没有把握可返回空字符串。',
      '3. 如果某些模块缺失，请返回空数组，并在 warnings 中说明。',
      '4. meta 必须保持 slug=standard-resume, version=1, defaultLocale=zh, locales=[zh,en]。',
      '5. 只能输出 JSON，不要输出 Markdown 和解释文字。',
      '',
      `必须匹配的 JSON 结构示例：\n${JSON.stringify(schema, null, 2)}`,
      '',
      `用户简历文本：\n${text}`,
    ].join('\n')
  }

  private storeResult(input: CachedResumeImportResult) {
    this.pruneExpiredResults()
    this.resultMap.set(input.detail.resultId, input)
    this.insertionOrder.push(input.detail.resultId)
    this.pruneOverflowResults()
  }

  private storeJob(input: CachedResumeImportJob) {
    this.pruneExpiredJobs()
    this.jobMap.set(input.detail.jobId, input)
    this.jobInsertionOrder.push(input.detail.jobId)
    this.pruneOverflowJobs()
  }

  private getJobOrThrow(jobId: string): CachedResumeImportJob {
    this.pruneExpiredJobs()
    const job = this.jobMap.get(jobId)

    if (!job) {
      throw new NotFoundException('当前简历导入识别任务已失效，请重新上传识别')
    }

    return job
  }

  private startJobStage(jobId: string, stage: ResumeImportJobStage) {
    const job = this.getJobOrThrow(jobId)
    const now = new Date().toISOString()
    const activeIndex = RESUME_IMPORT_JOB_STEPS.findIndex((step) => step.stage === stage)

    job.detail.currentStage = stage
    job.detail.updatedAt = now
    job.detail.steps = job.detail.steps.map((step, index) => {
      if (activeIndex < 0) {
        return step
      }

      if (index < activeIndex) {
        return {
          ...step,
          status: 'completed',
          completedAt: step.completedAt ?? now,
        }
      }

      if (index === activeIndex) {
        return {
          ...step,
          status: 'running',
          startedAt: step.startedAt ?? now,
        }
      }

      return {
        ...step,
        status: 'pending',
      }
    })
  }

  private completeJob(jobId: string, resultId: string) {
    const job = this.getJobOrThrow(jobId)
    const now = new Date().toISOString()

    job.detail.status = 'completed'
    job.detail.currentStage = 'completed'
    job.detail.resultId = resultId
    job.detail.updatedAt = now
    job.detail.steps = job.detail.steps.map((step) => ({
      ...step,
      status: 'completed',
      startedAt: step.startedAt ?? now,
      completedAt: step.completedAt ?? now,
    }))
  }

  private failJob(jobId: string, message: string, traceId?: string) {
    const job = this.getJobOrThrow(jobId)
    const now = new Date().toISOString()

    job.detail.status = 'failed'
    job.detail.currentStage = 'failed'
    job.detail.error = {
      message,
      ...(traceId ? { traceId } : {}),
    }
    job.detail.updatedAt = now
    job.detail.steps = job.detail.steps.map((step) => {
      if (step.status === 'running') {
        return {
          ...step,
          status: 'failed',
          completedAt: now,
          message,
        }
      }

      return step
    })
  }

  private getResultOrThrow(resultId: string): CachedResumeImportResult {
    this.pruneExpiredResults()
    const result = this.resultMap.get(resultId)

    if (!result) {
      throw new NotFoundException('当前简历导入识别结果已失效，请重新上传识别')
    }

    return result
  }

  private pruneExpiredResults() {
    const now = Date.now()

    for (const [resultId, result] of this.resultMap.entries()) {
      if (now - new Date(result.createdAt).getTime() <= RESULT_TTL_MS) {
        continue
      }

      this.resultMap.delete(resultId)
      this.removeFromInsertionOrder(resultId)
    }
  }

  private pruneOverflowResults() {
    while (this.insertionOrder.length > MAX_RESULT_COUNT) {
      const oldestResultId = this.insertionOrder.shift()

      if (!oldestResultId) {
        return
      }

      this.resultMap.delete(oldestResultId)
    }
  }

  private removeFromInsertionOrder(resultId: string) {
    const index = this.insertionOrder.indexOf(resultId)

    if (index >= 0) {
      this.insertionOrder.splice(index, 1)
    }
  }

  private pruneExpiredJobs() {
    const now = Date.now()

    for (const [jobId, job] of this.jobMap.entries()) {
      if (now - new Date(job.createdAt).getTime() <= JOB_TTL_MS) {
        continue
      }

      this.jobMap.delete(jobId)
      this.removeFromJobInsertionOrder(jobId)
    }
  }

  private pruneOverflowJobs() {
    while (this.jobInsertionOrder.length > MAX_JOB_COUNT) {
      const oldestJobId = this.jobInsertionOrder.shift()

      if (!oldestJobId) {
        return
      }

      this.jobMap.delete(oldestJobId)
    }
  }

  private removeFromJobInsertionOrder(jobId: string) {
    const index = this.jobInsertionOrder.indexOf(jobId)

    if (index >= 0) {
      this.jobInsertionOrder.splice(index, 1)
    }
  }
}
