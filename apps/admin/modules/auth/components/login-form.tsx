'use client'

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@heroui/react/card'
import { Chip } from '@heroui/react/chip'
import { Input } from '@heroui/react/input'
import { Button } from '@heroui/react/button'

import { adminPrimaryButtonClass } from '../../../core/button-styles'
import { FormEvent, useState } from 'react'

interface LoginFormProps {
  pending: boolean
  errorMessage: string | null
  onSubmit: (values: { username: string; password: string }) => Promise<void>
}

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
    <Card className="border border-zinc-200/70 bg-white/90 shadow-2xl dark:border-zinc-800 dark:bg-zinc-950/85">
      <CardHeader className="flex flex-col items-start gap-4">
        <div className="flex items-center gap-2">
          <Chip size="sm">my-resume admin</Chip>
          <Chip size="sm">登录页</Chip>
        </div>
        <div className="space-y-2">
          <CardTitle className="text-3xl font-semibold tracking-tight">
            标准后台登录
          </CardTitle>
          <CardDescription className="max-w-md text-sm leading-6">
            {
              '当前只保留用户名与密码登录，继续通过 localStorage token -> /auth/me 校验进入后台，不引入注册与多余入口。'
            }
          </CardDescription>
        </div>
      </CardHeader>
      <CardContent>
        <form className="stack" onSubmit={handleSubmit}>
          <label className="field">
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

          <label className="field">
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
            className={adminPrimaryButtonClass}
            fullWidth
            isDisabled={pending}
            size="md"
            type="submit"
            variant="primary">
            {pending ? '登录中...' : '登录后台'}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}
