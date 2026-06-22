/**
 * 简历完整性助手 — 类型定义。
 */

/** 简历完整性助手面向的 section */
export type ResumeAssistantSection =
  | 'profile'
  | 'education'
  | 'experiences'
  | 'projects'
  | 'skills'
  | 'highlights'
  | 'interests'

export const RESUME_ASSISTANT_SECTIONS: ResumeAssistantSection[] = [
  'profile',
  'education',
  'experiences',
  'projects',
  'skills',
  'highlights',
  'interests',
]

/** 单个 section 的完整度状态 */
export interface ResumeSectionCompleteness {
  section: ResumeAssistantSection
  label: string
  /** 0-100 */
  percentage: number
  status: 'empty' | 'partial' | 'complete'
}

/** AI 提取的字段建议 */
export interface ResumeAssistantSuggestion {
  section: ResumeAssistantSection
  /** 解释性的自然语言说明（UI 展示用） */
  explanation: string
  /** 对应 section 的结构化数据（部分字段） */
  data: Record<string, unknown>
}

/** AI 消息中的 JSON 载荷 */
export interface ResumeAssistantJsonPayload {
  completeness?: ResumeSectionCompleteness[]
  suggestions?: ResumeAssistantSuggestion[]
}
