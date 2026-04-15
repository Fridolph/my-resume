import {
  BadGatewayException,
  BadRequestException,
  ConflictException,
  Inject,
  Injectable,
} from '@nestjs/common'

import { ResumePublicationService } from '../resume/resume-publication.service'
import {
  getStandardResumeModuleKeys,
  isLocalizedText,
  type LocalizedText,
  type ResumeHighlightItem,
  type StandardResume,
  validateStandardResume,
} from '../resume/domain/standard-resume'
import { AiService } from './ai.service'
import { type AnalysisLocale } from './analysis-report-cache.service'

export type ResumeOptimizationModule =
  | 'profile'
  | 'experiences'
  | 'projects'
  | 'highlights'

export interface ResumeOptimizationProfilePatch {
  headline?: LocalizedText
  summary?: LocalizedText
}

export interface ResumeOptimizationExperiencePatch {
  index: number
  summary?: LocalizedText
  highlights?: LocalizedText[]
}

export interface ResumeOptimizationProjectPatch {
  index: number
  summary?: LocalizedText
  highlights?: LocalizedText[]
}

export interface ResumeOptimizationPatch {
  profile?: ResumeOptimizationProfilePatch
  experiences?: ResumeOptimizationExperiencePatch[]
  projects?: ResumeOptimizationProjectPatch[]
  highlights?: ResumeHighlightItem[]
}

interface ResumeOptimizationProviderPayload {
  summary: string
  focusAreas: string[]
  patch: ResumeOptimizationPatch
}

export interface GenerateResumeOptimizationInput {
  instruction: string
  locale?: AnalysisLocale
}

export interface GenerateResumeOptimizationResult {
  summary: string
  focusAreas: string[]
  changedModules: ResumeOptimizationModule[]
  moduleDiffs: ResumeOptimizationModuleDiff[]
  applyPayload: ResumeOptimizationApplyPayload
  suggestedResume: StandardResume
  providerSummary: {
    provider: string
    model: string
    mode: string
  }
}

export interface ResumeOptimizationDiffEntry {
  key: string
  label: string
  before: string
  after: string
}

export interface ResumeOptimizationModuleDiff {
  module: ResumeOptimizationModule
  title: string
  /**
   * reason 会直接展示给管理员，解释“为什么这个模块值得先确认再应用”。
   * 开源版先把业务意图写清楚，避免 AI 建议被理解成黑盒覆盖。
   */
  reason: string
  entries: ResumeOptimizationDiffEntry[]
}

export interface ResumeOptimizationApplyPayload {
  /**
   * 用于校验建议稿是不是基于当前草稿生成的，避免旧建议误覆盖新草稿。
   */
  draftUpdatedAt: string
  /**
   * applyPayload 只承载结构化 patch，而不是整份 suggestedResume。
   * 这样服务端才能继续掌控模块级 apply 和最终结构校验。
   */
  patch: ResumeOptimizationPatch
}

export interface ApplyResumeOptimizationInput {
  draftUpdatedAt: string
  patch: unknown
  modules: ResumeOptimizationModule[]
}

function cloneResume(resume: StandardResume): StandardResume {
  return JSON.parse(JSON.stringify(resume)) as StandardResume
}

function normalizeInstruction(instruction: string): string {
  return instruction.replace(/\s+/g, ' ').trim()
}

function normalizeModules(modules: unknown): ResumeOptimizationModule[] {
  if (!Array.isArray(modules)) {
    throw new BadRequestException('请选择要应用的简历模块')
  }

  const validModules: ResumeOptimizationModule[] = [
    'profile',
    'experiences',
    'projects',
    'highlights',
  ]

  const normalized = Array.from(new Set(modules)).flatMap((item) =>
    validModules.includes(item as ResumeOptimizationModule)
      ? [item as ResumeOptimizationModule]
      : [],
  )

  if (normalized.length === 0) {
    throw new BadRequestException('请至少选择一个要应用的简历模块')
  }

  return normalized
}

