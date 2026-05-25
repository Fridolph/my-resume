'use client'

import { useEffect } from 'react'

import type { ResumeLocale, ResumePublishedSnapshot } from '@shared/published-resume/types/published-resume.types'
import { readLocalizedText } from '@shared/published-resume/published-resume-utils'
import { useOptionalAiChat } from './ai-chat-context'
import type { AiChatPresentation } from './ai-chat.types'

function buildPresentationFromResume(
  locale: ResumeLocale,
  publishedResume: ResumePublishedSnapshot,
): AiChatPresentation {
  const profile = publishedResume.resume.profile

  return {
    assistantAvatarSrc: profile.hero.frontImageUrl || null,
    assistantLabel:
      readLocalizedText(profile.fullName, locale) ||
      (locale === 'en' ? 'Resume Companion' : '简历助手'),
    visitorLabel: locale === 'en' ? 'Visitor' : '访客',
  }
}

export function AiChatPresentationSync({
  locale,
  publishedResume,
}: {
  locale: ResumeLocale
  publishedResume: ResumePublishedSnapshot | null
}) {
  const aiChat = useOptionalAiChat()
  const clearPresentation = aiChat?.clearPresentation
  const registerPresentation = aiChat?.registerPresentation

  useEffect(() => {
    if (!clearPresentation || !registerPresentation) {
      return
    }

    if (!publishedResume) {
      clearPresentation()
      return
    }

    registerPresentation(buildPresentationFromResume(locale, publishedResume))

    return () => {
      clearPresentation()
    }
  }, [clearPresentation, locale, publishedResume, registerPresentation])

  return null
}
