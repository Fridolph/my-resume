/**
 * 后台导航项模型。
 */
export interface AdminNavigationItem {
  key: 'overview' | 'resume' | 'ai' | 'optimizationHistory' | 'publish' | 'resumeAssistant'
  href:
    | '/dashboard'
    | '/dashboard/resume'
    | '/dashboard/ai'
    | '/dashboard/ai/optimization-history'
    | '/dashboard/publish'
    | '/dashboard/ai/resume-assistant'
  title: string
  description: string
  shortLabel: string
  eyebrow: string
}
