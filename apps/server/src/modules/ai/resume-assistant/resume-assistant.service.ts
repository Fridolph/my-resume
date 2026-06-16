/**
 * 简历完整性助手 — AI 对话服务。
 *
 * 职责：
 * - 计算当前简历草稿的 7 块拼图完整度
 * - 构建 resume assistant 专用 system prompt
 * - 流式调用 AI，解析回复中的 JSON block 并发射 suggestion/completeness 事件
 */

import { Injectable, Logger } from '@nestjs/common'
import { AiService } from '../ai.service'
import { ResumePublicationService } from '../../resume/application/services/resume-publication.service'
import { StandardResume } from '../../resume/domain/standard-resume'
import {
  RESUME_ASSISTANT_SECTIONS,
  ResumeAssistantJsonPayload,
  ResumeAssistantSection,
  ResumeAssistantSuggestion,
  ResumeSectionCompleteness,
} from './resume-assistant.types'

/** SSE 事件回调 */
export interface ResumeAssistantStreamCallbacks {
  onToken?: (token: string) => void
  onSuggestion?: (suggestion: ResumeAssistantSuggestion) => void
  onCompleteness?: (completeness: ResumeSectionCompleteness[]) => void
  onError?: (message: string) => void
}

@Injectable()
export class ResumeAssistantService {
  private readonly logger = new Logger(ResumeAssistantService.name)

  constructor(
    private readonly aiService: AiService,
    private readonly resumePublicationService: ResumePublicationService,
  ) {}

  // ----------------------------------------------------------------
  // 公开接口
  // ----------------------------------------------------------------

  /** 获取或创建当前简历草稿 */
  async getResume(): Promise<StandardResume> {
    const snapshot = await this.resumePublicationService.getDraft()
    return snapshot.resume
  }

  /** 计算 7 块拼图的完整度 */
  calculateCompleteness(resume: StandardResume): ResumeSectionCompleteness[] {
    const items = [
      this.calcProfile(resume),
      this.calcEducation(resume),
      this.calcExperiences(resume),
      this.calcProjects(resume),
      this.calcSkills(resume),
      this.calcHighlights(resume),
      this.calcInterests(resume),
    ]
    return items.map((item) => {
      let status: ResumeSectionCompleteness['status']
      if (item.percentage >= 80) status = 'complete'
      else if (item.percentage > 0) status = 'partial'
      else status = 'empty'
      return { ...item, status }
    })
  }

  /** 获取所有 section 对标检查 */
  isAllComplete(completeness: ResumeSectionCompleteness[]): boolean {
    return completeness.every((item) => item.status === 'complete')
  }

  /** 流式对话 */
  async stream(
    resume: StandardResume,
    message: string,
    history: { role: 'user' | 'assistant'; content: string }[],
    callbacks: ResumeAssistantStreamCallbacks,
  ): Promise<void> {
    const completeness = this.calculateCompleteness(resume)
    // 先发送初始完整度
    callbacks.onCompleteness?.(completeness)

    const systemPrompt = buildSystemPrompt(completeness)
    const prompt = buildUserPrompt(message, resume)

    let fullResponse = ''

    try {
      await this.aiService.generateTextStream({
        systemPrompt,
        prompt,
        onToken: (token) => {
          fullResponse += token
          callbacks.onToken?.(token)
        },
      })
    } catch (error) {
      const msg = error instanceof Error ? error.message : String(error)
      this.logger.error({ event: 'resume_assistant.stream_error', message: msg })
      callbacks.onError?.(msg)
      return
    }

    // 解析 AI 回复中的 JSON block
    const payload = extractJsonPayload(fullResponse)
    if (payload) {
      if (payload.completeness) {
        callbacks.onCompleteness?.(payload.completeness)
      }
      if (payload.suggestions) {
        for (const suggestion of payload.suggestions) {
          callbacks.onSuggestion?.(suggestion)
        }
      }
    }
  }

  // ----------------------------------------------------------------
  // 完整度计算（每块 0-100）
  // ----------------------------------------------------------------

