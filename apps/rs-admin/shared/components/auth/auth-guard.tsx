'use client'

import { Spin } from 'antd'
import { useRouter } from 'next/navigation'
import { useEffect, type ReactNode } from 'react'

import { useAuth } from '@shared/lib/auth/auth-context'

/**
 * 路由守卫：未登录跳转 /login；校验中显示 loading。
 */
export function AuthGuard({ children }: { children: ReactNode }) {
  const { status } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (status === 'unauthorized') {
      router.replace('/login')
    }
  }, [status, router])

  if (status !== 'ready') {
    return (
      <div className="grid min-h-screen place-items-center">
        <Spin />
      </div>
    )
  }

  return <>{children}</>
}
