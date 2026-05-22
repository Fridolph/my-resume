'use client'

import { Button } from '@heroui/react/button'
import { useEffect, useState } from 'react'

export function ScrollToTopButton() {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const onScroll = () => {
      setVisible(window.scrollY > 400)
    }
    window.addEventListener('scroll', onScroll, { passive: true })
    onScroll()
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  if (!visible) {
    return null
  }

  return (
    <Button
      aria-label="回到顶部"
      className="fixed bottom-6 right-6 z-40 h-10 w-10 rounded-full shadow-lg"
      isIconOnly
      onPress={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
      size="sm"
      variant="primary">
      <svg
        aria-hidden="true"
        fill="none"
        height="16"
        viewBox="0 0 24 24"
        width="16">
        <path
          d="M18 15l-6-6-6 6"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="2"
        />
      </svg>
    </Button>
  )
}
