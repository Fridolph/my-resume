import type { ReactNode } from 'react'

/**
 * A4 简历 section 容器。
 *
 * 每个 section 包裹在 article 中，支持 page-break 控制。
 */
export function ResumeSection({
  children,
  title,
}: {
  children: ReactNode
  title: string
}) {
  return (
    <article className="mb-5" data-section>
      <h2 className="border-b border-zinc-200 pb-1 text-base font-bold tracking-wide text-zinc-900">
        {title}
      </h2>
      <div className="mt-2 grid gap-2">{children}</div>
    </article>
  )
}
