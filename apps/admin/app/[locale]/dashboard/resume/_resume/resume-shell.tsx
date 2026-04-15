'use client'

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@heroui/react/card'
import { Chip } from '@heroui/react/chip'
import { Skeleton } from '@heroui/react/skeleton'
import dynamic from 'next/dynamic'

import { useAdminSession } from '@core/admin-session'
import { DEFAULT_API_BASE_URL } from '@core/env'
import type { AppLocale } from '@i18n/types'

const ResumeDraftEditorPanel = dynamic(
  () => import('./draft-editor-panel').then((module) => module.ResumeDraftEditorPanel),
  {
    loading: () => (
      <div className="status-box" data-testid="resume-editor-loading">
        <p className="text-sm text-zinc-500 dark:text-zinc-400">正在加载简历编辑器...</p>
        <div className="mt-2 grid gap-2">
          <Skeleton className="h-4 w-4/5 rounded-md bg-zinc-200/80 dark:bg-zinc-800/80" />
          <Skeleton className="h-4 w-3/5 rounded-md bg-zinc-200/80 dark:bg-zinc-800/80" />
        </div>
      </div>
    ),
  },
)

const moduleRoadmap = [
  {
    key: 'profile',
    title: '基础信息',
    description: '已切到中文主编辑 + 英文翻译工作区，可维护摘要、链接与兴趣方向。',
    status: '已实现',
  },
  {
    key: 'education',
    title: '教育经历',
    description: '已接通双语教育经历编辑，可维护学校、学位、专业、时间、地点与亮点。',
    status: '已实现',
  },
  {
    key: 'experiences',
    title: '工作经历',
    description: '已支持公司、岗位、时间、地点、摘要、亮点与技术栈的草稿维护。',
    status: '已实现',
  },
  {
    key: 'projects',
    title: '项目经历',
    description: '已支持项目名称、角色、时间、摘要、亮点、技术栈与项目链接的草稿维护。',
    status: '已实现',
  },
  {
    key: 'skills',
    title: '技能与亮点',
    description: '技能组与亮点条目已接通，保持与公开展示和导出模型一致。',
    status: '已实现',
  },
] as const

/**
 * 简历编辑页壳负责权限判断、页面说明和编辑器入口，不直接处理字段级状态
 *
 * @returns 简历编辑页壳节点
 */
export function AdminResumeShell({ locale: _locale }: { locale: AppLocale }) {
  const { accessToken, currentUser, status } = useAdminSession()

  if (status !== 'ready' || !currentUser || !accessToken) {
    return null
  }

  return (
    <div className="stack">
      <Card className="border border-zinc-200/70 dark:border-zinc-800">
        <CardHeader className="flex flex-col items-start gap-2.5 px-4 py-4 sm:px-5 md:gap-3">
          <div className="flex flex-wrap gap-2">
            <Chip size="sm">当前账号：{currentUser.username}</Chip>
            <Chip size="sm">
              编辑模式：{currentUser.capabilities.canEditResume ? '可写' : '只读'}
            </Chip>
          </div>
          <div className="space-y-1.5 md:space-y-2">
            <CardTitle className="text-[1.85rem] font-semibold tracking-tight sm:text-[2.1rem] md:text-3xl">
              简历编辑
            </CardTitle>
            <CardDescription className="max-w-3xl text-sm leading-6 md:leading-7">
              这一页只负责简历草稿维护。内容保存后不会自动影响公开站，仍然需要到发布页手动发布，方便教学上清楚区分“编辑态”和“公开态”。
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent className="grid gap-3 px-4 pb-4 sm:px-5 md:gap-4">
          {currentUser.capabilities.canEditResume ? (
            <div className="dashboard-inline-note">
              当前已接通标准简历主模块编辑，并切到“中文主编辑 +
              英文翻译工作区”的维护方式。模块继续按基础信息、教育、工作、项目、技能与亮点分组，便于逐段维护与后续继续扩展翻译能力。
            </div>
          ) : (
            <div className="readonly-box">
              viewer 进入本页时保持只读提示，不开放草稿保存。
            </div>
          )}

          <div className="dashboard-badge-row text-sm">
            {moduleRoadmap.map((module) => (
              <div className="display-pill" key={module.key}>
                <strong>{module.title}</strong>
                <Chip size="sm">{module.status}</Chip>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <ResumeDraftEditorPanel
        accessToken={accessToken}
        apiBaseUrl={DEFAULT_API_BASE_URL}
        canEdit={Boolean(currentUser.capabilities.canEditResume)}
      />
    </div>
  )
}
