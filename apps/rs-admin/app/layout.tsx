import type { Metadata } from 'next'
import type { ReactNode } from 'react'

import { Providers } from './providers'
import './globals.css'

export const metadata: Metadata = {
  title: 'RS Admin',
  description: 'my-resume 后台管理（rst-admin）',
}

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="zh-CN">
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  )
}
