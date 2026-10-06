/**
 * 页面展示用的本地 mock 数据（仅 env.useMock 为 true 时引用）。
 * 后续接入后端时，各页面把这里的数据源换成对应 api-client 的方法即可。
 */

/* ------------------------------- 概览页 ------------------------------- */

export interface OverviewStat {
  key: string
  label: string
  value: number
  suffix?: string
}

export const mockOverviewStats: OverviewStat[] = [
  { key: 'versions', label: '简历版本', value: 12, suffix: '个' },
  { key: 'rag', label: 'RAG 知识条目', value: 86, suffix: '条' },
  { key: 'chat', label: 'AI 对话轮次', value: 59, suffix: '轮' },
]

export interface ActivityItem {
  id: string
  title: string
  time: string
}

export const mockRecentActivities: ActivityItem[] = [
  { id: 'a1', title: '发布简历 v2.6.0', time: '12 分钟前' },
  { id: 'a2', title: '重建 RAG 索引', time: '1 小时前' },
  { id: 'a3', title: '更新 user_docs', time: '3 小时前' },
]

/* ------------------------------- 简历页 ------------------------------- */

export interface ResumeSectionPreview {
  key: string
  title: string
  summary: string
  status: 'draft' | 'published'
}

export const mockResumeSections: ResumeSectionPreview[] = [
  { key: 'basic', title: '基本信息', summary: '姓名 / 职位 / 联系方式', status: 'published' },
  { key: 'experience', title: '工作经历', summary: '3 段经历，共 6 年', status: 'draft' },
  { key: 'projects', title: '项目经历', summary: '5 个项目', status: 'draft' },
  { key: 'skills', title: '技能标签', summary: 'Vue / Node / TypeScript', status: 'published' },
]

/* ------------------------------ AI 工作台 ------------------------------ */

export interface AiJobItem {
  id: string
  name: string
  status: 'success' | 'running' | 'failed'
  updatedAt: string
}

export const mockAiAnalysisJobs: AiJobItem[] = [
  { id: 'j1', name: '简历亮点分析', status: 'success', updatedAt: '今天 10:24' },
  { id: 'j2', name: '岗位匹配度评估', status: 'running', updatedAt: '今天 10:31' },
  { id: 'j3', name: '措辞润色建议', status: 'failed', updatedAt: '昨天 18:02' },
]

export const mockRagDocuments: AiJobItem[] = [
  { id: 'd1', name: '技术博客合集.pdf', status: 'success', updatedAt: '2 天前' },
  { id: 'd2', name: '项目复盘.md', status: 'success', updatedAt: '3 天前' },
]

/* ------------------------------- 发布治理 ------------------------------- */

export interface PublishRecordItem {
  id: string
  version: string
  status: 'published' | 'pending' | 'rolled_back'
  publishedAt: string
}

export const mockPublishRecords: PublishRecordItem[] = [
  { id: 'p1', version: 'v2.6.0', status: 'published', publishedAt: '2025-01-12 10:24' },
  { id: 'p2', version: 'v2.5.1', status: 'rolled_back', publishedAt: '2025-01-05 09:10' },
  { id: 'p3', version: 'v2.7.0', status: 'pending', publishedAt: '待发布' },
]
