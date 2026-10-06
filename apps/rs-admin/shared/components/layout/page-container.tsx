import type { ReactNode } from 'react'

/**
 * 页面内容容器：统一最大宽度（>1920px 归一到 1920px）与内边距。
 */
export function PageContainer({ children }: { children: ReactNode }) {
  return <main className="mx-auto w-full max-w-[1920px]">{children}</main>
}
