'use client'

import { Icon } from '@iconify/react'

interface PublishedResumeProfileIconProps {
  name?: string | null
  className?: string
}

export function PublishedResumeProfileIcon({
  name,
  className,
}: PublishedResumeProfileIconProps) {
  const normalizedName = name?.trim()

  if (!normalizedName) {
    return <ExternalLinkIcon className={className} />
  }

  return (
    <Icon
      aria-hidden="true"
      className={className}
      height="18"
      icon={normalizedName}
      width="18"
    />
  )
}

function ExternalLinkIcon({ className }: { className?: string }) {
  return (
    <svg
      aria-hidden="true"
      className={className}
      fill="none"
      height="18"
      viewBox="0 0 24 24"
      width="18">
      <path
        d="M10 6.5H7.5A1.5 1.5 0 0 0 6 8v8.5A1.5 1.5 0 0 0 7.5 18h8.5a1.5 1.5 0 0 0 1.5-1.5V14M13 6h5v5M11.5 12.5 18 6"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.7"
      />
    </svg>
  )
}
