/**
 * RAG 检索重排策略类型。
 */
export type RagSearchRerankStrategy = 'experience' | 'project' | 'skill' | 'general'

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
    general: ['projects', 'work_experience', 'skills', 'core_strengths', 'profile'],
  },
  sectionBoost: {
    experience: {
      projects: {
        default: 0.1,
        summary: 0.12,
      },
      work_experience: {
        default: 0.08,
        summary: 0.1,
      },
      core_strengths: {
        default: 0.02,
      },
      skills: {
        default: -0.02,
      },
    },
    project: {
      projects: {
        default: 0.1,
        summary: 0.14,
      },
      work_experience: {
        default: 0.04,
      },
      skills: {
        default: -0.03,
      },
    },
    skill: {
      skills: {
        default: 0.1,
      },
      core_strengths: {
        default: 0.05,
      },
      projects: {
        default: 0.01,
      },
      work_experience: {
        default: 0.01,
      },
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
  },
}