  private calcProfile(resume: StandardResume): { section: ResumeAssistantSection; label: string; percentage: number } {
    const p = resume.profile
    const fields = [p.fullName?.zh, p.headline?.zh, p.summary?.zh, p.location?.zh, p.email, p.phone, p.website]
    const filled = fields.filter(Boolean).length
    return { section: 'profile', label: '基本信息', percentage: Math.round((filled / fields.length) * 100) }
  }

  private calcEducation(resume: StandardResume): { section: ResumeAssistantSection; label: string; percentage: number } {
    const edu = resume.education ?? []
    if (edu.length === 0) return { section: 'education', label: '教育经历', percentage: 0 }
    const first = edu[0]
    const fields = [first.schoolName?.zh, first.degree?.zh, first.fieldOfStudy?.zh]
    const filled = fields.filter(Boolean).length
    return { section: 'education', label: '教育经历', percentage: Math.round((filled / 3) * 100) }
  }

  private calcExperiences(resume: StandardResume): { section: ResumeAssistantSection; label: string; percentage: number } {
    const exps = resume.experiences ?? []
    if (exps.length === 0) return { section: 'experiences', label: '工作经历', percentage: 0 }
    const first = exps[0]
    const fields = [first.companyName?.zh, first.role?.zh, first.summary?.zh]
    const filled = fields.filter(Boolean).length
    const hasHighlights = (first.highlights?.length ?? 0) > 0
    const base = Math.round((filled / 3) * 80) // 基础字段占 80%
    return { section: 'experiences', label: '工作经历', percentage: hasHighlights ? base + 20 : base }
  }

  private calcProjects(resume: StandardResume): { section: ResumeAssistantSection; label: string; percentage: number } {
    const projects = resume.projects ?? []
    if (projects.length === 0) return { section: 'projects', label: '项目经历', percentage: 0 }
    const first = projects[0]
    const fields = [first.name?.zh, first.summary?.zh]
    const filled = fields.filter(Boolean).length
    const hasTech = (first.technologies?.length ?? 0) > 0
    const base = Math.round((filled / 2) * 70)
    return { section: 'projects', label: '项目经历', percentage: hasTech ? base + 30 : base }
  }

  private calcSkills(resume: StandardResume): { section: ResumeAssistantSection; label: string; percentage: number } {
    const skills = resume.skills ?? []
    if (skills.length === 0) return { section: 'skills', label: '技能特长', percentage: 0 }
    const hasKeywords = skills.some((g) => (g.keywords?.length ?? 0) > 0)
    return { section: 'skills', label: '技能特长', percentage: hasKeywords ? 100 : 50 }
  }

  private calcHighlights(resume: StandardResume): { section: ResumeAssistantSection; label: string; percentage: number } {
    const highlights = resume.highlights ?? []
    if (highlights.length === 0) return { section: 'highlights', label: '核心亮点', percentage: 0 }
    const hasDesc = highlights.some((h) => Boolean(h.description?.zh))
    return { section: 'highlights', label: '核心亮点', percentage: hasDesc ? 100 : 50 }
  }

  private calcInterests(resume: StandardResume): { section: ResumeAssistantSection; label: string; percentage: number } {
    const interests = resume.profile?.interests ?? []
    if (interests.length === 0) return { section: 'interests', label: '兴趣爱好', percentage: 0 }
    return { section: 'interests', label: '兴趣爱好', percentage: 100 }
  }
}

// ----------------------------------------------------------------
// System Prompt
// ----------------------------------------------------------------

