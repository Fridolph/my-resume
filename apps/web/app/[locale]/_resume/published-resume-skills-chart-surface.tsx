'use client'

import { init } from 'echarts/core'
import { useEffect, useRef } from 'react'

import type { SkillChartOption } from './published-resume-skills-utils'

export function PublishedResumeSkillsChartSurface({
  ariaLabel,
  option,
}: {
  ariaLabel: string
  option: SkillChartOption
}) {
  const containerRef = useRef<HTMLDivElement | null>(null)
  const isJsdom = typeof navigator !== 'undefined' && /jsdom/i.test(navigator.userAgent)

  useEffect(() => {
    if (!containerRef.current || isJsdom) {
      return
    }

    const chart = init(containerRef.current, undefined, {
      renderer: 'svg',
    })

    chart.setOption(option)

    const handleResize = () => {
      chart.resize()
    }

    window.addEventListener('resize', handleResize)

    return () => {
      window.removeEventListener('resize', handleResize)
      chart.dispose()
    }
  }, [isJsdom, option])

  return (
    <div
      aria-label={ariaLabel}
      className="min-h-[340px] w-full"
      ref={containerRef}
      role="img"
    />
  )
}
