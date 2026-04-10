'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@heroui/react/card'
import { Chip } from '@heroui/react/chip'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'

import { loginWithPassword } from './services/auth-api'
import { primeCurrentUserSession } from '../../core/admin-session-store'
import { DEFAULT_API_BASE_URL } from '../../core/env'
import { writeAccessToken } from '../../core/session-storage'
import { useAdminSession } from '../../core/admin-session'
import { LoginForm } from './components/login-form'
import { ThemeModeToggle } from '../shared/components/theme-mode-toggle'

export function AdminLoginShell() {
  const router = useRouter()
  const { currentUser, refreshSession, status } = useAdminSession()
  const [pending, setPending] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  useEffect(() => {
    if (status === 'ready' && currentUser) {
      router.replace('/dashboard')
    }
  }, [currentUser, router, status])

  const checkingSession = status === 'loading'

  async function handleLogin(values: { username: string; password: string }) {
    setPending(true)
    setErrorMessage(null)

    try {
      const loginResult = await loginWithPassword({
        apiBaseUrl: DEFAULT_API_BASE_URL,
        username: values.username,
        password: values.password,
      })

      writeAccessToken(loginResult.accessToken)
      primeCurrentUserSession({
        accessToken: loginResult.accessToken,
        apiBaseUrl: DEFAULT_API_BASE_URL,
        user: loginResult.user,
      })
      await refreshSession()
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : '登录失败，请稍后重试')
    } finally {
      setPending(false)
    }
  }

  if (checkingSession) {
    return (
      <main className="mx-auto grid min-h-screen w-full max-w-3xl grid-cols-1 px-4 py-6 md:px-6">
        <Card className="border border-zinc-200/70 bg-white/90 shadow-xl dark:border-zinc-800 dark:bg-zinc-950/85">
          <CardContent className="py-12 text-center text-sm text-zinc-500 dark:text-zinc-400">
            正在检查登录状态...
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
              面向内容维护与 AI 操作的标准后台壳
            </CardTitle>
            <p className="max-w-xl text-sm leading-7 text-zinc-500 dark:text-zinc-400">
              这轮只升级后台信息架构与视觉壳层，不改后端 API，不把业务逻辑挪进 Next Route
              Handlers，也不扩到展示端样式体系。
            </p>
          </div>
        </CardHeader>
        <CardContent className="stack">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="status-box">
              <strong>当前目标</strong>
              <span>建立概览、简历编辑、AI 工作台、发布导出四个主工作区。</span>
            </div>
            <div className="status-box">
              <strong>当前边界</strong>
              <span>继续沿用前端 token 校验，不在这轮升级 cookie / middleware。</span>
            </div>
          </div>
          <ul className="muted-list">
            <li>业务逻辑继续只走 `apps/server`，admin 只做后台会话壳和操作入口。</li>
            <li>当前 demo 账号：`admin / admin123456`、`viewer / viewer123456`。</li>
            <li>
              登录成功后进入 `/dashboard`，viewer 保持只读体验，admin 可继续写与发布。
            </li>
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
