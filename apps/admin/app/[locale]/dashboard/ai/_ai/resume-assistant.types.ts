/** 简历助手前端类型（与 server 端 resume-assistant.types.ts 对齐） */

export type ResumeAssistantSection =
  | 'profile'
  | 'education'
  | 'experiences'
  | 'projects'
  | 'skills'
  | 'highlights'
  | 'interests'

export interface ResumeSectionCompleteness {
  section: ResumeAssistantSection
  label: string
  percentage: number
  status: 'empty' | 'partial' | 'complete'
}

export interface ResumeAssistantSuggestion {
  section: ResumeAssistantSection
  explanation: string
  data: Record<string, unknown>
}