function extractKeywords(
  instruction: string,
  locale: AnalysisLocale,
  limit = 3,
): string[] {
  const englishMatches = instruction.match(/[A-Za-z0-9.+#-]{2,}/g) ?? []
  const chineseMatches = instruction.match(/[\u4e00-\u9fa5]{2,}/g) ?? []
  const combined = [...englishMatches, ...chineseMatches].map((item) => item.trim())
  const unique = Array.from(new Set(combined))

  if (unique.length > 0) {
    return unique.slice(0, limit)
  }

  return locale === 'en' ? ['resume', 'impact', 'delivery'] : ['简历', '成果', '交付']
}

function extractJsonObject(rawText: string): string {
  const fencedMatch = rawText.match(/```(?:json)?\s*([\s\S]*?)```/i)

  if (fencedMatch?.[1]) {
    return fencedMatch[1].trim()
  }

  const firstBrace = rawText.indexOf('{')
  const lastBrace = rawText.lastIndexOf('}')

  if (firstBrace === -1 || lastBrace === -1 || lastBrace <= firstBrace) {
    throw new BadGatewayException('AI 未返回可解析的 JSON 结果')
  }

  return rawText.slice(firstBrace, lastBrace + 1).trim()
}

function isLocalizedTextArray(value: unknown): value is LocalizedText[] {
  return Array.isArray(value) && value.every((item) => isLocalizedText(item))
}

function isResumeHighlightArray(value: unknown): value is ResumeHighlightItem[] {
  return (
    Array.isArray(value) &&
    value.every((item) => {
      if (!item || typeof item !== 'object') {
        return false
      }

      const candidate = item as Record<string, unknown>

      return isLocalizedText(candidate.title) && isLocalizedText(candidate.description)
    })
  )
}

function validatePatch(patch: unknown, resume: StandardResume): ResumeOptimizationPatch {
  if (!patch || typeof patch !== 'object') {
    return {}
  }

  const candidate = patch as Record<string, unknown>
  const nextPatch: ResumeOptimizationPatch = {}

  if (candidate.profile && typeof candidate.profile === 'object') {
    const profilePatch = candidate.profile as Record<string, unknown>
    const nextProfilePatch: ResumeOptimizationProfilePatch = {}

    if (profilePatch.headline) {
      if (!isLocalizedText(profilePatch.headline)) {
        throw new BadGatewayException('AI 返回的 profile.headline 结构无效')
      }

      nextProfilePatch.headline = profilePatch.headline
    }

    if (profilePatch.summary) {
      if (!isLocalizedText(profilePatch.summary)) {
        throw new BadGatewayException('AI 返回的 profile.summary 结构无效')
      }

      nextProfilePatch.summary = profilePatch.summary
    }

    if (Object.keys(nextProfilePatch).length > 0) {
      nextPatch.profile = nextProfilePatch
    }
  }

  if (candidate.experiences) {
    if (!Array.isArray(candidate.experiences)) {
      throw new BadGatewayException('AI 返回的 experiences patch 结构无效')
    }

    nextPatch.experiences = candidate.experiences.flatMap((item) => {
      if (!item || typeof item !== 'object') {
        throw new BadGatewayException('AI 返回的 experiences item 结构无效')
      }

      const currentItem = item as Record<string, unknown>
      const index = currentItem.index

      if (typeof index !== 'number' || !Number.isInteger(index)) {
        throw new BadGatewayException('AI 返回的 experiences index 无效')
      }

      if (index < 0 || index >= resume.experiences.length) {
        return []
      }

      const nextItem: ResumeOptimizationExperiencePatch = {
        index,
      }

      if (currentItem.summary) {
        if (!isLocalizedText(currentItem.summary)) {
          throw new BadGatewayException('AI 返回的 experiences.summary 结构无效')
        }

        nextItem.summary = currentItem.summary
      }

      if (currentItem.highlights) {
        if (!isLocalizedTextArray(currentItem.highlights)) {
          throw new BadGatewayException('AI 返回的 experiences.highlights 结构无效')
        }

        nextItem.highlights = currentItem.highlights
      }

      return Object.keys(nextItem).length > 1 ? [nextItem] : []
    })
  }

  if (candidate.projects) {
    if (!Array.isArray(candidate.projects)) {
      throw new BadGatewayException('AI 返回的 projects patch 结构无效')
    }

    nextPatch.projects = candidate.projects.flatMap((item) => {
      if (!item || typeof item !== 'object') {
        throw new BadGatewayException('AI 返回的 projects item 结构无效')
      }

      const currentItem = item as Record<string, unknown>
      const index = currentItem.index

      if (typeof index !== 'number' || !Number.isInteger(index)) {
        throw new BadGatewayException('AI 返回的 projects index 无效')
      }

      if (index < 0 || index >= resume.projects.length) {
        return []
      }

      const nextItem: ResumeOptimizationProjectPatch = {
        index,
      }

      if (currentItem.summary) {
        if (!isLocalizedText(currentItem.summary)) {
          throw new BadGatewayException('AI 返回的 projects.summary 结构无效')
        }

        nextItem.summary = currentItem.summary
      }

      if (currentItem.highlights) {
        if (!isLocalizedTextArray(currentItem.highlights)) {
          throw new BadGatewayException('AI 返回的 projects.highlights 结构无效')
        }

        nextItem.highlights = currentItem.highlights
      }

      return Object.keys(nextItem).length > 1 ? [nextItem] : []
    })
  }

  if (candidate.highlights) {
    if (!isResumeHighlightArray(candidate.highlights)) {
      throw new BadGatewayException('AI 返回的 highlights 结构无效')
    }

    nextPatch.highlights = candidate.highlights
  }

  return nextPatch
}

function validateProviderPayload(
  payload: unknown,
  resume: StandardResume,
): ResumeOptimizationProviderPayload {
  if (!payload || typeof payload !== 'object') {
    throw new BadGatewayException('AI 未返回结构化简历建议')
  }

  const candidate = payload as Record<string, unknown>

  if (typeof candidate.summary !== 'string' || !candidate.summary.trim()) {
    throw new BadGatewayException('AI 返回的 summary 无效')
  }

  if (
    !Array.isArray(candidate.focusAreas) ||
    candidate.focusAreas.some((item) => typeof item !== 'string')
  ) {
    throw new BadGatewayException('AI 返回的 focusAreas 无效')
  }

  return {
    summary: candidate.summary.trim(),
    focusAreas: candidate.focusAreas
      .map((item) => item.trim())
      .filter((item) => item.length > 0)
      .slice(0, 4),
    patch: validatePatch(candidate.patch, resume),
  }
}

function applyPatch(
  resume: StandardResume,
  patch: ResumeOptimizationPatch,
): StandardResume {
  const nextResume = cloneResume(resume)

  if (patch.profile?.headline) {
    nextResume.profile.headline = patch.profile.headline
  }

  if (patch.profile?.summary) {
    nextResume.profile.summary = patch.profile.summary
  }

  patch.experiences?.forEach((item) => {
    if (item.summary) {
      nextResume.experiences[item.index].summary = item.summary
    }

    if (item.highlights) {
      nextResume.experiences[item.index].highlights = item.highlights
    }
  })

  patch.projects?.forEach((item) => {
    if (item.summary) {
      nextResume.projects[item.index].summary = item.summary
    }

    if (item.highlights) {
      nextResume.projects[item.index].highlights = item.highlights
    }
  })

  if (patch.highlights) {
    nextResume.highlights = patch.highlights
  }

  return nextResume
}

function pickPatchByModules(
  patch: ResumeOptimizationPatch,
  modules: ResumeOptimizationModule[],
): ResumeOptimizationPatch {
  const selected = new Set(modules)

  return {
    profile: selected.has('profile') ? patch.profile : undefined,
    experiences: selected.has('experiences') ? patch.experiences : undefined,
    projects: selected.has('projects') ? patch.projects : undefined,
    highlights: selected.has('highlights') ? patch.highlights : undefined,
  }
}

function detectChangedModules(
  previousResume: StandardResume,
  nextResume: StandardResume,
): ResumeOptimizationModule[] {
  return getStandardResumeModuleKeys().filter((moduleKey) => {
    if (
      moduleKey !== 'profile' &&
      moduleKey !== 'experiences' &&
      moduleKey !== 'projects' &&
      moduleKey !== 'highlights'
    ) {
      return false
    }

    return (
      JSON.stringify(previousResume[moduleKey]) !== JSON.stringify(nextResume[moduleKey])
    )
  }) as ResumeOptimizationModule[]
}

function formatLocalizedValue(value: LocalizedText | undefined): string {
  const zh = value?.zh.trim() || '（空）'
  const en = value?.en.trim() || '(empty)'

  return `中文：${zh} | English: ${en}`
}

function getModulePresentation(module: ResumeOptimizationModule): {
  title: string
  reason: string
} {
  switch (module) {
    case 'profile':
      return {
        title: '个人定位与摘要',
        reason:
          '个人摘要和标题决定面试官最先如何理解你的岗位定位，是“是否继续看下去”的第一印象模块。',
      }
    case 'experiences':
      return {
        title: '工作经历与职责边界',
        reason:
          '工作经历是证明职责范围、协作方式和交付结果的主证据，直接影响面试官是否相信你的经历深度。',
      }
    case 'projects':
      return {
        title: '项目摘要与亮点',
        reason:
          '项目经历通常承载技术方案、业务场景和个人贡献，是和目标 JD 对齐时最容易被追问的部分。',
      }
    case 'highlights':
      return {
        title: '差异化亮点总结',
        reason:
          '亮点总结负责帮助招聘方快速记住你最值得被记住的信号，适合在 apply 前再次确认表达是否可信。',
      }
  }
}

function buildProfileDiff(
  previousResume: StandardResume,
  nextResume: StandardResume,
  patch: ResumeOptimizationPatch,
): ResumeOptimizationModuleDiff | null {
  if (!patch.profile) {
    return null
  }

  const entries: ResumeOptimizationDiffEntry[] = []

  if (patch.profile.headline) {
    entries.push({
      key: 'profile-headline',
      label: '个人标题',
      before: formatLocalizedValue(previousResume.profile.headline),
      after: formatLocalizedValue(nextResume.profile.headline),
    })
  }

  if (patch.profile.summary) {
    entries.push({
      key: 'profile-summary',
      label: '个人摘要',
      before: formatLocalizedValue(previousResume.profile.summary),
      after: formatLocalizedValue(nextResume.profile.summary),
    })
  }

  if (entries.length === 0) {
    return null
  }

  return {
    module: 'profile',
    ...getModulePresentation('profile'),
    entries,
  }
}

function buildExperiencesDiff(
  previousResume: StandardResume,
  nextResume: StandardResume,
  patch: ResumeOptimizationPatch,
): ResumeOptimizationModuleDiff | null {
  if (!patch.experiences || patch.experiences.length === 0) {
    return null
  }

  const entries: ResumeOptimizationDiffEntry[] = []

  patch.experiences.forEach((item) => {
    const previousItem = previousResume.experiences[item.index]
    const nextItem = nextResume.experiences[item.index]

    if (!previousItem || !nextItem) {
      return
    }

    const scopeLabel = `${previousItem.companyName.zh} · ${previousItem.role.zh}`

    if (item.summary) {
      entries.push({
        key: `experience-${item.index}-summary`,
        label: `${scopeLabel} / 经历摘要`,
        before: formatLocalizedValue(previousItem.summary),
        after: formatLocalizedValue(nextItem.summary),
      })
    }

    if (item.highlights) {
      item.highlights.forEach((_, highlightIndex) => {
        entries.push({
          key: `experience-${item.index}-highlight-${highlightIndex}`,
          label: `${scopeLabel} / 亮点 ${highlightIndex + 1}`,
          before: formatLocalizedValue(
            previousItem.highlights[highlightIndex] as LocalizedText | undefined,
          ),
          after: formatLocalizedValue(
            nextItem.highlights[highlightIndex] as LocalizedText | undefined,
          ),
        })
      })
    }
  })

  if (entries.length === 0) {
    return null
  }

  return {
    module: 'experiences',
    ...getModulePresentation('experiences'),
    entries,
  }
}

function buildProjectsDiff(
  previousResume: StandardResume,
  nextResume: StandardResume,
  patch: ResumeOptimizationPatch,
): ResumeOptimizationModuleDiff | null {
  if (!patch.projects || patch.projects.length === 0) {
    return null
  }

  const entries: ResumeOptimizationDiffEntry[] = []

  patch.projects.forEach((item) => {
    const previousItem = previousResume.projects[item.index]
    const nextItem = nextResume.projects[item.index]

    if (!previousItem || !nextItem) {
      return
    }

    const scopeLabel = `${previousItem.name.zh} · ${previousItem.role.zh}`

    if (item.summary) {
      entries.push({
        key: `project-${item.index}-summary`,
        label: `${scopeLabel} / 项目摘要`,
        before: formatLocalizedValue(previousItem.summary),
        after: formatLocalizedValue(nextItem.summary),
      })
    }

    if (item.highlights) {
      item.highlights.forEach((_, highlightIndex) => {
        entries.push({
          key: `project-${item.index}-highlight-${highlightIndex}`,
          label: `${scopeLabel} / 亮点 ${highlightIndex + 1}`,
          before: formatLocalizedValue(
            previousItem.highlights[highlightIndex] as LocalizedText | undefined,
          ),
          after: formatLocalizedValue(
            nextItem.highlights[highlightIndex] as LocalizedText | undefined,
          ),
        })
      })
    }
  })

  if (entries.length === 0) {
    return null
  }

  return {
    module: 'projects',
    ...getModulePresentation('projects'),
    entries,
  }
}

function buildHighlightsDiff(
  previousResume: StandardResume,
  nextResume: StandardResume,
  patch: ResumeOptimizationPatch,
): ResumeOptimizationModuleDiff | null {
  if (!patch.highlights || patch.highlights.length === 0) {
    return null
  }

  const entries: ResumeOptimizationDiffEntry[] = []

  patch.highlights.forEach((_, index) => {
    entries.push({
      key: `highlight-${index}-title`,
      label: `亮点 ${index + 1} / 标题`,
      before: formatLocalizedValue(previousResume.highlights[index]?.title),
      after: formatLocalizedValue(nextResume.highlights[index]?.title),
    })
    entries.push({
      key: `highlight-${index}-description`,
      label: `亮点 ${index + 1} / 描述`,
      before: formatLocalizedValue(previousResume.highlights[index]?.description),
      after: formatLocalizedValue(nextResume.highlights[index]?.description),
    })
  })

  return {
    module: 'highlights',
    ...getModulePresentation('highlights'),
    entries,
  }
}

function buildModuleDiffs(
  previousResume: StandardResume,
  nextResume: StandardResume,
  patch: ResumeOptimizationPatch,
  changedModules: ResumeOptimizationModule[],
): ResumeOptimizationModuleDiff[] {
  return changedModules.flatMap((module) => {
    const diff =
      module === 'profile'
        ? buildProfileDiff(previousResume, nextResume, patch)
        : module === 'experiences'
          ? buildExperiencesDiff(previousResume, nextResume, patch)
          : module === 'projects'
            ? buildProjectsDiff(previousResume, nextResume, patch)
            : buildHighlightsDiff(previousResume, nextResume, patch)

    return diff ? [diff] : []
  })
}

function buildMockSuggestion(
  resume: StandardResume,
  instruction: string,
  locale: AnalysisLocale,
): ResumeOptimizationProviderPayload {
  const keywords = extractKeywords(instruction, locale, 3)
  const firstKeyword = keywords[0] ?? (locale === 'en' ? 'impact' : '成果')
  const zhFocus = keywords.join('、')
  const enFocus = keywords.join(', ')
  const currentHeadlineZh = resume.profile.headline.zh.trim()
  const currentHeadlineEn = resume.profile.headline.en.trim()

  return {
    summary:
      locale === 'en'
        ? `Generated a deterministic resume refinement draft that emphasizes ${enFocus} while preserving the current resume structure.`
        : `已生成一份稳定的结构化简历建议稿，重点围绕 ${zhFocus} 强化当前简历表达，同时保持现有数据结构不变。`,
    focusAreas:
      locale === 'en'
        ? [
            `Clarify fit around ${firstKeyword}`,
            'Rewrite profile summary with stronger positioning',
            'Tighten the first experience and project highlights',
          ]
        : [
            `突出与 ${firstKeyword} 相关的匹配信号`,
            '重写个人摘要，让定位更聚焦',
            '补强首段经历与项目亮点描述',
          ],
    patch: {
      profile: {
        headline: {
          zh: currentHeadlineZh
            ? `${currentHeadlineZh} · 面向目标岗位优化`
            : '面向目标岗位优化的前端工程师',
          en: currentHeadlineEn
            ? `${currentHeadlineEn} · Targeted Resume Edition`
            : 'Frontend Engineer · Targeted Resume Edition',
        },
        summary: {
          zh: `本次草稿围绕 ${zhFocus} 重新收束个人定位，强调与目标岗位更相关的技术关键词、交付结果与协作方式，同时保留当前真实经历和项目事实。`,
          en: `This draft refines the positioning around ${enFocus}, highlighting stronger technical signals, delivery outcomes, and collaboration patterns while preserving the current factual experience and project history.`,
        },
      },
      experiences:
        resume.experiences.length > 0
          ? [
              {
                index: 0,
                summary: {
                  zh: `围绕 ${zhFocus} 重新强调该阶段的业务落地、团队协作与工程交付价值，让经历更贴近目标岗位关注点。`,
                  en: `Refocused this experience around ${enFocus}, making the delivery impact, collaboration scope, and engineering value easier to map to the target role.`,
                },
                highlights: [
                  {
                    zh: `以 ${zhFocus} 为主线补强亮点描述，优先强调可迁移的交付成果与职责边界。`,
                    en: `Reframed the highlights around ${enFocus}, prioritizing transferable impact and ownership boundaries.`,
                  },
                  ...resume.experiences[0].highlights.slice(0, 2),
                ],
              },
            ]
          : [],
      projects:
        resume.projects.length > 0
          ? [
              {
                index: 0,
                summary: {
                  zh: `项目描述改为更聚焦 ${zhFocus} 的表达方式，突出技术方案、业务结果与个人贡献的对应关系。`,
                  en: `Project wording now emphasizes ${enFocus}, making the link between technical decisions, business impact, and individual contribution clearer.`,
                },
                highlights: [
                  {
                    zh: `补一条与 ${zhFocus} 直接相关的成果描述，方便后续投递时快速贴近岗位要求。`,
                    en: `Added a highlight tied to ${enFocus} so the project reads closer to the target role during future applications.`,
                  },
                  ...resume.projects[0].highlights.slice(0, 2),
                ],
              },
            ]
          : [],
      highlights: [
        {
          title: {
            zh: 'AI 优化建议版',
            en: 'AI-Optimized Edition',
          },
          description: {
            zh: `当前草稿已根据 ${zhFocus} 重新组织核心表达，更适合在目标岗位场景下展示已有经验与成果。`,
            en: `The current draft has been reorganized around ${enFocus} to present existing experience and outcomes more clearly for the target role.`,
          },
        },
        ...resume.highlights.slice(0, 2),
      ],
    },
  }
}

@Injectable()
export class AiResumeOptimizationService {
  constructor(
    @Inject(AiService)
    private readonly aiService: AiService,
    @Inject(ResumePublicationService)
    private readonly resumePublicationService: ResumePublicationService,
  ) {}

  async generateSuggestion(
    input: GenerateResumeOptimizationInput,
  ): Promise<GenerateResumeOptimizationResult> {
    const instruction = normalizeInstruction(input.instruction)
    const locale = input.locale ?? 'zh'

    if (!instruction) {
      throw new BadRequestException('Instruction is required')
    }

    const draft = await this.resumePublicationService.getDraft()
    const providerSummary = this.aiService.getProviderSummary()

    const payload =
      providerSummary.mode === 'mock'
        ? buildMockSuggestion(draft.resume, instruction, locale)
        : await this.generateProviderSuggestion(draft.resume, instruction, locale)

    const suggestedResume = applyPatch(draft.resume, payload.patch)
    const validationResult = validateStandardResume(suggestedResume)
    const changedModules = detectChangedModules(draft.resume, suggestedResume)

    if (!validationResult.valid) {
      throw new BadGatewayException(
        validationResult.errors[0] ?? 'AI 建议稿未通过当前简历结构校验',
      )
    }

    return {
      summary: payload.summary,
      focusAreas: payload.focusAreas,
      changedModules,
      moduleDiffs: buildModuleDiffs(
        draft.resume,
        suggestedResume,
        payload.patch,
        changedModules,
      ),
      applyPayload: {
        draftUpdatedAt: draft.updatedAt,
        patch: payload.patch,
      },
      suggestedResume,
      providerSummary,
    }
  }

  async applySuggestion(input: ApplyResumeOptimizationInput) {
    const selectedModules = normalizeModules(input.modules)
    const draft = await this.resumePublicationService.getDraft()

    if (draft.updatedAt !== input.draftUpdatedAt) {
      throw new ConflictException('当前草稿已发生变化，请重新生成建议稿后再应用')
    }

    const validatedPatch = validatePatch(input.patch, draft.resume)
    const selectedPatch = pickPatchByModules(validatedPatch, selectedModules)
    const nextResume = applyPatch(draft.resume, selectedPatch)
    const appliedModules = detectChangedModules(draft.resume, nextResume)

    if (appliedModules.length === 0) {
      throw new BadRequestException('当前选择的模块没有实际改动可应用')
    }

    const validationResult = validateStandardResume(nextResume)

    if (!validationResult.valid) {
      throw new BadGatewayException(
        validationResult.errors[0] ?? 'AI 建议稿未通过当前简历结构校验',
      )
    }

    return this.resumePublicationService.updateDraft(nextResume)
  }

  private async generateProviderSuggestion(
    resume: StandardResume,
    instruction: string,
    locale: AnalysisLocale,
  ): Promise<ResumeOptimizationProviderPayload> {
    const result = await this.aiService.generateText({
      systemPrompt:
        locale === 'en'
          ? 'You are a resume optimization assistant. Output valid JSON only.'
          : '你是一个简历优化助手。你只能输出合法 JSON，不要输出 Markdown。',
      temperature: 0.2,
      prompt: this.buildPrompt(resume, instruction, locale),
    })

    const jsonText = extractJsonObject(result.text)

    try {
      const payload = JSON.parse(jsonText) as unknown

      return validateProviderPayload(payload, resume)
    } catch (error) {
      if (error instanceof BadGatewayException) {
        throw error
      }

      throw new BadGatewayException(
        error instanceof Error
          ? `AI 返回的结构化建议无法解析：${error.message}`
          : 'AI 返回的结构化建议无法解析',
      )
    }
  }

  private buildPrompt(
    resume: StandardResume,
    instruction: string,
    locale: AnalysisLocale,
  ): string {
    const editableResumeContext = {
      profile: {
        headline: resume.profile.headline,
        summary: resume.profile.summary,
      },
      experiences: resume.experiences.map((item, index) => ({
        index,
        companyName: item.companyName,
        role: item.role,
        summary: item.summary,
        highlights: item.highlights,
      })),
      projects: resume.projects.map((item, index) => ({
        index,
        name: item.name,
        role: item.role,
        summary: item.summary,
        highlights: item.highlights,
      })),
      highlights: resume.highlights,
    }

    const schema = {
      summary: locale === 'en' ? 'string' : '字符串',
      focusAreas: ['string'],
      patch: {
        profile: {
          headline: {
            zh: 'string',
            en: 'string',
          },
          summary: {
            zh: 'string',
            en: 'string',
          },
        },
        experiences: [
          {
            index: 0,
            summary: {
              zh: 'string',
              en: 'string',
            },
            highlights: [
              {
                zh: 'string',
                en: 'string',
              },
            ],
          },
        ],
        projects: [
          {
            index: 0,
            summary: {
              zh: 'string',
              en: 'string',
            },
            highlights: [
              {
                zh: 'string',
                en: 'string',
              },
            ],
          },
        ],
        highlights: [
          {
            title: {
              zh: 'string',
              en: 'string',
            },
            description: {
              zh: 'string',
              en: 'string',
            },
          },
        ],
      },
    }

    if (locale === 'en') {
      return [
        'Task: optimize the current resume draft for the instruction below.',
        'Important rules:',
        '1. Keep all factual data stable. Do not invent new companies, projects, dates, links, email, phone, or skills.',
        '2. Only rewrite narrative fields in the allowed patch structure.',
        '3. Every localized field must include both zh and en strings.',
        '4. Use existing experience/project indexes only.',
        '5. Return JSON only and match the schema exactly.',
        '',
        `Instruction:\n${instruction}`,
        '',
        `Editable resume context:\n${JSON.stringify(editableResumeContext, null, 2)}`,
        '',
        `Required JSON schema:\n${JSON.stringify(schema, null, 2)}`,
      ].join('\n')
    }

    return [
      '任务：基于下面的输入，优化当前简历草稿。',
      '重要规则：',
      '1. 保持事实信息稳定，不要虚构新的公司、项目、日期、链接、邮箱、电话或技能。',
      '2. 只能改写允许的 narrative 字段，并严格使用 patch 结构。',
      '3. 每个多语言字段都必须同时返回 zh 和 en。',
      '4. experiences / projects 只能使用现有 index。',
      '5. 只能输出 JSON，不要输出 Markdown 和解释文字。',
      '',
      `输入内容：\n${instruction}`,
      '',
      `当前可编辑上下文：\n${JSON.stringify(editableResumeContext, null, 2)}`,
      '',
      `必须匹配的 JSON 结构：\n${JSON.stringify(schema, null, 2)}`,
    ].join('\n')
  }
}
