'use client'
import './login-shell.css'

import { useRequest } from 'alova/client'
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

const capabilityCards = [
  {
    index: '01',
    title: '简历草稿',
    description: '维护标准简历结构，保存草稿与公开发布严格分离。',
  },
  {
    index: '02',
    title: 'AI 工作台',
    description: '承接 RAG、JD 匹配与简历优化建议的后台操作入口。',
  },
  {
    index: '03',
    title: '发布导出',
    description: '让公开站、Markdown、PDF 输出保持同一份可信内容源。',
  },
] as const

/**
 * 后台登录壳负责登录态检查、登录表单承接与跳转工作区
 *
 * @returns 后台登录壳节点
 */
export function AdminLoginShell({ locale: _locale }: { locale: AppLocale }) {
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
      router.replace('/dashboard')
    }
  }, [currentUser, router, status])

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
      <main className="login-login-page">
        <section aria-live="polite" className="login-loading-card">
          {t('loginChecking')}
        </section>
      </main>
    )
  }

  return (
    <main className="login-login-page">
      <div className="login-login-frame">
        <section className="login-story-panel" aria-labelledby="admin-login-story-title">
          <div className="login-brand-row">
            <span className="login-brand-mark">MR</span>
            <ThemeModeToggle />
          </div>

          <div className="login-hero-copy">
            <p className="login-kicker">Personal Ops Console</p>
            <h1 className="login-hero-title" id="admin-login-story-title">
              把简历维护，做成一间安静的工作室
            </h1>
            <p className="login-hero-description">
              这里不是庞杂的后台，而是一套为个人品牌长期维护准备的内容工作台：
              写草稿、做 AI 辅助、确认发布，每一步都尽量少打扰、多确定。
            </p>
          </div>

          <div className="login-capability-grid" aria-label="后台核心能力">
            {capabilityCards.map((item) => (
              <article className="login-capability-card" key={item.index}>
                <span className="login-capability-index">{item.index}</span>
                <h2 className="login-capability-title">{item.title}</h2>
                <p className="login-capability-description">{item.description}</p>
              </article>
            ))}
          </div>

          <p className="login-quiet-note">
            viewer 保持只读边界，admin 承担编辑、AI 操作与发布职责；登录成功后统一进入
            /dashboard。
          </p>

          {currentUser ? (
            <p className="login-quiet-note">
              已检测到登录状态：<strong>{currentUser.username}</strong>（
              {currentUser.role}）
            </p>
          ) : null}
        </section>

        <LoginForm errorMessage={errorMessage} onSubmit={handleLogin} pending={pending} />
      </div>
    </main>
  )
}
