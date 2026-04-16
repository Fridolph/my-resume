import type {
  AiResumeOptimizationChangedModule,
  AiWorkbenchLocale,
  AiWorkbenchReport,
  AiWorkbenchScenario,
} from '../types/ai-workbench.types'

export const scenarioOptions: Array<{
  value: AiWorkbenchScenario
  label: string
}> = [
  {
    value: 'jd-match',
    label: 'JD 匹配分析',
  },
  {
    value: 'resume-review',
    label: '简历优化建议',
  },
  {
    value: 'offer-compare',
    label: 'Offer 对比建议',
  },
]

export const localeOptions: Array<{
  value: AiWorkbenchLocale
  label: string
}> = [
  {
    value: 'zh',
    label: '中文',
  },
  {
    value: 'en',
    label: 'English',
  },
]

export function formatScenario(scenario: AiWorkbenchScenario): string {
  return scenarioOptions.find((item) => item.value === scenario)?.label ?? scenario
}

export function formatLocale(locale: AiWorkbenchLocale): string {
  return locale === 'zh' ? '中文' : 'English'
}

export function formatOptimizationModule(
  module: AiResumeOptimizationChangedModule,
): string {
  const moduleLabels: Record<AiResumeOptimizationChangedModule, string> = {
    experiences: '工作经历',
    highlights: '亮点总结',
    profile: '个人定位',
    projects: '项目经历',
  }

  return moduleLabels[module] ?? module
}

export function formatGenerator(generator: AiWorkbenchReport['generator']): string {
  return generator === 'ai-provider' ? '真实 Provider' : '缓存结果'
}

export function formatScore(report: AiWorkbenchReport): string {
  return `评分：${report.score.value} / 100`
}
