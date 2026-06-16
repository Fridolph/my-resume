'use client'

/**
 * 简历完整性助手 — 双栏布局壳。
 *
 * 左侧：AI 对话面板（待接入 I3）。
 * 右侧：拼图可视化面板（待接入 I4）。
 */

import { Card, CardContent } from '@heroui/react'

export function ResumeAssistantShell() {
  return (
    <div className="flex h-[calc(100vh-4rem)] flex-col overflow-hidden p-4">
      <div className="mb-4">
        <h1 className="text-xl font-semibold text-zinc-900 dark:text-zinc-100">
          简历完整性助手
        </h1>
        <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
          通过和 AI 对话，逐步完善简历的各个版块。右边的拼图会随着完整度逐渐点亮。
        </p>
      </div>

      <div className="flex flex-1 flex-col gap-4 overflow-hidden md:grid md:grid-cols-[1fr_22rem]">
        {/* 左侧：对话面板 */}
        <Card className="flex min-h-0 flex-col overflow-hidden rounded-2xl border border-zinc-200/70 bg-white/80 shadow-sm dark:border-white/10 dark:bg-white/5">
          <CardContent className="flex flex-1 flex-col overflow-hidden p-0">
            <div className="flex flex-1 items-center justify-center text-sm text-zinc-400">
              💬 对话面板（待接入）
            </div>
          </CardContent>
        </Card>

        {/* 右侧：拼图面板 */}
        <Card className="flex min-h-0 flex-col overflow-hidden rounded-2xl border border-zinc-200/70 bg-white/80 shadow-sm dark:border-white/10 dark:bg-white/5">
          <CardContent className="flex flex-1 flex-col overflow-auto p-4">
            <div className="flex flex-1 items-center justify-center text-sm text-zinc-400">
              🧩 拼图面板（待接入）
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
