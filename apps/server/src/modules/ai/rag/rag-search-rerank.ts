import { RagSearchMatch } from './rag.types'
import {
  DEFAULT_RAG_SEARCH_RERANK_CONFIG,
  RagSearchRerankConfig,
  RagSearchRerankStrategy,
} from './config/rag-search-rerank.config'

/**
 * 检索问题策略类型。
 */
export type RagSearchQuestionStrategy = RagSearchRerankStrategy

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
  topicHit: boolean
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

function getQuestionHints(query: string, config: RagSearchRerankConfig): string[] {
  const normalized = normalizeText(query)
  const hints = new Set<string>()

  for (const [trigger, expansions] of Object.entries(config.keywordHints)) {
    if (!normalized.includes(normalizeText(trigger))) {
      continue
    }

    expansions.forEach((item) => hints.add(item))
  }

  return [...hints]
}

function getPreferredSections(
  strategy: RagSearchQuestionStrategy,
  config: RagSearchRerankConfig,
): string[] {
  return config.preferredSections[strategy] ?? config.preferredSections.general
}

/**
 * 提取问题中的主题关键词，用于判断 chunk 是否与问题主题直接相关。
 *
 * 从 rag7 学习：先展开 keyword hints，再从问题中提取触发词和扩展词，
 * 组成"问题主题关键词集合"。后续用这个集合判断每条 chunk 的 haystack
 * 是否包含问题核心主题——这是区分"真相关"和"只沾边"的关键。
 */
function extractQuestionKeywords(query: string, config: RagSearchRerankConfig): string[] {
  const normalized = normalizeText(query)
  const keywords = new Set<string>()

  for (const [trigger, expansions] of Object.entries(config.keywordHints)) {
    const normalizedTrigger = normalizeText(trigger)

    if (!normalized.includes(normalizedTrigger)) {
      continue
    }

    keywords.add(normalizedTrigger)
    expansions.forEach((item) => keywords.add(normalizeText(item)))
  }

  return [...keywords]
}

/**
 * 判断 chunk 是否命中问题主题（至少一个问题关键词出现在 chunk 内容中）。
 *
 * 这是 rag7 的 computeTopicAlignment 简化版：不做多字段拼接，
 * 只检查 chunk 内容是否包含问题主题关键词。
 */
function isTopicAligned(match: RagSearchMatch, questionKeywords: string[]): boolean {
  if (questionKeywords.length === 0) {
    return true
  }

  const haystack = normalizeText([match.title, match.section, match.content].join('\n'))

  return questionKeywords.some((keyword) => haystack.includes(keyword))
}

function scoreSectionBoost(
  match: RagSearchMatch,
  strategy: RagSearchQuestionStrategy,
  config: RagSearchRerankConfig,
  topicHit: boolean,
): number {
  const section = normalizeText(match.section)
  const content = normalizeText(match.content)
  const strategyConfig = config.sectionBoost[strategy] ?? config.sectionBoost.general
  const rule = strategyConfig[section] ?? strategyConfig.__default

  if (!rule) {
    return 0
  }

  const summaryHints = config.summaryHintsBySection[section] ?? []
  const summaryMatched = summaryHints.some((hint) => content.includes(normalizeText(hint)))
  const base = summaryMatched && typeof rule.summary === 'number' ? rule.summary : rule.default

  // 经验/项目类问题下，没命中主题时衰减 section boost，防止
  // 技能描述块因为"AI"等泛化关键词被误排到前面。
  // 来自 rag7 scoreSectionBoost 的设计思路。
  if (
    (strategy === 'experience' || strategy === 'project') &&
    (section === 'projects' || section === 'work_experience' || section === 'experiences') &&
    !topicHit
  ) {
    return base * config.thresholds.sectionBoostAttenuationWithoutTopicHit
  }

  return base
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

function scoreKeywordBoost(
  matchedHints: readonly string[],
  config: RagSearchRerankConfig,
): number {
  return Math.min(
    matchedHints.length * config.thresholds.keywordBoostPerHit,
    config.thresholds.keywordBoostMax,
  )
}

function buildNoiseReasons(input: {
  match: RagSearchMatch
  strategy: RagSearchQuestionStrategy
  matchedHints: readonly string[]
  baseScore: number
  rerankScore: number
  leaderRerankScore: number
  topicHit: boolean
  questionKeywords: readonly string[]
  config: RagSearchRerankConfig
}): string[] {
  const reasons: string[] = []
  const preferredSections = getPreferredSections(input.strategy, input.config)
  const section = normalizeText(input.match.section)

  if (!preferredSections.includes(section)) {
    reasons.push('非当前问题优先 section')
  }

  if (input.matchedHints.length === 0 && input.strategy !== 'general') {
    reasons.push('未命中问题主题 hints')
  }

  if (!input.topicHit && input.questionKeywords.length > 0) {
    reasons.push('与问题主题缺少直接文本关联')
  }

  if (input.leaderRerankScore - input.rerankScore > input.config.thresholds.rerankGapNoiseThreshold) {
    reasons.push('与头部结果分差过大')
  }

  if (input.baseScore < input.config.thresholds.rawScoreNoiseThreshold) {
    reasons.push('原始分数偏低')
  }

  if (input.rerankScore < input.config.thresholds.rerankScoreNoiseThreshold) {
    reasons.push('重排后分数偏低')
  }

  if (
    (input.strategy === 'experience' || input.strategy === 'project') &&
    input.matchedHints.length === 0 &&
    !preferredSections.includes(section)
  ) {
    reasons.push('经验/项目类问题下缺少主题证据')
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
  config: RagSearchRerankConfig = DEFAULT_RAG_SEARCH_RERANK_CONFIG,
): RagSearchRerankDetail[] {
  const hints = getQuestionHints(query, config)
  const questionKeywords = extractQuestionKeywords(query, config)

  const reranked = matches
    .map((match) => {
      const baseScore = Number(match.score || 0)
      const topicHit = isTopicAligned(match, questionKeywords)
      const sectionBoost = scoreSectionBoost(match, strategy, config, topicHit)
      const matchedHints = getMatchedHints(match, hints)
      const keywordBoost = scoreKeywordBoost(matchedHints, config)
      const rerankScore = Number((baseScore + sectionBoost + keywordBoost).toFixed(6))

      return {
        match,
        baseScore,
        rerankScore,
        sectionBoost: Number(sectionBoost.toFixed(6)),
        keywordBoost: Number(keywordBoost.toFixed(6)),
        matchedHints,
        topicHit,
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
      topicHit: item.topicHit,
      questionKeywords,
      config,
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
  config: RagSearchRerankConfig = DEFAULT_RAG_SEARCH_RERANK_CONFIG,
): RagSearchMatch[] {
  return rerankRagSearchMatches(matches, query, strategy, config)
    .slice(0, Math.max(Math.floor(limit), 0))
    .map((item) => item.match)
}
