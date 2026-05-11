import type {
  AnalysisLocale,
  AnalysisScenario,
} from '../services/analysis-report-cache.service'

export interface BuildAnalysisReportPromptInput {
  /** 当前分析场景，例如 JD 匹配、简历体检或 offer 对比。 */
  scenario: AnalysisScenario
  /** 用户输入或待分析内容。 */
  content: string
  /** 输出语言。 */
  locale: AnalysisLocale
}

const ANALYSIS_REPORT_JSON_SCHEMA = {
  summary: 'string',
  score: {
    value: 78,
    label: 'string',
    reason: 'string',
  },
  strengths: ['string'],
  gaps: ['string'],
  risks: ['string'],
  suggestions: [
    {
      key: 'string',
      title: 'string',
      module: 'profile | experiences | projects | highlights | null',
      reason: 'string',
      actions: ['string'],
    },
  ],
}

/**
 * 构建 AI 分析报告系统 Prompt。
 *
 * 分析结果会进入缓存与历史记录，所以这里强制约束 provider 返回合法 JSON。
 */
export function buildAnalysisReportSystemPrompt(locale: AnalysisLocale): string {
  return locale === 'en'
    ? 'You are a resume analysis assistant. Output valid JSON only.'
    : '你是一个简历分析助手。只输出合法 JSON。'
}

/**
 * 构建 AI 分析报告用户 Prompt。
 */
export function buildAnalysisReportPrompt(input: BuildAnalysisReportPromptInput): string {
  if (input.locale === 'en') {
    return [
      `Scenario: ${input.scenario}`,
      'Task: analyze the current input for interview readiness and job-fit communication.',
      'Return JSON only. Do not wrap it in markdown.',
      'JSON shape:',
      JSON.stringify(ANALYSIS_REPORT_JSON_SCHEMA, null, 2),
      'Keep the output concise and product-friendly.',
      `Input:\n${input.content}`,
    ].join('\n')
  }

  return [
    `分析场景：${input.scenario}`,
    '任务：从“更好投递、面试更有说服力、拿到 offer 更稳”这三个角度分析当前输入。',
    '请只返回 JSON，不要输出 markdown，不要输出代码块。',
    'JSON 结构：',
    JSON.stringify(ANALYSIS_REPORT_JSON_SCHEMA, null, 2),
    '要求：strengths 说明已有优势，gaps 说明当前缺口，risks 说明不修改会带来的投递或面试风险，suggestions 给出可执行动作。',
    `输入内容：\n${input.content}`,
  ].join('\n')
}