function buildSystemPrompt(completeness: ResumeSectionCompleteness[]): string {
  const summary = completeness
    .map((item) => `- ${item.label}: ${item.percentage}% (${statusLabel(item.status)})`)
    .join('\n')

  return `你是 FYS 的简历完整性助手。你的唯一职责是通过对话帮助用户完善简历的 7 个版块。

## 当前简历完整度
${summary}

## 对话边界（严格遵守）
- 你只能讨论与简历完善相关的话题：基本信息、教育经历、工作经历、项目经历、技能特长、核心亮点、兴趣爱好。
- 如果用户提出与简历无关的问题（如天气、闲聊、技术咨询、人生建议等），你必须礼貌但坚定地拒绝，并引导用户回到简历完善的主题。回复模板：「抱歉，我只能协助你完善简历。让我们继续看看你的工作经历部分吧？」
- 你不回答关于 AI 系统本身的问题（如「你的模型是什么」「谁开发的你」）。
- 你不需要打招呼或寒暄，直接进入简历完善的主题。

## 行为准则
- 先用一两句话总结当前简历的强项和缺口。
- 优先引导用户补充最薄弱（percentage 最低）的版块。
- 每次对话聚焦 1-2 个版块，不要一次覆盖全部。
- 如果用户提供了新信息，确认理解是否正确，然后告诉用户哪些版块可以更新。
- 保持友好、积极的语气，但不过度热情。

## 输出格式
你的每一条回复末尾必须包含一个 JSON 代码块，格式如下：

\`\`\`json
{
  "completeness": [
    { "section": "profile", "label": "基本信息", "percentage": 85, "status": "complete" }
  ],
  "suggestions": [
    {
      "section": "education",
      "explanation": "已从对话中提取到教育信息",
      "data": {
        "schoolName": { "zh": "清华大学", "en": "Tsinghua University" },
        "degree": { "zh": "本科" },
        "fieldOfStudy": { "zh": "计算机科学" }
      }
    }
  ]
}
\`\`\`

- completeness: 7 个版块的最新完整度（section 使用英文 key，label 使用中文）
- suggestions: 本轮对话中新增的建议（无新建议时空数组）。data 中的字段应与 StandardResume 的数据结构对齐，双语字段使用 { zh, en } 对象。
- 不要输出 JSON 以外的内容在代码块中。`
}

function statusLabel(status: string): string {
  switch (status) {
    case 'complete': return '✅ 完整'
    case 'partial': return '⚠️ 待补充'
    default: return '❌ 未填写'
  }
}

function buildUserPrompt(message: string, resume: StandardResume): string {
  const summary = JSON.stringify({
    profile: { fullName: resume.profile?.fullName?.zh, headline: resume.profile?.headline?.zh },
    educationCount: resume.education?.length ?? 0,
    experienceCount: resume.experiences?.length ?? 0,
    projectCount: resume.projects?.length ?? 0,
    skillGroupCount: resume.skills?.length ?? 0,
    highlightCount: resume.highlights?.length ?? 0,
    interestCount: resume.profile?.interests?.length ?? 0,
  })

  return `当前简历摘要：${summary}\n\n用户：${message}`
}

// ----------------------------------------------------------------
// JSON 解析
// ----------------------------------------------------------------

const JSON_BLOCK_RE = /```json\s*([\s\S]*?)```/

function extractJsonPayload(text: string): ResumeAssistantJsonPayload | null {
  const match = text.match(JSON_BLOCK_RE)
  if (!match) return null

  try {
    const parsed = JSON.parse(match[1].trim())
    if (!parsed || typeof parsed !== 'object') return null

    const payload: ResumeAssistantJsonPayload = {}
    if (Array.isArray(parsed.completeness)) {
      payload.completeness = parsed.completeness.filter(
        (item: unknown): item is ResumeSectionCompleteness =>
          typeof item === 'object' && item !== null &&
          RESUME_ASSISTANT_SECTIONS.includes((item as ResumeSectionCompleteness).section),
      )
    }
    if (Array.isArray(parsed.suggestions)) {
      payload.suggestions = parsed.suggestions.filter(
        (item: unknown): item is ResumeAssistantSuggestion =>
          typeof item === 'object' && item !== null &&
          RESUME_ASSISTANT_SECTIONS.includes((item as ResumeAssistantSuggestion).section) &&
          typeof (item as ResumeAssistantSuggestion).explanation === 'string',
      )
    }

    return Object.keys(payload).length > 0 ? payload : null
  } catch {
    return null
  }
}
