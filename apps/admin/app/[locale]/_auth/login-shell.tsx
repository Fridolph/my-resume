'use client'
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
        <section aria-live="polite" className="w-[min(100%,34rem)] rounded-[2rem] p-12 text-slate-500 text-center border border-white/10 bg-white/60 shadow-[0_28px_80px_rgba(15,23,42,0.1)] backdrop-blur-[26px] dark:border-white/8 dark:bg-slate-900/65">
          {t('loginChecking')}
        </section>
      </main>
    )
  }

  return (
    <main className="login-login-page">
      <div className="login-login-frame">
        <section className="relative overflow-hidden min-h-[min(36rem,calc(100svh-3rem))] rounded-[clamp(1.35rem,2.8vw,2rem)] p-[clamp(1.35rem,3.2vw,2.35rem)] border border-white/10 bg-white/60 shadow-[0_28px_80px_rgba(15,23,42,0.1)] backdrop-blur-[26px] dark:border-white/8 dark:bg-slate-900/65 dark:shadow-[0_30px_90px_rgba(0,0,0,0.34)] max-sm:rounded-[1.45rem]" aria-labelledby="admin-login-story-title">
          <div className="flex items-center justify-between gap-4">
            <span className="inline-grid w-[2.65rem] h-[2.65rem] place-items-center rounded-[1.1rem] bg-slate-950 dark:bg-slate-50 text-white dark:text-slate-950 text-[0.82rem] font-extrabold tracking-[-0.06em]">MR</span>
            <ThemeModeToggle />
          </div>

          <div className="mt-[clamp(1.25rem,3.2vw,2.75rem)] max-w-[37rem]">
            <p className="m-0 text-blue-700 dark:text-blue-400 text-[0.76rem] font-extrabold tracking-[0.22em] uppercase">Personal Ops Console</p>
            <h1 className="mt-3 mb-0 max-w-[10.8em] text-slate-950 dark:text-slate-50 text-[clamp(2.1rem,4.2vw,4rem)] font-[740] tracking-[-0.055em] leading-[1.02]" id="admin-login-story-title">
              把简历维护，做成一间安静的工作室
            </h1>
            <p className="max-w-[40rem] mt-4 text-slate-500 dark:text-slate-400 text-[clamp(0.94rem,1.1vw,1.02rem)] leading-[1.75]">
              这里不是庞杂的后台，而是一套为个人品牌长期维护准备的内容工作台：
              写草稿、做 AI 辅助、确认发布，每一步都尽量少打扰、多确定。
            </p>
          </div>

          <div className="grid grid-cols-3 max-sm:grid-cols-1 gap-3 mt-[clamp(1.35rem,3vw,2.4rem)]" aria-label="后台核心能力">
            {capabilityCards.map((item) => (
              <article className="min-h-[8rem] rounded-[1.25rem] p-[0.9rem] border border-white/10 bg-white/60 dark:bg-white/5" key={item.index}>
                <span className="text-slate-400 text-[0.72rem] font-extrabold tracking-[0.16em]">{item.index}</span>
                <h2 className="mt-[0.95rem] text-slate-950 dark:text-slate-50 text-base font-[750]">{item.title}</h2>
                <p className="mt-2 text-slate-500 dark:text-slate-400 text-[0.82rem] leading-[1.65]">{item.description}</p>
              </article>
            ))}
          </div>

          <p className="block max-w-[35rem] mt-4 border border-blue-600/15 rounded-[1.15rem] bg-blue-50/75 p-[0.72rem_0.9rem] text-slate-600 dark:text-slate-300 text-[0.84rem] leading-[1.55] dark:border-blue-400/20 dark:bg-blue-950/10">
            viewer 保持只读边界，admin 承担编辑、AI 操作与发布职责；登录成功后统一进入
            /dashboard。
          </p>

          {currentUser ? (
            <p className="block max-w-[35rem] mt-4 border border-blue-600/15 rounded-[1.15rem] bg-blue-50/75 p-[0.72rem_0.9rem] text-slate-600 dark:text-slate-300 text-[0.84rem] leading-[1.55] dark:border-blue-400/20 dark:bg-blue-950/10">
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
