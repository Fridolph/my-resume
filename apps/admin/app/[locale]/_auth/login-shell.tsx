'use client'

import { useRequest } from 'alova/client'
import { Card, CardContent, CardHeader, CardTitle } from '@heroui/react/card'
import { Chip } from '@heroui/react/chip'
import { useTranslations } from 'next-intl'
import { useEffect, useState } from 'react'

import { useAdminSession } from '@core/admin-session'
import { DEFAULT_API_BASE_URL } from '@core/env'
import { useRouter } from '@i18n/navigation'
import type { AppLocale } from '@i18n/types'
import { writeAccessToken } from '@core/session-storage'
import { ThemeModeToggle } from '@shared/ui/components/theme-mode-toggle'

import { createLoginWithPasswordMethod } from './services/auth-api'
import { LoginForm } from './components/login-form'

/**
 * 后台登录壳负责登录态检查、登录表单承接与跳转工作区
 *
 * @returns 后台登录壳节点
 */
export function AdminLoginShell({ locale }: { locale: AppLocale }) {
  const router = useRouter()
  const t = useTranslations('auth')
  const { currentUser, establishSession, status } = useAdminSession()
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const { loading: pending, send: triggerLogin } = useRequest(
    (values: { password: string; username: string }) =>
      createLoginWithPasswordMethod({
        apiBaseUrl: DEFAULT_API_BASE_URL,
        username: values.username,
        password: values.password,
      }),
    {
      force: true,
      immediate: false,
    },
  )

  useEffect(() => {
    // 已有合法会话时直接跳工作区，避免重复停留在登录页
    if (status === 'ready' && currentUser) {
      router.replace('/dashboard', { locale })
    }
  }, [currentUser, locale, router, status])

  const checkingSession = status === 'loading'

  /**
   * 处理后台登录主链路：鉴权成功后写入 token，并直接同步全局会话
   *
   * @param values 登录表单提交的用户名和密码
   * @returns 登录链路完成后的 Promise
   */
  async function handleLogin(values: { username: string; password: string }) {
    setErrorMessage(null)

    try {
      const loginResult = await triggerLogin(values)

      writeAccessToken(loginResult.accessToken)
      establishSession({
        accessToken: loginResult.accessToken,
        user: loginResult.user,
      })
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : '登录失败，请稍后重试')
    }
  }

  if (checkingSession) {
    return (
      <main className="mx-auto grid min-h-screen w-full max-w-3xl grid-cols-1 px-4 py-6 md:px-6">
        <Card className="border border-zinc-200/70 bg-white/90 shadow-xl dark:border-zinc-800 dark:bg-zinc-950/85">
          <CardContent className="py-12 text-center text-sm text-zinc-500 dark:text-zinc-400">
            {t('loginChecking')}
          </CardContent>
        </Card>
      </main>
    )
  }

  return (
    <main className="mx-auto grid min-h-screen w-full max-w-7xl grid-cols-1 gap-6 px-4 py-6 md:px-6 lg:grid-cols-[minmax(0,1.15fr)_minmax(20rem,28rem)] lg:items-center xl:px-10">
      <Card className="border border-zinc-200/70 bg-white/78 shadow-2xl backdrop-blur dark:border-zinc-800 dark:bg-zinc-950/78">
        <CardHeader className="flex flex-col items-start gap-5">
          <div className="flex items-center gap-2">
            <Chip size="sm">管理后台</Chip>
            <Chip size="sm">HeroUI Upgrade</Chip>
          </div>
          <div className="space-y-3">
            <p className="eyebrow">Admin Console</p>
            <CardTitle className="text-4xl font-semibold tracking-tight text-zinc-950 dark:text-white">
              {t('heroTitle')}
            </CardTitle>
            <p className="max-w-xl text-sm leading-7 text-zinc-500 dark:text-zinc-400">
              {t('heroDescription')}
            </p>
          </div>
        </CardHeader>
        <CardContent className="stack">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="status-box">
              <strong>{t('goalLabel')}</strong>
              <span>{t('goalValue')}</span>
            </div>
            <div className="status-box">
              <strong>{t('boundaryLabel')}</strong>
              <span>{t('boundaryValue')}</span>
            </div>
          </div>
          <ul className="muted-list">
            <li>{t('workflowOne')}</li>
            <li>{t('workflowTwo')}</li>
            <li>{t('workflowThree')}</li>
          </ul>
          <div className="flex flex-wrap items-center gap-3">
            <ThemeModeToggle />
            <a
              className="secondary-link-button"
              href="https://github.com/heroui-inc/heroui"
              target="_blank">
              HeroUI 参考
            </a>
          </div>
          {currentUser ? (
            <div className="status-box">
              已检测到登录状态：<strong>{currentUser.username}</strong>（
              {currentUser.role}）
            </div>
          ) : null}
        </CardContent>
      </Card>

      <LoginForm errorMessage={errorMessage} onSubmit={handleLogin} pending={pending} />
    </main>
  )
}
