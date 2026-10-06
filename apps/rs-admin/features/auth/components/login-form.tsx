'use client'

import { LockOutlined, UserOutlined } from '@ant-design/icons'
import { App, Button, Form, Input } from 'antd'
import { useRouter } from 'next/navigation'
import { useState } from 'react'

import { useAuth } from '@shared/lib/auth/auth-context'

interface LoginFormValues {
  username: string
  password: string
}

export function LoginForm() {
  const { login } = useAuth()
  const router = useRouter()
  const { message } = App.useApp()
  const [loading, setLoading] = useState(false)

  const onFinish = async (values: LoginFormValues) => {
    setLoading(true)
    try {
      await login(values.username, values.password)
      router.replace('/dashboard')
    } catch {
      void message.error('登录失败，请检查账号或密码')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="w-full">
      <h1 className="mb-1 text-3xl font-semibold tracking-tight text-[var(--ant-color-text)]">
        欢迎回来
      </h1>
      <p className="mb-8 text-sm text-[var(--ant-color-text-secondary)]">
        登录以进入 RS Admin 后台管理
      </p>
      <Form layout="vertical" onFinish={onFinish} requiredMark={false} size="large">
        <Form.Item
          name="username"
          label="账号"
          rules={[{ required: true, message: '请输入账号' }]}
        >
          <Input prefix={<UserOutlined />} autoComplete="username" />
        </Form.Item>
        <Form.Item
          name="password"
          label="密码"
          rules={[{ required: true, message: '请输入密码' }]}
        >
          <Input.Password prefix={<LockOutlined />} autoComplete="current-password" />
        </Form.Item>
        <Button type="primary" htmlType="submit" block loading={loading}>
          登录
        </Button>
      </Form>
    </div>
  )
}
