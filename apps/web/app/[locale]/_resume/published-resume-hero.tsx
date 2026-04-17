'use client'

import { Card, CardContent, CardHeader } from '@heroui/react/card'
import { Chip } from '@heroui/react/chip'
import dynamic from 'next/dynamic'
import { useTranslations } from 'next-intl'
import { memo, useEffect, useState } from 'react'

import type {
  ResumeLocale,
  ResumePublishedSnapshot,
} from '@shared/published-resume/types/published-resume.types'
import {
  formatPublishedAt,
  readLocalizedText,
} from '@shared/published-resume/published-resume-utils'
import { PublishedResumeProfileIcon } from './published-resume-profile-icon'
import styles from './hero.module.css'

const contactItemClass =
  'group grid grid-cols-[1.25rem_minmax(0,1fr)] items-start gap-3 rounded-2xl px-3 py-2.5 text-sm font-medium text-slate-600 dark:text-slate-300'
const interestCardClass =
  'group inline-flex min-h-11 max-w-full w-fit items-center gap-2.5 px-3 py-2'
const interestCardPlainClass = 'justify-center px-3.5'
const interestCardLabelPlainClass = 'text-[0.78rem] leading-[1.35]'
const linkFallbackClass =
  'inline-flex min-h-11 items-center justify-center rounded-2xl px-3 text-center text-sm font-semibold'

interface PublishedResumeHeroProps {
  locale: ResumeLocale
  publishedResume: ResumePublishedSnapshot
}

const DeferredPublishedResumeHeroTooltipLink = dynamic(
  () =>
    import('./published-resume-hero-tooltip-link').then(
      (module) => module.PublishedResumeHeroTooltipLink,
    ),
  {
    ssr: false,
    loading: () => null,
  },
)

const highlightAccentClasses = [
  'from-sky-500/20 via-cyan-400/16 to-transparent dark:from-sky-400/22 dark:via-cyan-300/12',
  'from-emerald-500/20 via-teal-400/12 to-transparent dark:from-emerald-400/22 dark:via-teal-300/12',
  'from-fuchsia-500/20 via-violet-400/12 to-transparent dark:from-fuchsia-400/22 dark:via-violet-300/12',
  'from-amber-500/20 via-orange-400/12 to-transparent dark:from-amber-400/22 dark:via-orange-300/12',
  'from-rose-500/20 via-pink-400/12 to-transparent dark:from-rose-400/22 dark:via-pink-300/12',
] as const

function LocationIcon() {
  return (
    <svg aria-hidden="true" fill="none" height="16" viewBox="0 0 20 20" width="16">
      <path
        d="M10 17s5-4.35 5-9a5 5 0 1 0-10 0c0 4.65 5 9 5 9Z"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.7"
      />
      <circle cx="10" cy="8" fill="currentColor" r="1.35" />
    </svg>
  )
}

function MailIcon() {
  return (
    <svg aria-hidden="true" fill="none" height="16" viewBox="0 0 20 20" width="16">
      <path
        d="M3.75 5.75h12.5a1 1 0 0 1 1 1v6.5a1 1 0 0 1-1 1H3.75a1 1 0 0 1-1-1v-6.5a1 1 0 0 1 1-1Z"
        stroke="currentColor"
        strokeWidth="1.7"
      />
      <path
        d="m3.5 6 6.02 4.52a.8.8 0 0 0 .96 0L16.5 6"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.7"
      />
    </svg>
  )
}

function PhoneIcon() {
  return (
    <svg aria-hidden="true" fill="none" height="16" viewBox="0 0 20 20" width="16">
      <path
        d="M6.74 3.5h2.12a.75.75 0 0 1 .72.54l.6 2.12a.75.75 0 0 1-.22.76l-1.08 1.02a10.9 10.9 0 0 0 4.18 4.18l1.02-1.08a.75.75 0 0 1 .76-.22l2.12.6a.75.75 0 0 1 .54.72v2.12a1 1 0 0 1-1 1A13.75 13.75 0 0 1 3.5 6.5a1 1 0 0 1 1-1Z"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.7"
      />
    </svg>
  )
}

