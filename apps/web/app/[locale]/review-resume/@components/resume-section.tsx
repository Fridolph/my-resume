import type { ReactNode } from 'react'

/**
 * A4 简历 section 容器。
 * 每个 section 包裹在 article 中，打印时避免页内断开。
 */
export function ResumeSection({
  children,
  title,
}: {
  children: ReactNode
  title: string
}) {
  return (
    <article className="mb-6" data-section>
      <h2 className="mb-3 border-b border-zinc-200 pb-1.5 text-sm font-bold uppercase tracking-wider text-zinc-400">
        {title}
      </h2>
      <div>{children}</div>
    </article>
  )
}
