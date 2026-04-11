'use client'

import { Tooltip } from '@heroui/react/tooltip'
import { useEffect } from 'react'

import styles from './hero.module.css'

interface PublishedResumeHeroTooltipLinkProps {
  href: string
  iconName: string
  label: string
  onReady?: () => void
  render?: boolean
}

function ResumeProfileIcon({ name }: { name: string }) {
  switch (name) {
    case 'ri:github-fill':
      return <GitHubMarkIcon />
    case 'ri:article-line':
      return <ArticleIcon />
    case 'ri:code-s-slash-line':
      return <CodeIcon />
    case 'ri:dribbble-line':
      return <DribbbleIcon />
    case 'ri:sparkling-line':
      return <SparklesIcon />
    case 'ri:music-2-line':
      return <MusicIcon />
    case 'ri:robot-2-line':
      return <RobotIcon />
    case 'ri:link-m':
    case 'ri:links-line':
    case 'ri:external-link-line':
      return <ExternalLinkIcon />
    default:
      return <ExternalLinkIcon />
  }
}

export function PublishedResumeHeroTooltipLink({
  href,
  iconName,
  label,
  onReady,
  render = true,
}: PublishedResumeHeroTooltipLinkProps) {
  useEffect(() => {
    onReady?.()
  }, [onReady])

  if (!render) {
    return null
  }

  return (
    <Tooltip delay={220}>
      <Tooltip.Trigger>
        <a
          aria-label={label}
          className={styles.iconLinkChip}
          href={href}
          rel="noreferrer"
          target="_blank">
          <span className={styles.iconLinkInner}>
            <ResumeProfileIcon name={iconName} />
          </span>
        </a>
      </Tooltip.Trigger>
      <Tooltip.Content offset={10} placement="top">
        {label}
      </Tooltip.Content>
    </Tooltip>
  )
}

function ArticleIcon() {
  return (
    <svg aria-hidden="true" fill="none" height="18" viewBox="0 0 24 24" width="18">
      <path
        d="M7 6.75h10M7 11.75h10M7 16.75h6.5M6.25 3.75h11.5a2 2 0 0 1 2 2v12.5a2 2 0 0 1-2 2H6.25a2 2 0 0 1-2-2V5.75a2 2 0 0 1 2-2Z"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.7"
      />
    </svg>
  )
}

function CodeIcon() {
  return (
    <svg aria-hidden="true" fill="none" height="18" viewBox="0 0 24 24" width="18">
      <path
        d="m9 8-4 4 4 4M15 8l4 4-4 4M13.5 5 10.5 19"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.7"
      />
    </svg>
  )
}

function DribbbleIcon() {
  return (
    <svg aria-hidden="true" fill="none" height="18" viewBox="0 0 24 24" width="18">
      <path
        d="M12 20.25a8.25 8.25 0 1 0 0-16.5 8.25 8.25 0 0 0 0 16.5ZM6.66 7.11c3.56 1.25 6.39 3.63 8.08 6.86M10.03 4.08c1.77 2.3 3.08 4.9 3.8 7.7M4.2 12.6c3.62-.04 7.07-.97 10.12-2.67M12.36 12.39c2.14-1.22 4.56-1.85 7.02-1.8"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.7"
      />
    </svg>
  )
}

function ExternalLinkIcon() {
  return (
    <svg aria-hidden="true" fill="none" height="18" viewBox="0 0 24 24" width="18">
      <path
        d="M14 5h5v5M10 14 19 5M19 13v5a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1V6a1 1 0 0 1 1-1h5"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.7"
      />
    </svg>
  )
}

function GitHubMarkIcon() {
  return (
    <svg aria-hidden="true" fill="currentColor" height="18" viewBox="0 0 24 24" width="18">
      <path d="M12 .5C5.65.5.5 5.65.5 12.15c0 5.2 3.37 9.6 8.05 11.16.59.11.8-.26.8-.57 0-.28-.01-1.03-.02-2.03-3.27.73-3.96-1.61-3.96-1.61-.54-1.4-1.32-1.78-1.32-1.78-1.08-.76.08-.74.08-.74 1.19.09 1.82 1.25 1.82 1.25 1.06 1.85 2.77 1.31 3.45 1 .11-.79.41-1.31.74-1.61-2.61-.31-5.35-1.34-5.35-5.95 0-1.31.46-2.38 1.22-3.22-.12-.31-.53-1.58.12-3.3 0 0 .99-.33 3.25 1.23a11.03 11.03 0 0 1 5.92 0c2.26-1.56 3.24-1.23 3.24-1.23.66 1.72.25 2.99.13 3.3.76.84 1.22 1.91 1.22 3.22 0 4.62-2.75 5.63-5.37 5.94.43.38.81 1.11.81 2.23 0 1.61-.01 2.91-.01 3.31 0 .31.21.69.81.57 4.67-1.57 8.03-5.97 8.03-11.16C23.5 5.65 18.35.5 12 .5Z" />
    </svg>
  )
}

function MusicIcon() {
  return (
    <svg aria-hidden="true" fill="none" height="18" viewBox="0 0 24 24" width="18">
      <path
        d="M15.5 5.75v8.75M15.5 5.75 8.5 7.5v9.25M15.5 5.75l3.25 1.5M8.5 16.75a2 2 0 1 1-4 0 2 2 0 0 1 4 0Zm7 0a2 2 0 1 1-4 0 2 2 0 0 1 4 0Z"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.7"
      />
    </svg>
  )
}

function RobotIcon() {
  return (
    <svg aria-hidden="true" fill="none" height="18" viewBox="0 0 24 24" width="18">
      <path
        d="M8 9.75h8a2.75 2.75 0 0 1 2.75 2.75v3A2.75 2.75 0 0 1 16 18.25H8A2.75 2.75 0 0 1 5.25 15.5v-3A2.75 2.75 0 0 1 8 9.75ZM12 4.75v2.5M9 14h.01M15 14h.01M9 7.75h6"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.7"
      />
    </svg>
  )
}

function SparklesIcon() {
  return (
    <svg aria-hidden="true" fill="none" height="18" viewBox="0 0 24 24" width="18">
      <path
        d="m12 3 1.8 4.2L18 9l-4.2 1.8L12 15l-1.8-4.2L6 9l4.2-1.8L12 3ZM18.5 14.5l.9 2.1 2.1.9-2.1.9-.9 2.1-.9-2.1-2.1-.9 2.1-.9.9-2.1ZM5.5 14.5l1.1 2.4 2.4 1.1-2.4 1.1-1.1 2.4-1.1-2.4L1 18l2.4-1.1 1.1-2.4Z"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.7"
      />
    </svg>
  )
}