function PublishedResumeHeroComponent({
  locale,
  publishedResume,
}: PublishedResumeHeroProps) {
  const t = useTranslations('publishedResume')
  const isJsdom = typeof navigator !== 'undefined' && /jsdom/i.test(navigator.userAgent)
  const [shouldLoadTooltip, setShouldLoadTooltip] = useState(() => isJsdom)
  const [tooltipReady, setTooltipReady] = useState(() => isJsdom)
  const profile = publishedResume.resume.profile
  const hero = profile.hero
  const highlights = publishedResume.resume.highlights
  const localizedInterests = profile.interests.map((item) => ({
    ...item,
    localizedLabel: readLocalizedText(item.label, locale),
  }))
  const localizedHeroSlogans = hero.slogans
    .map((item) => readLocalizedText(item, locale))
    .filter(Boolean)
    .slice(0, 2)
  const contactItems = [
    {
      key: 'location',
      icon: <LocationIcon />,
      value: readLocalizedText(profile.location, locale),
    },
    {
      key: 'email',
      icon: <MailIcon />,
      value: profile.email,
    },
    {
      key: 'phone',
      icon: <PhoneIcon />,
      value: profile.phone,
    },
  ].filter((item) => Boolean(item.value))

  const name = readLocalizedText(profile.fullName, locale)

  useEffect(() => {
    if (tooltipReady) {
      return
    }

    if (isJsdom || typeof window === 'undefined') {
      setShouldLoadTooltip(true)
      return
    }

    const idleWindow = window as Window & {
      cancelIdleCallback?: (handle: number) => void
      requestIdleCallback?: (callback: () => void) => number
    }
    let timeoutId: number | null = null
    let idleId: number | null = null

    if (typeof idleWindow.requestIdleCallback === 'function') {
      idleId = idleWindow.requestIdleCallback(() => {
        setShouldLoadTooltip(true)
      })
    } else {
      timeoutId = window.setTimeout(() => {
        setShouldLoadTooltip(true)
      }, 0)
    }

    return () => {
      if (idleId !== null && typeof idleWindow.cancelIdleCallback === 'function') {
        idleWindow.cancelIdleCallback(idleId)
      }

      if (timeoutId !== null) {
        window.clearTimeout(timeoutId)
      }
    }
  }, [isJsdom, tooltipReady])

  return (
    <Card className={styles.heroCard}>
      <CardHeader className="grid gap-5 border-b border-slate-200/80 pb-5 dark:border-white/10">
        <div className="grid gap-4">
          <div className="mx-auto flex w-full max-w-[17rem] flex-col items-center gap-4 text-center">
            <a
              className={`${styles.avatarFlip} w-full max-w-[13.5rem]`}
              href={hero.linkUrl}
              rel="noreferrer"
              target="_blank">
              <div className={styles.avatarFlipInner}>
                <div className={styles.avatarFace}>
                  <img
                    alt={t('hero.avatarFrontAlt', { name })}
                    className="h-full w-full object-cover"
                    decoding="async"
                    fetchPriority="high"
                    loading="eager"
                    src={hero.frontImageUrl}
                  />
                </div>
                <div className={[styles.avatarFace, styles.avatarFaceBack].join(' ')}>
                  <img
                    alt={t('hero.avatarBackAlt', { name })}
                    className="h-full w-full object-cover"
                    decoding="async"
                    fetchPriority="low"
                    loading="lazy"
                    src={hero.backImageUrl}
                  />
                </div>
              </div>
            </a>

            <div className="grid gap-2">
              {localizedHeroSlogans.map((line) => (
                <p
                  className={`${styles.gradientCopy} text-sm font-semibold leading-6 text-slate-600 dark:text-slate-200`}
                  key={line}>
                  {line}
                </p>
              ))}
            </div>
          </div>

          <div className="grid gap-2 text-center">
            <h2 className="text-[clamp(2rem,4.2vw,2.7rem)] leading-none tracking-[-0.06em] text-slate-950 dark:text-white">
              {name}
            </h2>
            <p className="text-base font-semibold tracking-[-0.03em] text-slate-500 dark:text-slate-300">
              {readLocalizedText(profile.headline, locale)}
            </p>
          </div>

          <p className="text-sm leading-7 text-slate-500 dark:text-slate-400">
            {readLocalizedText(profile.summary, locale)}
          </p>
        </div>
      </CardHeader>

      <CardContent className="grid gap-4 pt-5">
        <div className="grid gap-3 rounded-[1.35rem] border border-slate-200/80 bg-slate-50/80 p-4 dark:border-white/10 dark:bg-white/5">
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-400">
            {t('contactTitle')}
          </p>
          <div className="grid gap-2">
            {contactItems.map((item) => (
              <div className={`${styles.contactItem} ${contactItemClass}`} key={item.key}>
                <span className="contact-item-icon mt-1 text-slate-400 dark:text-slate-500">
                  {item.icon}
                </span>
                <span className="min-w-0 break-all leading-6">{item.value}</span>
              </div>
            ))}
          </div>
        </div>

        {profile.links.length > 0 ? (
          <div className="grid gap-3">
            <div className="flex items-center justify-between gap-3">
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-400">
                {t('profileLinksTitle')}
              </p>
              <Chip size="sm" variant="soft">
                {profile.links.length}
              </Chip>
            </div>
            <div className="flex flex-wrap gap-2.5">
              {profile.links.map((link) => {
                const localizedLabel = readLocalizedText(link.label, locale)

                if (!link.icon) {
                  return (
                    <a
                      className={`${styles.linkFallbackChip} ${linkFallbackClass}`}
                      href={link.url}
                      key={link.url}
                      rel="noreferrer"
                      target="_blank">
                      <span className="truncate">{localizedLabel}</span>
                    </a>
                  )
                }

                if (!tooltipReady) {
                  return (
                    <a
                      aria-label={localizedLabel}
                      className={styles.iconLinkChip}
                      href={link.url}
                      key={link.url}
                      onFocus={() => setShouldLoadTooltip(true)}
                      onPointerEnter={() => setShouldLoadTooltip(true)}
                      rel="noreferrer"
                      target="_blank"
                      title={localizedLabel}>
                      <span className={styles.iconLinkInner}>
                        <PublishedResumeProfileIcon name={link.icon} />
                      </span>
                    </a>
                  )
                }

                return (
                  <DeferredPublishedResumeHeroTooltipLink
                    href={link.url}
                    iconName={link.icon}
                    key={link.url}
                    label={localizedLabel}
                  />
                )
              })}
            </div>
            {shouldLoadTooltip && !tooltipReady ? (
              <DeferredPublishedResumeHeroTooltipLink
                href="#"
                iconName="ri:link-m"
                label={t('profileLinksTitle')}
                onReady={() => setTooltipReady(true)}
                render={false}
              />
            ) : null}
            {tooltipReady ? <span className="sr-only" data-testid="hero-tooltip-ready" /> : null}
          </div>
        ) : null}

        <a
          className={styles.githubCard}
          href="https://github.com/Fridolph/my-resume"
          rel="noreferrer"
          target="_blank">
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-400">
            GitHub
          </p>
          <p
            className={`${styles.gradientCopy} mt-2 text-sm font-semibold leading-6 text-slate-700 dark:text-slate-100`}>
            {t('sidebarProjectNote')}
          </p>
        </a>

        {localizedInterests.length > 0 ? (
          <div className="grid gap-3">
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-400">
              {t('interestsTitle')}
            </p>
            <div className="flex flex-wrap gap-2.5">
              {localizedInterests.map((interest) =>
                interest.icon ? (
                  <article
                    className={`${styles.interestCard} ${interestCardClass}`}
                    key={`${interest.localizedLabel}-${interest.icon}`}>
                    <span className={styles.interestCardIcon}>
                      <PublishedResumeProfileIcon name={interest.icon} />
                    </span>
                    <span className={styles.interestCardLabel}>
                      {interest.localizedLabel}
                    </span>
                  </article>
                ) : (
                  <article
                    className={`${styles.interestCard} ${interestCardClass} ${interestCardPlainClass}`}
                    key={`${interest.localizedLabel}-plain`}>
                    <span
                      className={`${styles.interestCardLabel} ${interestCardLabelPlainClass}`}>
                      {interest.localizedLabel}
                    </span>
                  </article>
                ),
              )}
            </div>
          </div>
        ) : null}

        {highlights.length > 0 ? (
          <div className="grid gap-3">
            <div className="flex items-center justify-between gap-3">
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-400">
                {t('highlights.title')}
              </p>
              <Chip size="sm" variant="soft">
                {highlights.length}
              </Chip>
            </div>
            <div className="grid gap-2.5">
              {highlights.map((item, index) => (
                <article
                  className={styles.highlightCard}
                  key={`${item.title.en}-${index}`}>
                  <div
                    className={`pointer-events-none absolute inset-0 bg-gradient-to-br opacity-0 transition duration-300 group-hover:opacity-100 ${highlightAccentClasses[index % highlightAccentClasses.length]}`}
                  />
                  <div className="relative flex items-start gap-3">
                    <span className="inline-flex size-8 flex-shrink-0 items-center justify-center rounded-full border border-slate-200/90 bg-white/90 text-[0.7rem] font-semibold tracking-[0.2em] text-slate-500 dark:border-white/10 dark:bg-white/[0.08] dark:text-slate-200">
                      {String(index + 1).padStart(2, '0')}
                    </span>
                    <div className="min-w-0 space-y-1">
                      <h3 className="text-sm font-semibold leading-6 text-slate-900 dark:text-white">
                        {readLocalizedText(item.title, locale)}
                      </h3>
                      <p className="text-[0.92rem] leading-6 text-slate-500 dark:text-slate-400">
                        {readLocalizedText(item.description, locale)}
                      </p>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          </div>
        ) : null}

        <div className={styles.publishedMetaCard}>
          <p className="text-[0.7rem] font-semibold uppercase tracking-[0.24em] text-slate-400">
            {t('publishedAt')}
          </p>
          <p className="mt-1.5 text-sm font-medium leading-6 text-slate-600 dark:text-slate-300">
            {formatPublishedAt(publishedResume.publishedAt, locale)}
          </p>
        </div>
      </CardContent>
    </Card>
  )
}

export const PublishedResumeHero = memo(PublishedResumeHeroComponent)
PublishedResumeHero.displayName = 'PublishedResumeHero'
