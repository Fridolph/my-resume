import type { StandardResume } from '../../../resume/domain/standard-resume'
import type { AnalysisLocale } from '../services/analysis-report-cache.service'

export interface BuildResumeOptimizationPromptInput {
  /** 当前可编辑的简历草稿。 */
  resume: StandardResume
  /** 用户输入的优化目标或说明。 */
  instruction: string
  /** 输出语言。 */
  locale: AnalysisLocale
}

function buildEditableResumeContext(resume: StandardResume) {
  return {
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
}

function buildResumeOptimizationSchema(locale: AnalysisLocale) {
  return {
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
}

/**
 * 构建简历优化系统 Prompt。
 */
export function buildResumeOptimizationSystemPrompt(locale: AnalysisLocale): string {
  return locale === 'en'
    ? 'You are a resume optimization assistant. Output valid JSON only.'
    : '你是一个简历优化助手。你只能输出合法 JSON，不要输出 Markdown。'
}

/**
 * 构建简历优化用户 Prompt。
 */
export function buildResumeOptimizationPrompt({
  resume,
  instruction,
  locale,
}: BuildResumeOptimizationPromptInput): string {
  const editableResumeContext = buildEditableResumeContext(resume)
  const schema = buildResumeOptimizationSchema(locale)

  if (locale === 'en') {
    return [
      'Task: optimize the current resume draft for the instruction below.',
      'Important rules:',
      '1. Keep all factual data stable. Do not invent new companies, projects, dates, links, email, phone, or skills.',
      '2. Only rewrite narrative fields in the allowed patch structure.',
      '3. Every localized field must include both zh and en strings.',
      '4. zh fields must be Chinese-first. en fields must be English-only. Never concatenate "中文/English" labels in the same field.',
      '5. If one locale cannot be improved reliably, keep the original field value instead of mixing another language into it.',
      '6. Use existing experience/project indexes only.',
      '7. Make every rewritten field defensible: the new wording should clearly support the target role and avoid unsupported metrics.',
      '8. Return JSON only and match the schema exactly.',
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
    '4. zh 字段只写中文表达，en 字段只写英文表达，不要在同一个字段里拼接“中文：/English:”这类标签。',
    '5. 如果某个语言版本没有把握，请保留原字段值，不要把另一种语言硬塞进去。',
    '6. experiences / projects 只能使用现有 index。',
    '7. 每个被改写字段都要能解释“为什么适合目标岗位”，不要加入没有事实依据的指标。',
    '8. 只能输出 JSON，不要输出 Markdown 和解释文字。',
    '',
    `输入内容：\n${instruction}`,
    '',
    `当前可编辑上下文：\n${JSON.stringify(editableResumeContext, null, 2)}`,
    '',
    `必须匹配的 JSON 结构：\n${JSON.stringify(schema, null, 2)}`,
  ].join('\n')
}
