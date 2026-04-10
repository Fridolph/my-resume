'use client'

import { Button, Card, CardContent, CardHeader } from '@heroui/react'
import { DisplaySectionIntro } from '@my-resume/ui/display'

import { AuthUserView } from '../../auth/types/auth.types'
import {
  adminPrimaryButtonClass,
  adminSecondaryButtonClass,
} from '@/core/button-styles'

const actionGridClass =
  'grid grid-cols-[repeat(auto-fit,minmax(min(100%,16rem),1fr))] gap-4'
const primaryActionButtonClass = `${adminPrimaryButtonClass} min-h-[46px] justify-center rounded-full font-semibold`
const secondaryActionButtonClass = `${adminSecondaryButtonClass} min-h-[46px] justify-center rounded-full font-semibold`

interface RoleActionPanelProps {
  currentUser: AuthUserView
  pendingAction: 'publish' | 'ai-analysis' | null
  feedbackMessage: string | null
  onPublish: () => Promise<void>
  onTriggerAi: () => Promise<void>
}

export function RoleActionPanel({
  currentUser,
  pendingAction,
  feedbackMessage,
  onPublish,
  onTriggerAi,
}: RoleActionPanelProps) {
  const isViewer = currentUser.role === 'viewer'

  return (
    <Card className="border border-zinc-200/70 dark:border-zinc-800">
      <CardHeader className="flex flex-col items-start gap-2">
        <DisplaySectionIntro
          className="gap-2"
          description="当前阶段用最小动作集验证“viewer 只读、admin 可写”的权限边界。"
          descriptionClassName="text-[var(--admin-text-muted)]"
          eyebrow="角色动作"
          title="动作中心"
        />
      </CardHeader>
      <CardContent className="stack">
        {isViewer ? (
          <div className="readonly-box">
            当前账号为 viewer，只能查看，不能修改或触发真实操作。
          </div>
        ) : (
          <div className="status-box">
            当前账号为 admin，可执行发布与 AI 分析等敏感动作。
          </div>
        )}

        <div className={actionGridClass}>
          <Button
            className={primaryActionButtonClass}
            fullWidth
            isDisabled={isViewer || pendingAction !== null}
            onClick={() => void onPublish()}
            size="md"
            type="button"
            variant="primary">
            {pendingAction === 'publish' ? '发布中...' : '发布简历（管理员）'}
          </Button>
          <Button
            className={secondaryActionButtonClass}
            fullWidth
            isDisabled={isViewer || pendingAction !== null}
            onClick={() => void onTriggerAi()}
            size="md"
            type="button"
            variant="outline">
            {pendingAction === 'ai-analysis' ? '触发中...' : '触发 AI 分析（管理员）'}
          </Button>
        </div>

        {feedbackMessage ? (
          <div className="dashboard-inline-note">{feedbackMessage}</div>
        ) : null}
      </CardContent>
    </Card>
  )
}
