export interface AdminNavigationItem {
  key: 'overview' | 'resume' | 'ai' | 'publish'
  href: '/dashboard' | '/dashboard/resume' | '/dashboard/ai' | '/dashboard/publish'
  title: string
  description: string
  shortLabel: string
  eyebrow: string
}
