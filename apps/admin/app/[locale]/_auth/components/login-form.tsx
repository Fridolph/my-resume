'use client'
import { Input } from '@heroui/react/input'
import { Button } from '@heroui/react/button'

import type { FormEvent } from 'react'
import { useState } from 'react'


interface LoginFormProps {
  pending: boolean
  errorMessage: string | null
  onSubmit: (values: { username: string; password: string }) => Promise<void>
}

const demoAccounts = [
  {
    username: 'admin',
    password: 'fri5945admin',
    role: '管理员',
    caption: '请自行fork体验',
    fillPasswordOnClick: false,
    showPassword: false,
  },
  {
    username: 'viewer',
    password: 'viewer123456',
    role: '观察者',
    caption: '线上环境仅保留 viewer 模式：可查看，不能编辑、发布或触发 AI。',
    fillPasswordOnClick: true,
    showPassword: true,
  },
] as const

export function LoginForm({ pending, errorMessage, onSubmit }: LoginFormProps) {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    await onSubmit({
      username,
      password,
    })
  }

  return (
    <section aria-labelledby="admin-login-form-title" className="self-center rounded-[clamp(1.35rem,2.6vw,1.9rem)] p-[clamp(1.1rem,2vw,1.45rem)] border border-white/10 bg-white/60 shadow-[0_28px_80px_rgba(15,23,42,0.1)] backdrop-blur-[26px] dark:border-white/8 dark:bg-slate-900/65">
      <div className="grid gap-[0.7rem] p-[0.45rem_0.25rem_1.15rem]">
        <p className="login-kicker">Private Entrance</p>
        <h2 className="m-0 text-slate-950 dark:text-slate-50 text-[clamp(1.6rem,2.4vw,2.05rem)] font-[740] tracking-[-0.04em] leading-[1.08]" id="admin-login-form-title">
          进入后台工作台
        </h2>
        <p className="m-0 text-slate-500 dark:text-slate-400 text-[0.88rem] leading-[1.6]">
          只保留必要的用户名与密码登录；会话仍通过本地 token 与 /api/auth/me
          校验，避免额外入口打扰。
        </p>
      </div>

      <form className="grid gap-4" onSubmit={handleSubmit}>
        <label className="grid gap-[0.55rem] text-slate-700 dark:text-slate-300 text-[0.88rem] font-[650]">
          <span>用户名</span>
          <Input
            autoComplete="username"
            fullWidth
            name="username"
            onChange={(event) => setUsername(event.target.value)}
            placeholder="admin / viewer"
            value={username}
            variant="secondary"
          />
        </label>

        <label className="grid gap-[0.55rem] text-slate-700 dark:text-slate-300 text-[0.88rem] font-[650]">
          <span>密码</span>
          <Input
            autoComplete="current-password"
            fullWidth
            name="password"
            onChange={(event) => setPassword(event.target.value)}
            placeholder="请输入密码"
            type="password"
            value={password}
            variant="secondary"
          />
        </label>

        {errorMessage ? (
          <p aria-live="polite" className="error-text">
            {errorMessage}
          </p>
        ) : null}

        <Button
          className="min-h-[3rem] rounded-full font-[720] tracking-[0.04em] transition-[transform,background-color,box-shadow] duration-[160ms] hover:translate-y-[-1px] hover:shadow-[0_14px_28px_rgba(29,78,216,0.22)]"
          fullWidth
          isDisabled={pending}
          size="md"
          type="submit"
          variant="primary">
          {pending ? '登录中...' : '登录后台'}
        </Button>
      </form>

      <div className="grid gap-[0.7rem] mt-4">
        <div className="flex items-end justify-between gap-4">
          <div>
            <p className="m-0 text-slate-950 dark:text-slate-50 text-[0.9rem] font-[760]">演示账号</p>
            <p className="mt-[0.2rem] text-slate-400 text-[0.78rem]">点击卡片填入账号，不会自动登录。</p>
          </div>
        </div>

        <div className="grid grid-cols-2 max-[420px]:grid-cols-1 gap-[0.7rem]">
          {demoAccounts.map((account) => (
            <Button
              aria-label={`填入${account.role}演示账号`}
              className="grid w-full min-h-[8rem] gap-[0.55rem] content-start items-stretch appearance-none rounded-[1.25rem] p-[0.88rem] text-slate-950 dark:text-white cursor-pointer text-left transition-[transform,border-color,background-color,box-shadow] duration-[180ms] hover:-translate-y-[0.5px] hover:border-blue-600/25 hover:bg-white/85 hover:shadow-[0_14px_34px_rgba(15,23,42,0.08)] dark:hover:bg-white/8 border border-white/10 bg-white/60 dark:bg-white/5"
              fullWidth
              key={account.username}
              onPress={() => {
                setUsername(account.username)
                if (account.fillPasswordOnClick) {
                  setPassword(account.password)
                  return
                }

                setPassword('')
              }}
              type="button"
              variant="ghost">
              <span className="flex items-center justify-between gap-2 font-[760] leading-[1.25]">
                {account.role}
                <span className="flex-shrink-0 rounded-full bg-blue-600/10 px-2 py-[0.22rem] text-blue-700 dark:text-blue-400 text-[0.64rem] font-extrabold tracking-[0.08em]">{account.username}</span>
              </span>
              <span className="grid min-w-0 gap-[0.18rem] text-slate-500 dark:text-slate-400 text-[0.74rem] leading-[1.4] [overflow-wrap:anywhere]">
                <span>
                  账号：
                  <code>{account.username}</code>
                </span>
                {account.showPassword ? (
                  <span>
                    密码：
                    <code>{account.password}</code>
                  </span>
                ) : null}
              </span>
              <span className="grid min-w-0 gap-[0.18rem] text-slate-500 dark:text-slate-400 text-[0.74rem] leading-[1.4] [overflow-wrap:anywhere]">{account.caption}</span>
            </Button>
          ))}
        </div>
      </div>
    </section>
  )
}
