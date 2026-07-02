'use client'

import { Tooltip } from '@heroui/react/tooltip'
import { useEffect } from 'react'

import { PublishedResumeProfileIcon } from './published-resume-profile-icon'
import './hero.css'

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
      <Tooltip.Trigger className={'r-tooltip-trigger-inline'}>
        <a
          aria-label={label}
          className={'r-icon-link-chip'}
          href={href}
          rel="noreferrer"
          target="_blank">
          <span className={'r-icon-link-inner'}>
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
