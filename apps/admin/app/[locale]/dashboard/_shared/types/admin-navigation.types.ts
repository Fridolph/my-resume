export interface AdminNavigationItem {
  key: 'overview' | 'resume' | 'ai' | 'optimizationHistory' | 'publish'
  href:
    | '/dashboard'
    | '/dashboard/resume'
    | '/dashboard/ai'
    | '/dashboard/ai/optimization-history'
    | '/dashboard/publish'
  title: string
  description: string
  shortLabel: string
  eyebrow: string
}
