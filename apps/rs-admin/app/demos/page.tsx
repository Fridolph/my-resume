import { Card } from 'antd'
import type { Metadata } from 'next'

import { ResumeTitleEditor } from '@features/demos/components/resume-title-editor'

export const metadata: Metadata = {
  title: '练习 · RS Admin',
}

/**
 * 练习页：/demos
 *
 * 用于验证 U2 的受控组件练习（ResumeTitleEditor）。
 * 该路由不在后台壳内（未放在 (dashboard) 路由组），保持轻量。
 */
export default function DemosPage() {
  return (
    <div className="mx-auto max-w-xl p-6">
      <h1 className="mb-2 text-xl font-semibold tracking-tight text-[var(--ant-color-text)]">
        练习页 · 受控组件
      </h1>
      <p className="mb-4 text-sm text-[var(--ant-color-text-secondary)]">
        U2 练习的修正版：受控输入 + 实时预览。
      </p>
      <Card>
        <ResumeTitleEditor />
      </Card>
    </div>
  )
}
