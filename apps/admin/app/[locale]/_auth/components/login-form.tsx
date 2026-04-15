'use client'

import { Input } from '@heroui/react/input'
import { Button } from '@heroui/react/button'

import type { FormEvent } from 'react'
import { useState } from 'react'

import styles from '../login-shell.module.css'

interface LoginFormProps {
  pending: boolean
  errorMessage: string | null
  onSubmit: (values: { username: string; password: string }) => Promise<void>
}

const demoAccounts = [
  {
    username: 'admin',
    password: 'admin123456',
    role: '管理员',
    caption: '可编辑简历、触发 AI 分析并发布公开版本。',
  },
  {
    username: 'viewer',
    password: 'viewer123456',
    role: '观察者',
    caption: '只读查看缓存与导出结果，适合演示边界。',
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
    <section aria-labelledby="admin-login-form-title" className={styles.formPanel}>
      <div className={styles.formHeader}>
        <p className={styles.kicker}>Private Entrance</p>
        <h2 className={styles.formTitle} id="admin-login-form-title">
          进入后台工作台
        </h2>
        <p className={styles.formDescription}>
          只保留必要的用户名与密码登录；会话仍通过本地 token 与 /api/auth/me
          校验，避免额外入口打扰。
        </p>
      </div>

      <form className={styles.formStack} onSubmit={handleSubmit}>
        <label className={styles.fieldLabel}>
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

        <label className={styles.fieldLabel}>
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
          className={styles.submitButton}
          fullWidth
          isDisabled={pending}
          size="md"
          type="submit"
          variant="primary">
          {pending ? '登录中...' : '登录后台'}
        </Button>
      </form>

      <div className={styles.accountArea}>
        <div className={styles.accountHeader}>
          <div>
            <p className={styles.accountTitle}>演示账号</p>
            <p className={styles.accountHint}>点击卡片填入账号，不会自动登录。</p>
          </div>
        </div>

        <div className={styles.accountGrid}>
          {demoAccounts.map((account) => (
            <button
              aria-label={`填入${account.role}演示账号`}
              className={styles.accountCard}
              key={account.username}
              onClick={() => {
                setUsername(account.username)
                setPassword(account.password)
              }}
              type="button">
              <span className={styles.accountRole}>
                {account.role}
                <span className={styles.accountPill}>{account.username}</span>
              </span>
              <span className={styles.accountSecret}>
                <span>
                  账号：
                  <code>{account.username}</code>
                </span>
                <span>
                  密码：
                  <code>{account.password}</code>
                </span>
              </span>
              <span className={styles.accountSecret}>{account.caption}</span>
            </button>
          ))}
        </div>
      </div>
    </section>
  )
}
