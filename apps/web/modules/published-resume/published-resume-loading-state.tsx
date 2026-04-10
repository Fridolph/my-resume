import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@heroui/react/card'

import { resumeLabels } from './published-resume-utils'

export function PublishedResumeLoadingState() {
  const labels = resumeLabels.zh

  return (
    <main className="web-page-shell">
      <section className="mx-auto grid w-full max-w-5xl gap-6 px-4 py-6 sm:px-6">
        <Card className="border-white/70 bg-white/84 shadow-[0_24px_70px_rgba(15,23,42,0.08)] dark:border-white/10 dark:bg-slate-950/84">
          <CardHeader className="gap-3">
            <p className="web-eyebrow">{labels.pageEyebrow}</p>
            <CardTitle className="text-3xl text-slate-950 dark:text-white">
              正在同步公开简历
            </CardTitle>
            <CardDescription className="text-base leading-7 text-slate-500 dark:text-slate-400">
              正在从服务端读取最新发布快照，请稍候。
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-3">
            <div className="h-5 w-2/3 animate-pulse rounded-md bg-slate-200/80 dark:bg-slate-700/70" />
            <div className="h-5 animate-pulse rounded-md bg-slate-200/80 dark:bg-slate-700/70" />
            <div className="h-5 w-4/5 animate-pulse rounded-md bg-slate-200/80 dark:bg-slate-700/70" />
          </CardContent>
        </Card>
      </section>
    </main>
  )
}
