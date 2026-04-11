'use client'

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@heroui/react/card'
import { Chip } from '@heroui/react/chip'
import { useTranslations } from 'next-intl'
import { useState } from 'react'

import { useAdminSession } from '@core/admin-session'
import { DEFAULT_API_BASE_URL } from '@core/env'
import type { AppLocale } from '@core/i18n/types'
import { RoleActionPanel } from '@shared/ui/components/role-action-panel'

import { ExportEntryPanel } from './components/export-entry-panel'
import { postProtectedAction, publishResume } from '../../../_auth/services/auth-api'

export function AdminPublishShell({ locale }: { locale: AppLocale }) {
  const { accessToken, currentUser, status } = useAdminSession()
  const t = useTranslations('publish')
  const [pendingAction, setPendingAction] = useState<'publish' | 'ai-analysis' | null>(
    null,
  )
  const [feedbackMessage, setFeedbackMessage] = useState<string | null>(null)

  if (status !== 'ready' || !currentUser || !accessToken) {
    return null
  }

  const sessionToken = accessToken

  async function handlePublish() {
    setPendingAction('publish')
    setFeedbackMessage(null)

    try {
      const result = await publishResume({
        apiBaseUrl: DEFAULT_API_BASE_URL,
        accessToken: sessionToken,
      })

      setFeedbackMessage(
        `简历已发布：${result.resume.meta.slug}，请刷新公开站查看最新内容。`,
      )
    } catch (error) {
      setFeedbackMessage(error instanceof Error ? error.message : '发布失败，请稍后重试')
    } finally {
      setPendingAction(null)
    }
  }

  async function handleAiAction() {
    setPendingAction('ai-analysis')
    setFeedbackMessage(null)

    try {
      const result = await postProtectedAction({
        apiBaseUrl: DEFAULT_API_BASE_URL,
        accessToken: sessionToken,
        pathname: '/auth/demo/ai-analysis',
      })

      setFeedbackMessage(result.message)
    } catch (error) {
      setFeedbackMessage(
        error instanceof Error ? error.message : '当前角色无权执行该操作',
      )
    } finally {
      setPendingAction(null)
    }
  }

  return (
    <div className="stack">
      <section className="grid gap-4 xl:grid-cols-2">
        <Card className="border border-zinc-200/70 dark:border-zinc-800">
          <CardHeader className="flex flex-col items-start gap-3">
            <div className="flex flex-wrap gap-2">
              <Chip size="sm">当前角色：{currentUser.role}</Chip>
              <Chip size="sm">导出语言：ZH / EN</Chip>
            </div>
            <div className="space-y-2">
              <CardTitle className="text-3xl font-semibold tracking-tight">
                {t('pageTitle')}
              </CardTitle>
              <CardDescription className="max-w-2xl leading-7">
                {t('pageDescription')}
              </CardDescription>
            </div>
          </CardHeader>
          <CardContent className="stack">
            {currentUser.capabilities.canPublishResume ? (
              <div className="status-box">
                admin 可执行发布与导出，并继续保留 viewer 的只读边界。
              </div>
            ) : (
              <div className="readonly-box">
                viewer 可读取已发布导出结果，但不能触发新的发布动作。
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="border border-zinc-200/70 dark:border-zinc-800">
          <CardHeader className="flex flex-col items-start gap-2">
            <p className="eyebrow">工作流</p>
            <CardTitle>{t('workflowTitle')}</CardTitle>
            <CardDescription>{t('workflowDescription')}</CardDescription>
          </CardHeader>
          <CardContent className="stack">
            <div className="status-box">
              <strong>草稿态</strong>
              <span>后台保存只会更新 draft，不直接覆盖线上公开简历。</span>
            </div>
            <div className="status-box">
              <strong>发布态</strong>
              <span>只有 admin 可以把当前草稿推为公开版本。</span>
            </div>
            <div className="status-box">
              <strong>导出态</strong>
              <span>后台导出入口统一下载已发布版本，避免导出内容和线上阅读不一致。</span>
            </div>
          </CardContent>
        </Card>
      </section>

      <section className="grid gap-4 xl:grid-cols-2">
        <RoleActionPanel
          currentUser={currentUser}
          feedbackMessage={feedbackMessage}
          onPublish={handlePublish}
          onTriggerAi={handleAiAction}
          pendingAction={pendingAction}
        />
        <div className="stack">
          <ExportEntryPanel
            apiBaseUrl={DEFAULT_API_BASE_URL}
            locale={locale}
            role={currentUser.role}
          />
          <ExportEntryPanel
            apiBaseUrl={DEFAULT_API_BASE_URL}
            locale={locale === 'zh' ? 'en' : 'zh'}
            role={currentUser.role}
          />
        </div>
      </section>
    </div>
  )
}
