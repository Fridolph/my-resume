import type { ReactNode } from 'react'

interface AuthSplitLayoutProps {
  children: ReactNode
  /** 图片地址；留空则用渐变占位 */
  imageSrc?: string
  imageAlt?: string
  /** 图片在左还是右，默认右 */
  imageSide?: 'left' | 'right'
  brand?: ReactNode
  caption?: ReactNode
}

/**
 * 登录页左右分割布局（参考 dao-monorepo-temp 的 AuthSplitLayout）。
 * 左侧表单区 + 右侧可配置图片区，图片位置可左右切换。
 */
export function AuthSplitLayout({
  children,
  imageSrc,
  imageAlt = '登录背景',
  imageSide = 'right',
  brand,
  caption,
}: AuthSplitLayoutProps) {
  const imageFirst = imageSide === 'left'

  return (
    <div
      className={`grid min-h-screen bg-[var(--ant-color-bg-layout)] ${
        imageFirst ? 'lg:grid-cols-[38.2%_minmax(0,1fr)]' : 'lg:grid-cols-[minmax(0,1fr)_38.2%]'
      }`}
    >
      {/* 表单区 */}
      <section
        className={`flex min-h-screen flex-col px-6 py-8 sm:px-10 lg:px-16 ${
          imageFirst ? 'lg:order-last' : ''
        }`}
      >
        <header className="flex items-center justify-between gap-4">{brand}</header>
        <div className="flex flex-1 items-center justify-center py-14 lg:py-20">
          <div className="w-full max-w-md">{children}</div>
        </div>
      </section>

      {/* 图片区 */}
      <aside
        className={`relative min-h-56 overflow-hidden bg-gradient-to-br from-violet-500 via-indigo-500 to-blue-600 lg:min-h-screen ${
          imageFirst ? 'lg:order-first' : ''
        }`}
        role="img"
        aria-label={imageAlt}
        style={
          imageSrc
            ? { backgroundImage: `url(${imageSrc})`, backgroundSize: 'cover', backgroundPosition: 'center' }
            : undefined
        }
      >
        <div className="absolute inset-0 bg-gradient-to-br from-violet-500/70 via-indigo-500/35 to-blue-600/80" />
        {caption ? (
          <div className="relative mt-auto p-8 text-white sm:p-12">{caption}</div>
        ) : null}
      </aside>
    </div>
  )
}
