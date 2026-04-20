'use client'

import { Button } from '@heroui/react/button'
import { Tooltip } from '@heroui/react/tooltip'
import { useThemeMode } from '@my-resume/ui/theme'
import { useTranslations } from 'next-intl'
import { useEffect, useMemo, useRef, useState } from 'react'

import { readLocalizedText } from '@shared/published-resume/published-resume-utils'
import { PublishedResumeSectionCard } from './published-resume-section-card'
import {
  buildPieChartOption,
  buildRadarChartOption,
  buildSkillCloudTokens,
  getSkillChartPalette,
  normalizeSkillGroups,
  rankSkillGroups,
} from './published-resume-skills-utils'
import type {
  IdleAwareWindow,
  PublishedResumeSkillsSectionProps,
  SkillChartMode,
  SkillChartRenderer,
  SkillViewMode,
} from './types/published-resume-skills-section.types'
import { createIndexedRenderKey, createRenderKey } from './published-resume-render-key'
import styles from './published-resume-skills-section.module.css'

const cloudTokenToneClasses = [
  'hover:border-blue-600/50 hover:text-blue-700 hover:shadow-[0_14px_30px_rgba(37,99,235,0.16)] dark:hover:text-blue-300',
  'hover:border-cyan-700/50 hover:text-teal-700 hover:shadow-[0_14px_30px_rgba(8,145,178,0.16)] dark:hover:text-cyan-300',
  'hover:border-indigo-500/50 hover:text-indigo-600 hover:shadow-[0_14px_30px_rgba(99,102,241,0.16)] dark:hover:text-indigo-300',
  'hover:border-purple-500/45 hover:text-violet-600 hover:shadow-[0_14px_30px_rgba(168,85,247,0.15)] dark:hover:text-violet-300',
  'hover:border-rose-500/45 hover:text-rose-600 hover:shadow-[0_14px_30px_rgba(244,63,94,0.15)] dark:hover:text-rose-300',
  'hover:border-emerald-500/45 hover:text-emerald-600 hover:shadow-[0_14px_30px_rgba(16,185,129,0.15)] dark:hover:text-emerald-300',
] as const

async function loadSkillChartRenderer(mode: SkillChartMode): Promise<SkillChartRenderer> {
  if (mode === 'radar') {
    const radarChartModule = await import('./published-resume-skills-radar-chart')

    return radarChartModule.PublishedResumeSkillsRadarChart
  }

  const pieChartModule = await import('./published-resume-skills-pie-chart')

  return pieChartModule.PublishedResumeSkillsPieChart
}

