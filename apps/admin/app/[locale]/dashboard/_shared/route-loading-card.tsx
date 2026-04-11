'use client'

import { Skeleton } from '@heroui/react/skeleton'

export function AdminRouteLoadingCard({ message }: { message: string }) {
  return (
    <div className="stack">
      <section className="rounded-[28px] border border-[color:var(--admin-border)] bg-[var(--admin-surface)] p-6 text-sm text-[var(--admin-text-muted)]">
        <p>{message}</p>
        <div className="mt-3 grid gap-2" data-testid="admin-route-loading-skeleton">
          <Skeleton className="h-4 rounded-md bg-zinc-200/80 dark:bg-zinc-800/80" />
          <Skeleton className="h-4 w-3/4 rounded-md bg-zinc-200/80 dark:bg-zinc-800/80" />
        </div>
      </section>
    </div>
  )
}
