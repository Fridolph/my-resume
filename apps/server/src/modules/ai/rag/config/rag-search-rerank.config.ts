/**
 * RAG 检索重排策略类型。
 */
export type RagSearchRerankStrategy = 'experience' | 'project' | 'skill' | 'hobby' | 'general'

/**
 * section 加权规则。
 */
export interface RagSearchSectionBoostRule {
  default: number
  summary?: number
}

/**
 * 重排阈值配置。
 */
export interface RagSearchRerankThresholdConfig {
  keywordBoostPerHit: number
  keywordBoostMax: number
  rerankGapNoiseThreshold: number
  rawScoreNoiseThreshold: number
  rerankScoreNoiseThreshold: number
  sectionBoostAttenuationWithoutTopicHit: number
  /** ask() 重排后最低采纳分，低于此值的匹配直接截断 */
  askMinRerankScore: number
}

/**
 * 单策略下的选择配置（证据分层阈值）。
 */
export interface RagSearchSelectionConfig {
  minFinalCount: number
  maxPrimaryCount: number
  maxPreferredSupportCount: number
  primaryMinRerankScore: number
  supportMinRerankScore: number
  hardDropMinNoiseReasons: number
  reserveMinRerankScore: number
}

/**
 * 单策略下的精确度配置。
 */
export interface RagSearchPrecisionConfig {
  primaryMinRerankScore: number
  supportMinRerankScore: number
  hardDropMinNoiseReasons: number
}

/**
 * RAG 重排配置。
 */
export interface RagSearchRerankConfig {
  keywordHints: Record<string, string[]>
  preferredSections: Record<RagSearchRerankStrategy, string[]>
  sectionBoost: Record<
    RagSearchRerankStrategy,
    Record<string, RagSearchSectionBoostRule | undefined> & {
      __default?: RagSearchSectionBoostRule
    }
  >
  summaryHintsBySection: Record<string, string[]>
  thresholds: RagSearchRerankThresholdConfig
  selection: Record<RagSearchRerankStrategy, RagSearchSelectionConfig>
}

/**
 * 默认重排配置（v5 对位：规则与参数配置外置）。
 */
export const DEFAULT_RAG_SEARCH_RERANK_CONFIG: RagSearchRerankConfig = {
  keywordHints: {
    ai: ['ai', 'agent', 'prompt', 'sse', '流式', '工作流', '多 agent', '多智能体', 'ai 工作台', 'ai 分析'],
    agent: ['agent', '多 agent', '多智能体', '工作流', '规划', '执行', '验证', '反馈'],
    'my-resume': ['my-resume', '简历', 'ai 工作台', 'markdown', 'pdf', 'monorepo'],
    简历: ['my-resume', '简历', 'ai 工作台', 'markdown', 'pdf', 'monorepo'],
    sse: ['sse', '流式', '会话管理', '上下文'],
    流式: ['sse', '流式', '会话管理', '上下文'],
  },
  preferredSections: {
    experience: ['projects', 'work_experience', 'core_strengths'],
    project: ['projects', 'work_experience'],
    skill: ['skills', 'core_strengths', 'projects'],
    hobby: ['hobbies', 'interests', 'articles', 'user_docs'],
    general: ['projects', 'work_experience', 'skills', 'core_strengths', 'profile'],
  },
  sectionBoost: {
    experience: {
      projects: { default: 0.1, summary: 0.12 },
      work_experience: { default: 0.08, summary: 0.1 },
      core_strengths: { default: 0.02 },
      skills: { default: -0.02 },
    },
    project: {
      projects: { default: 0.1, summary: 0.14 },
      work_experience: { default: 0.04 },
      skills: { default: -0.03 },
    },
    skill: {
      skills: { default: 0.1 },
      core_strengths: { default: 0.05 },
      projects: { default: 0.01 },
      work_experience: { default: 0.01 },
    },
    hobby: {
      __default: { default: 0.01 },
      hobbies: { default: 0.15 },
      interests: { default: 0.12 },
      articles: { default: 0.08 },
      user_docs: { default: 0.08 },
      core_strengths: { default: -0.05 },
      work_experience: { default: -0.03 },
      skills: { default: -0.02 },
    },
    general: {},
  },
  summaryHintsBySection: {
    projects: ['项目概览'],
    work_experience: ['工作概述'],
  },
  thresholds: {
    keywordBoostPerHit: 0.015,
    keywordBoostMax: 0.09,
    rerankGapNoiseThreshold: 0.14,
    rawScoreNoiseThreshold: 0.48,
    rerankScoreNoiseThreshold: 0.6,
    sectionBoostAttenuationWithoutTopicHit: 0.35,
    askMinRerankScore: 0.1,
  },
  selection: {
    experience: {
      minFinalCount: 6,
      maxPrimaryCount: 4,
      maxPreferredSupportCount: 2,
      primaryMinRerankScore: 0.66,
      supportMinRerankScore: 0.61,
      hardDropMinNoiseReasons: 4,
      reserveMinRerankScore: 0.58,
    },
    project: {
      minFinalCount: 6,
      maxPrimaryCount: 3,
      maxPreferredSupportCount: 2,
      primaryMinRerankScore: 0.66,
      supportMinRerankScore: 0.61,
      hardDropMinNoiseReasons: 4,
      reserveMinRerankScore: 0.58,
    },
    skill: {
      minFinalCount: 5,
      maxPrimaryCount: 3,
      maxPreferredSupportCount: 2,
      primaryMinRerankScore: 0.66,
      supportMinRerankScore: 0.61,
      hardDropMinNoiseReasons: 4,
      reserveMinRerankScore: 0.58,
    },
    hobby: {
      minFinalCount: 3,
      maxPrimaryCount: 2,
      maxPreferredSupportCount: 2,
      primaryMinRerankScore: 0.3,
      supportMinRerankScore: 0.2,
      hardDropMinNoiseReasons: 4,
      reserveMinRerankScore: 0.12,
    },
    general: {
      minFinalCount: 5,
      maxPrimaryCount: 4,
      maxPreferredSupportCount: 3,
      primaryMinRerankScore: 0.5,
      supportMinRerankScore: 0.45,
      hardDropMinNoiseReasons: 5,
      reserveMinRerankScore: 0.35,
    },
  },
}
