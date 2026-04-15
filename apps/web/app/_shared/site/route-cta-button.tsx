'use client'

import { Button } from '@heroui/react/button'
import type { ReactNode, ComponentProps } from 'react'
import { useEffect } from 'react'

import { useRouter } from '@i18n/navigation'

type HeroButtonProps = ComponentProps<typeof Button>

interface RouteCtaButtonProps
  extends Omit<HeroButtonProps, 'children' | 'className' | 'onPress'> {
  children: ReactNode
  className?: string
  href: string
  tone?: 'ghost' | 'primary'
}

/**
 * 统一承载公开站 CTA 路由跳转，并在挂载后预取目标页面
 *
 * @param children 按钮内容
 * @param className 额外样式类名
 * @param href 当前 CTA 对应的目标路由
 * @param tone CTA 视觉语义
 * @returns 公开站 HeroUI CTA 路由按钮
 */
export function RouteCtaButton({
  children,
  className,
  href,
  tone = 'ghost',
  ...props
}: RouteCtaButtonProps) {
  const router = useRouter()

  useEffect(() => {
    void router.prefetch?.(href)
  }, [href, router])

  return (
    <Button
      {...props}
      className={className}
      onPress={() => router.push(href)}
      size={props.size ?? 'md'}
      type="button"
      variant={tone === 'primary' ? 'primary' : 'ghost'}>
      {children}
    </Button>
  )
}
