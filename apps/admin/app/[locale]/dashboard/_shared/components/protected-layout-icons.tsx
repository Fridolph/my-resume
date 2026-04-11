import type { AdminNavigationItem } from '../types/admin-navigation.types'

export function AdminNavIcon({
  itemKey,
  size = 18,
}: {
  itemKey: AdminNavigationItem['key']
  size?: number
}) {
  if (itemKey === 'overview') {
    return (
      <svg aria-hidden="true" fill="none" height={size} viewBox="0 0 24 24" width={size}>
        <rect
          height="7"
          rx="2"
          stroke="currentColor"
          strokeWidth="1.8"
          width="7"
          x="3.5"
          y="3.5"
        />
        <rect
          height="7"
          rx="2"
          stroke="currentColor"
          strokeWidth="1.8"
          width="9"
          x="11.5"
          y="3.5"
        />
        <rect
          height="9"
          rx="2"
          stroke="currentColor"
          strokeWidth="1.8"
          width="7"
          x="3.5"
          y="11.5"
        />
        <rect
          height="9"
          rx="2"
          stroke="currentColor"
          strokeWidth="1.8"
          width="9"
          x="11.5"
          y="11.5"
        />
      </svg>
    )
  }

  if (itemKey === 'resume') {
    return (
      <svg aria-hidden="true" fill="none" height={size} viewBox="0 0 24 24" width={size}>
        <path
          d="M7 4.5h7l4 4v10A1.5 1.5 0 0 1 16.5 20h-9A1.5 1.5 0 0 1 6 18.5v-12A2 2 0 0 1 8 4.5Z"
          stroke="currentColor"
          strokeWidth="1.8"
        />
        <path d="M13.5 4.5v4h4" stroke="currentColor" strokeWidth="1.8" />
        <path
          d="M9 12h6M9 15.5h6"
          stroke="currentColor"
          strokeLinecap="round"
          strokeWidth="1.8"
        />
      </svg>
    )
  }

  if (itemKey === 'ai') {
    return (
      <svg aria-hidden="true" fill="none" height={size} viewBox="0 0 24 24" width={size}>
        <rect
          height="11"
          rx="3"
          stroke="currentColor"
          strokeWidth="1.8"
          width="14"
          x="5"
          y="7"
        />
        <path
          d="M9 3.5v3M15 3.5v3M9 18v2.5M15 18v2.5M3.5 10H5M19 10h1.5M3.5 15H5M19 15h1.5"
          stroke="currentColor"
          strokeLinecap="round"
          strokeWidth="1.8"
        />
        <path
          d="M9.5 12h5M12 9.5v5"
          stroke="currentColor"
          strokeLinecap="round"
          strokeWidth="1.8"
        />
      </svg>
    )
  }

  return (
    <svg aria-hidden="true" fill="none" height={size} viewBox="0 0 24 24" width={size}>
      <path
        d="M6 7.5h12M6 12h12M6 16.5h7"
        stroke="currentColor"
        strokeLinecap="round"
        strokeWidth="1.8"
      />
      <path
        d="M17 14.5 20.5 18 17 21.5"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.8"
      />
      <path
        d="M20.5 18H12"
        stroke="currentColor"
        strokeLinecap="round"
        strokeWidth="1.8"
      />
    </svg>
  )
}

export function GithubIcon() {
  return (
    <svg
      aria-hidden="true"
      fill="currentColor"
      height="18"
      viewBox="0 0 24 24"
      width="18">
      <path d="M12 .75a11.25 11.25 0 0 0-3.56 21.92c.56.1.77-.24.77-.54V20.1c-3.12.68-3.78-1.32-3.78-1.32-.5-1.3-1.25-1.63-1.25-1.63-1.02-.7.08-.68.08-.68 1.12.08 1.7 1.14 1.7 1.14 1 1.72 2.6 1.22 3.24.94.1-.72.38-1.22.68-1.5-2.5-.28-5.12-1.24-5.12-5.54 0-1.22.44-2.22 1.16-3-.12-.28-.5-1.44.12-3 0 0 .96-.3 3.14 1.16a10.82 10.82 0 0 1 5.72 0c2.18-1.46 3.14-1.16 3.14-1.16.62 1.56.24 2.72.12 3 .72.78 1.16 1.78 1.16 3 0 4.3-2.62 5.26-5.12 5.54.4.36.76 1.06.76 2.14v3.17c0 .3.2.66.78.54A11.25 11.25 0 0 0 12 .75Z" />
    </svg>
  )
}
