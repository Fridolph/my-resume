'use client'

export function AdminRouteLoadingCard({ message }: { message: string }) {
  return (
    <div className="stack">
      <section className="rounded-[28px] border border-[color:var(--admin-border)] bg-[var(--admin-surface)] p-6 text-sm text-[var(--admin-text-muted)]">
        {message}
      </section>
    </div>
  )
}