export function PublishedResumeSkillsSection({
  locale,
  skills,
}: PublishedResumeSkillsSectionProps) {
  const t = useTranslations('publishedResume')
  const isJsdom = typeof navigator !== 'undefined' && /jsdom/i.test(navigator.userAgent)
  const [viewMode, setViewMode] = useState<SkillViewMode>('chart')
  const [chartMode, setChartMode] = useState<SkillChartMode>('radar')
  const [shouldLoadChart, setShouldLoadChart] = useState(false)
  const [chartRenderers, setChartRenderers] = useState<
    Partial<Record<SkillChartMode, SkillChartRenderer>>
  >({})
  const { theme: themeMode } = useThemeMode()
  const chartViewportRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    if (isJsdom) {
      return
    }

    if (viewMode !== 'chart' || shouldLoadChart) {
      return
    }

    if (typeof window === 'undefined') {
      return
    }

    if (typeof IntersectionObserver === 'undefined') {
      setShouldLoadChart(true)
      return
    }

    const observerTarget = chartViewportRef.current

    if (!observerTarget) {
      return
    }

    const observer = new IntersectionObserver(
      (entries) => {
        const isVisible = entries.some(
          (entry) => entry.isIntersecting || entry.intersectionRatio > 0,
        )

        if (!isVisible) {
          return
        }

        setShouldLoadChart(true)
        observer.disconnect()
      },
      {
        rootMargin: '320px 0px',
        threshold: 0.01,
      },
    )

    observer.observe(observerTarget)

    return () => {
      observer.disconnect()
    }
  }, [isJsdom, shouldLoadChart, viewMode])

  useEffect(() => {
    if (isJsdom) {
      return
    }

    if (!shouldLoadChart || chartRenderers[chartMode]) {
      return
    }

    const idleWindow = window as IdleAwareWindow
    let active = true
    let timeoutId: number | null = null
    let idleId: number | null = null

    const runImport = () => {
      void loadSkillChartRenderer(chartMode).then((chartRenderer) => {
        if (!active) {
          return
        }

        setChartRenderers((currentRenderers) => {
          if (currentRenderers[chartMode]) {
            return currentRenderers
          }

          return {
            ...currentRenderers,
            [chartMode]: chartRenderer,
          }
        })
      })
    }

    const shouldScheduleOnIdle =
      chartMode === 'radar' && Object.keys(chartRenderers).length === 0

    if (shouldScheduleOnIdle && typeof idleWindow.requestIdleCallback === 'function') {
      idleId = idleWindow.requestIdleCallback(() => {
        runImport()
      })
    } else if (shouldScheduleOnIdle) {
      timeoutId = window.setTimeout(() => {
        runImport()
      }, 0)
    } else {
      runImport()
    }

    return () => {
      active = false

      if (idleId !== null && typeof idleWindow.cancelIdleCallback === 'function') {
        idleWindow.cancelIdleCallback(idleId)
      }

      if (timeoutId !== null) {
        window.clearTimeout(timeoutId)
      }
    }
  }, [chartMode, chartRenderers, isJsdom, shouldLoadChart])

  const normalizedGroups = useMemo(() => normalizeSkillGroups(skills, locale), [locale, skills])
  const chartGroups = useMemo(
    () => rankSkillGroups(normalizedGroups, locale),
    [locale, normalizedGroups],
  )
  const cloudTokens = useMemo(
    () => buildSkillCloudTokens(normalizedGroups, locale),
    [locale, normalizedGroups],
  )

  const activeChartOption = useMemo(
    () =>
      chartMode === 'radar'
        ? buildRadarChartOption(chartGroups, themeMode, {
            pieCenterTitle: t('skills.pieCenterTitle'),
            pieTooltipValue: (name, value) =>
              t('skills.pieTooltipValue', { name, value }),
            radarSeriesName: t('skills.radarSeriesName'),
            radarTooltipValue: (name, value) =>
              t('skills.radarTooltipValue', { name, value }),
          })
        : buildPieChartOption(chartGroups, themeMode, {
            pieCenterTitle: t('skills.pieCenterTitle'),
            pieTooltipValue: (name, value) =>
              t('skills.pieTooltipValue', { name, value }),
            radarSeriesName: t('skills.radarSeriesName'),
            radarTooltipValue: (name, value) =>
              t('skills.radarTooltipValue', { name, value }),
          }),
    [chartGroups, chartMode, t, themeMode],
  )
  const chartAriaLabel =
    chartMode === 'radar'
      ? t('skills.chartRadarAriaLabel')
      : t('skills.chartPieAriaLabel')
  const ActiveChartCanvas = chartRenderers[chartMode] ?? null

  if (skills.length === 0) {
    return null
  }

  const toolbar = (
    <div className={styles.toolbar}>
      <div className={styles.controlGroup}>
        <div className={styles.controlSurface}>
          {(
            [
              ['chart', t('skills.viewChart')],
              ['structure', t('skills.viewStructure')],
            ] as const
          ).map(([mode, label]) => (
            <Button
              className={styles.controlButton}
              key={mode}
              onPress={() => setViewMode(mode)}
              size="sm"
              type="button"
              variant={viewMode === mode ? 'primary' : 'ghost'}>
              {label}
            </Button>
          ))}
        </div>
      </div>

      {viewMode === 'chart' ? (
        <div className={styles.controlGroup}>
          <div className={styles.controlSurface}>
            {(
              [
                ['radar', t('skills.chartRadar')],
                ['pie', t('skills.chartPie')],
              ] as const
            ).map(([mode, label]) => (
              <Button
                className={styles.controlButton}
                key={mode}
                onPress={() => setChartMode(mode)}
                size="sm"
                type="button"
                variant={chartMode === mode ? 'primary' : 'ghost'}>
                {label}
              </Button>
            ))}
          </div>
        </div>
      ) : null}
    </div>
  )

  return (
    <PublishedResumeSectionCard
      action={toolbar}
      description={t('skills.description')}
      eyebrow={t('skills.eyebrow')}
      title={t('skills.title')}>
      {viewMode === 'structure' ? (
        <div className="grid gap-4 xl:grid-cols-2">
          {normalizedGroups.map((group, groupIndex) => {
            const groupKey = createIndexedRenderKey(groupIndex, [
              group.name.zh,
              group.name.en,
              group.keywords.length,
            ])

            return (
              <article className={styles.structureCard} key={groupKey}>
                <div className="flex items-center justify-between gap-3">
                  <h3 className="text-lg font-semibold tracking-tight text-slate-900 dark:text-white">
                    {readLocalizedText(group.name, locale)}
                  </h3>
                  <span
                    className={`${styles.structureCountBadge} text-xs font-semibold uppercase tracking-[0.18em] text-slate-500 dark:text-slate-300`}>
                    {group.parsedKeywords.length}
                  </span>
                </div>

                <ul className="mt-4 grid gap-3">
                  {group.parsedKeywords.map((item, itemIndex) => (
                    <li
                      className={`${styles.structureItem} text-sm text-slate-600 dark:text-slate-200`}
                      key={createIndexedRenderKey(itemIndex, [
                        groupKey,
                        item.label,
                        item.content,
                        item.raw,
                      ])}>
                      {item.label ? (
                        <div className="grid gap-1.5">
                          <strong className="text-sm font-semibold leading-6 text-slate-900 dark:text-white">
                            {item.label}
                          </strong>
                          <span className="text-[0.96rem] leading-7 text-slate-600 dark:text-slate-200">
                            {item.content}
                          </span>
                        </div>
                      ) : (
                        <span className="block text-[0.96rem] leading-7">
                          {item.content}
                        </span>
                      )}
                    </li>
                  ))}
                </ul>
              </article>
            )
          })}
        </div>
      ) : null}

      {viewMode === 'chart' ? (
        <div className={styles.chartLayout} ref={chartViewportRef}>
          <div className={styles.chartStack}>
            <article className={styles.chartSurface}>
              <div className="space-y-1">
                <h3 className="text-lg font-semibold tracking-tight text-slate-900 dark:text-white">
                  {chartMode === 'radar'
                    ? t('skills.chartRadar')
                    : t('skills.chartPie')}
                </h3>
                <p className="text-sm leading-6 text-slate-500 dark:text-slate-400">
                  {chartMode === 'radar'
                    ? t('skills.chartRadarCaption')
                    : t('skills.chartPieCaption')}
                </p>
              </div>

              <div className="mt-4 grid place-items-center">
                {ActiveChartCanvas ? (
                  <ActiveChartCanvas
                    ariaLabel={chartAriaLabel}
                    option={activeChartOption}
                  />
                ) : (
                  <div
                    aria-label={chartAriaLabel}
                    className={styles.chartFallback}
                    role="img"
                  />
                )}
              </div>
            </article>

            <div className={styles.cloudSurface}>
              <div className="mb-3 space-y-1">
                <h3 className="text-base font-semibold tracking-tight text-slate-900 dark:text-white">
                  {t('skills.cloudTitle')}
                </h3>
                <p className="text-sm leading-6 text-slate-500 dark:text-slate-400">
                  {t('skills.cloudCaption')}
                </p>
              </div>
              <div className="flex flex-wrap items-center justify-start gap-3">
                {cloudTokens.map((token) => (
                  <Tooltip key={token.id}>
                    <Tooltip.Trigger className={styles.tooltipTokenTrigger}>
                      <span
                        className={[
                          styles.cloudToken,
                          token.sizeClassName,
                          token.rotateClassName,
                          cloudTokenToneClasses[
                            token.toneIndex % cloudTokenToneClasses.length
                          ],
                        ].join(' ')}>
                        {token.label}
                      </span>
                    </Tooltip.Trigger>
                    <Tooltip.Content offset={10} placement="top">
                      <div className="max-w-xs space-y-1">
                        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
                          {token.groupLabel}
                        </p>
                        <p className="text-sm leading-6">{token.raw}</p>
                      </div>
                    </Tooltip.Content>
                  </Tooltip>
                ))}
              </div>
            </div>
          </div>

          <div className="grid gap-3">
            {chartGroups.map((group, index) => {
              const count = group.parsedKeywords.length
              const featuredLabels = group.parsedKeywords
                .map((item) => item.label ?? item.content)
                .slice(0, 4)
              const legendGroupKey = createRenderKey([
                group.name.zh,
                group.name.en,
                group.originalIndex,
                count,
              ])

              return (
                <article className={styles.legendCard} key={`${legendGroupKey}__legend-card`}>
                  <div className="flex items-start justify-between gap-4">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span
                          aria-hidden="true"
                          className="h-3 w-3 rounded-full"
                          style={{ backgroundColor: getSkillChartPalette(index) }}
                        />
                        <h4 className="text-sm font-semibold text-slate-900 dark:text-white">
                          {group.displayName}
                        </h4>
                      </div>
                      <p className="text-sm text-slate-500 dark:text-slate-400">
                        {count} {t('skills.points')}
                      </p>
                    </div>
                    <span className="text-2xl font-semibold text-slate-900 dark:text-white">
                      {count}
                    </span>
                  </div>

                  <div className="mt-3 flex flex-wrap gap-2">
                    {featuredLabels.map((label, labelIndex) => (
                      <span
                        className={`${styles.legendToken} text-xs font-medium text-slate-500 dark:text-slate-300`}
                        key={createIndexedRenderKey(labelIndex, [
                          legendGroupKey,
                          label,
                          'legend',
                        ])}>
                        {label}
                      </span>
                    ))}
                  </div>
                </article>
              )
            })}
          </div>
        </div>
      ) : null}
    </PublishedResumeSectionCard>
  )
}
