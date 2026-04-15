'use client'

import { Tooltip } from '@heroui/react/tooltip'
import { useEffect } from 'react'

import { PublishedResumeProfileIcon } from './published-resume-profile-icon'
import styles from './hero.module.css'

interface PublishedResumeHeroTooltipLinkProps {
  href: string
  iconName: string
  label: string
  onReady?: () => void
  render?: boolean
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
      <Tooltip.Trigger className={styles.tooltipTriggerInline}>
        <a
          aria-label={label}
          className={styles.iconLinkChip}
          href={href}
          rel="noreferrer"
          target="_blank">
          <span className={styles.iconLinkInner}>
            <PublishedResumeProfileIcon name={iconName} />
          </span>
        </a>
      </Tooltip.Trigger>
      <Tooltip.Content offset={10} placement="top">
        {label}
      </Tooltip.Content>
    </Tooltip>
  )
}
