import { RagSearchMatch } from './rag.types'

/**
 * 检索问题策略类型。
 */
export type RagSearchQuestionStrategy = 'experience' | 'project' | 'skill' | 'general'

/**
 * 单条命中的重排诊断信息。
 */
export interface RagSearchRerankDetail {
  match: RagSearchMatch
  baseScore: number
  rerankScore: number
  sectionBoost: number
  keywordBoost: number
  matchedHints: string[]
  noiseReasons: string[]
}

function normalizeText(value: string | undefined): string {
  return String(value ?? '').trim().toLowerCase()
}

/**
 * 从问题中识别检索策略。
 *
 * @param query 用户问题
 * @returns 策略类型
 */
export function detectRagSearchQuestionStrategy(query: string): RagSearchQuestionStrategy {
  const normalized = normalizeText(query)

  if (/经验|经历|做过|负责过|项目|实战|案例|落地|主导|参与|开发相关经验/.test(normalized)) {
    return 'experience'
  }

  if (/技能|擅长|会什么|技术栈|掌握|熟悉/.test(normalized)) {
    return 'skill'
  }

  if (/项目|作品|案例/.test(normalized)) {
    return 'project'
  }

  return 'general'
}

function getQuestionHints(query: string): string[] {
  const normalized = normalizeText(query)
  const hints = new Set<string>()

  if (normalized.includes('ai')) {
    ;[
      'ai',
      'agent',
      'prompt',
      'sse',
      '流式',
      '工作流',
      '多 agent',
      '多智能体',
      'ai 工作台',
      'ai 分析',
    ].forEach((item) => hints.add(item))
  }

  if (normalized.includes('agent')) {
    ;['agent', '多 agent', '多智能体', '工作流', '规划', '执行', '验证', '反馈'].forEach(
      (item) => hints.add(item),
    )
  }

  if (normalized.includes('my-resume') || normalized.includes('简历')) {
    ;['my-resume', '简历', 'ai 工作台', 'markdown', 'pdf', 'monorepo'].forEach((item) =>
      hints.add(item),
    )
  }

  if (/sse|流式/.test(normalized)) {
    ;['sse', '流式', '会话管理', '上下文'].forEach((item) => hints.add(item))
  }

  return [...hints]
}

function getPreferredSections(strategy: RagSearchQuestionStrategy): string[] {
  if (strategy === 'experience') {
    return ['projects', 'work_experience', 'core_strengths']
  }

  if (strategy === 'project') {
    return ['projects', 'work_experience']
  }

  if (strategy === 'skill') {
    return ['skills', 'core_strengths', 'projects']
  }

  return ['projects', 'work_experience', 'skills', 'core_strengths', 'profile']
}

function scoreSectionBoost(match: RagSearchMatch, strategy: RagSearchQuestionStrategy): number {
  const section = normalizeText(match.section)
  const content = normalizeText(match.content)

  if (strategy === 'experience') {
    if (section === 'projects') {
      return content.includes('项目概览') ? 0.12 : 0.1
    }

    if (section === 'work_experience') {
      return content.includes('工作概述') ? 0.1 : 0.08
    }

    if (section === 'core_strengths') {
      return 0.02
    }

    if (section === 'skills') {
      return -0.02
    }
  }

  if (strategy === 'project') {
    if (section === 'projects') {
      return content.includes('项目概览') ? 0.14 : 0.1
    }

    if (section === 'work_experience') {
      return 0.04
    }

    if (section === 'skills') {
      return -0.03
    }
  }

  if (strategy === 'skill') {
    if (section === 'skills') {
      return 0.1
    }

    if (section === 'core_strengths') {
      return 0.05
    }

    if (section === 'projects') {
      return 0.01
    }

    if (section === 'work_experience') {
      return 0.01
    }
  }

  return 0
}

function getMatchedHints(match: RagSearchMatch, hints: readonly string[]): string[] {
  if (hints.length === 0) {
    return []
  }

  const haystack = [
    normalizeText(match.section),
    normalizeText(match.title),
    normalizeText(match.sourceType),
    normalizeText(match.sourcePath),
    normalizeText(match.content),
  ].join('\n')

  return hints.filter((hint) => haystack.includes(normalizeText(hint)))
}

function scoreKeywordBoost(matchedHints: readonly string[]): number {
  return Math.min(matchedHints.length * 0.015, 0.09)
}

function buildNoiseReasons(input: {
  match: RagSearchMatch
  strategy: RagSearchQuestionStrategy
  matchedHints: readonly string[]
  baseScore: number
  rerankScore: number
  leaderRerankScore: number
}): string[] {
  const reasons: string[] = []
  const preferredSections = getPreferredSections(input.strategy)
  const section = normalizeText(input.match.section)

  if (!preferredSections.includes(section)) {
    reasons.push('非当前问题优先 section')
  }

  if (input.matchedHints.length === 0 && input.strategy !== 'general') {
    reasons.push('未命中问题主题 hints')
  }

  if (input.leaderRerankScore - input.rerankScore > 0.14) {
    reasons.push('与头部结果分差过大')
  }

  if (input.baseScore < 0.48) {
    reasons.push('原始分数偏低')
  }

  if (input.rerankScore < 0.6) {
    reasons.push('重排后分数偏低')
  }

  return reasons
}

/**
 * 对检索结果进行问题策略重排，并返回诊断信息。
 *
 * @param matches 检索命中列表
 * @param query 用户问题
 * @param strategy 可选策略；未传时自动识别
 * @returns 重排后的明细（按 rerankScore 降序）
 */
export function rerankRagSearchMatches(
  matches: RagSearchMatch[],
  query: string,
  strategy: RagSearchQuestionStrategy = detectRagSearchQuestionStrategy(query),
): RagSearchRerankDetail[] {
  const hints = getQuestionHints(query)

  const reranked = matches
    .map((match) => {
      const baseScore = Number(match.score || 0)
      const sectionBoost = scoreSectionBoost(match, strategy)
      const matchedHints = getMatchedHints(match, hints)
      const keywordBoost = scoreKeywordBoost(matchedHints)
      const rerankScore = Number((baseScore + sectionBoost + keywordBoost).toFixed(6))

      return {
        match,
        baseScore,
        rerankScore,
        sectionBoost: Number(sectionBoost.toFixed(6)),
        keywordBoost: Number(keywordBoost.toFixed(6)),
        matchedHints,
      }
    })
    .sort((left, right) => right.rerankScore - left.rerankScore)

  const leaderRerankScore = reranked[0]?.rerankScore ?? 0

  return reranked.map((item) => ({
    ...item,
    noiseReasons: buildNoiseReasons({
      match: item.match,
      strategy,
      matchedHints: item.matchedHints,
      baseScore: item.baseScore,
      rerankScore: item.rerankScore,
      leaderRerankScore,
    }),
  }))
}

/**
 * 返回用于 API 的重排结果（不携带诊断字段）。
 *
 * @param matches 检索命中列表
 * @param query 用户问题
 * @param limit 返回条数
 * @param strategy 可选策略；未传时自动识别
 * @returns 按 rerank 后得分截断的命中列表
 */
export function applyRagSearchRerank(
  matches: RagSearchMatch[],
  query: string,
  limit = matches.length,
  strategy?: RagSearchQuestionStrategy,
): RagSearchMatch[] {
  return rerankRagSearchMatches(matches, query, strategy)
    .slice(0, Math.max(Math.floor(limit), 0))
    .map((item) => item.match)
}
