'use client'

import { Card, CardContent } from '@heroui/react/card'
import { Chip } from '@heroui/react/chip'
import { useTranslations } from 'next-intl'

import { Link } from '@i18n/navigation'
import type {
  ResumeLocale,
  ResumePublishedSnapshot,
} from '@shared/published-resume/types/published-resume.types'
import { readLocalizedText } from '@shared/published-resume/published-resume-utils'
import { aiTalkGhostCtaLinkClass, aiTalkPrimaryCtaLinkClass } from './cta-link-classes'
import { AiTalkPageFrame } from './page-frame'
import styles from './entry-shell.module.css'

interface AiTalkEntryShellProps {
  apiBaseUrl?: string
  enableClientSync?: boolean
  locale?: ResumeLocale
  publishedResume: ResumePublishedSnapshot | null
}

export function AiTalkEntryShell({
  apiBaseUrl,
  enableClientSync = false,
  locale = 'zh',
  publishedResume,
}: AiTalkEntryShellProps) {
  const t = useTranslations('aiTalk')

  return (
    <AiTalkPageFrame
      apiBaseUrl={apiBaseUrl}
      enableClientSync={enableClientSync}
      locale={locale}
      publishedResume={publishedResume}>
      {({ publishedResume: snapshot }) => {
        const profile = snapshot.resume.profile
        const featureCards = [
          {
            key: 'rag',
            href: '/ai-talk/chat',
            ctaVariant: 'primary' as const,
          },
          {
            key: 'resumeAdvisor',
            href: '/ai-talk/resume-advisor',
            ctaVariant: 'ghost' as const,
          },
          {
            key: 'avatar',
            href: '/ai-talk/avatar',
            ctaVariant: 'ghost' as const,
          },
        ] as const

        return (
          <>
            <Card className={styles.hubRow} data-testid="ai-talk-hub-row">
              <CardContent className={`${styles.hubRowBody} p-6 md:p-8`}>
                <div className={styles.hubSide} data-testid="ai-talk-hub-primary">
                  <div className="grid gap-3">
                    <p className="web-eyebrow">{t('hubRow.eyebrow')}</p>
                    <h1 className="text-3xl font-semibold tracking-[-0.05em] text-slate-950 dark:text-white md:text-4xl">
                      {t('hubRow.title')}
                    </h1>
                    <p className="max-w-3xl text-base leading-7 text-slate-500 dark:text-slate-400">
                      {t('hubRow.description')}
                    </p>
                  </div>

                  <div className="flex flex-wrap gap-3">
                    <Chip color="accent" variant="primary">
                      {t('status.rag')}
                    </Chip>
                    <Chip variant="soft">{t('status.streaming')}</Chip>
                    <Chip variant="soft">{t('status.trialCode')}</Chip>
                  </div>

                  <ol className={styles.planList}>
                    {[1, 2, 3].map((index) => (
                      <li className={styles.planItem} key={index}>
                        <span className={styles.planIndex}>{index}</span>
                        <div className="grid gap-1">
                          <p className="text-sm font-semibold text-slate-950 dark:text-white">
                            {t(`hubRow.plan.${index}.title`)}
                          </p>
                          <p className="text-sm leading-6 text-slate-500 dark:text-slate-400">
                            {t(`hubRow.plan.${index}.description`)}
                          </p>
                        </div>
                      </li>
                    ))}
                  </ol>
                </div>

                <aside className={styles.profilePanel} data-testid="ai-talk-hub-profile">
                  <div className="grid gap-2">
                    <p className="web-eyebrow">{t('hubRow.profile.eyebrow')}</p>
                    <h2 className="text-2xl font-semibold tracking-[-0.04em] text-slate-950 dark:text-white">
                      {readLocalizedText(profile.fullName, locale)}
                    </h2>
                    <p className="text-base font-medium text-slate-600 dark:text-slate-300">
                      {readLocalizedText(profile.headline, locale)}
                    </p>
                    <p className="text-sm leading-7 text-slate-500 dark:text-slate-400">
                      {readLocalizedText(profile.summary, locale)}
                    </p>
                  </div>

                  <div className="flex flex-wrap gap-3">
                    <Chip variant="soft">{readLocalizedText(profile.location, locale)}</Chip>
                    <Chip variant="soft">{profile.email}</Chip>
                  </div>

                  <div className={`${styles.profileFooter} grid gap-2`}>
                    <p className="text-sm font-semibold text-slate-950 dark:text-white">
                      {t('hubRow.profile.nextTitle')}
                    </p>
                    <p className="text-sm leading-6 text-slate-500 dark:text-slate-400">
                      {t('hubRow.profile.nextDescription')}
                    </p>
                  </div>
                </aside>
              </CardContent>
            </Card>

            <div className={styles.featureGrid} data-testid="ai-talk-feature-grid">
              {featureCards.map((card) => (
                <article
                  className={styles.flipScene}
                  data-testid={`ai-talk-card-${card.key}`}
                  key={card.key}>
                  <div className={styles.flipInner}>
                    <div className={`${styles.flipFace} ${styles.flipFront}`}>
                      <span className={styles.cardGlare} aria-hidden="true" />
                      <div className={styles.frontContent}>
                        <p className="web-eyebrow">{t(`featureCards.${card.key}.front.eyebrow`)}</p>
                        <h3 className={styles.frontTitle}>
                          {t(`featureCards.${card.key}.front.title`)}
                        </h3>
                        <p className={styles.frontDescription}>
                          {t(`featureCards.${card.key}.front.description`)}
                        </p>
                      </div>
                      <div className={styles.frontMeta}>
                        <Chip color={card.key === 'rag' ? 'accent' : 'default'} variant="soft">
                          {t(`featureCards.${card.key}.front.badge`)}
                        </Chip>
                        <Chip variant="soft">{t(`featureCards.${card.key}.front.status`)}</Chip>
                      </div>
                    </div>

                    <div className={`${styles.flipFace} ${styles.flipBack}`}>
                      <span className={styles.cardGlare} aria-hidden="true" />
                      <div className={styles.backContent}>
                        <div className={styles.backHeader}>
                          <p className="web-eyebrow">{t(`featureCards.${card.key}.back.eyebrow`)}</p>
                          <h3 className={styles.backTitle}>
                            {t(`featureCards.${card.key}.back.title`)}
                          </h3>
                          <p className={styles.backDescription}>
                            {t(`featureCards.${card.key}.back.description`)}
                          </p>
                        </div>

                        <div className="flex flex-wrap gap-3">
                          {['one', 'two'].map((item) => (
                            <Chip key={item} variant="soft">
                              {t(`featureCards.${card.key}.back.tags.${item}`)}
                            </Chip>
                          ))}
                        </div>

                        <ul className={styles.detailList}>
                          {['one', 'two'].map((item) => (
                            <li className={styles.detailItem} key={item}>
                              {t(`featureCards.${card.key}.back.details.${item}`)}
                            </li>
                          ))}
                        </ul>

                        <div className={styles.ctaRow}>
                          <Link
                            className={
                              card.ctaVariant === 'primary'
                                ? aiTalkPrimaryCtaLinkClass
                                : aiTalkGhostCtaLinkClass
                            }
                            href={card.href}>
                            {t(`featureCards.${card.key}.back.cta`)}
                          </Link>
                        </div>
                      </div>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          </>
        )
      }}
    </AiTalkPageFrame>
  )
}
