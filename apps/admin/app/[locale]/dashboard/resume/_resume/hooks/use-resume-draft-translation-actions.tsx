'use client'

import { Button } from '@heroui/react'
import { useCallback } from 'react'

import {
  clearLocalizedLineValues,
  clearLocalizedTextValue,
  clearProfileInterestValues,
  copyLocalizedLineValues,
  copyLocalizedTextValue,
  copyProfileInterestValues,
  ensureHeroSlogans,
} from '../editor/draft-editor-helpers'
import type { RenderTranslationActions, UpdateResumeDraft } from '../types/draft-editor.types'

interface UseResumeDraftTranslationActionsArgs {
  isTranslationMode: boolean
  setErrorMessage: (message: string | null) => void
  setFeedbackMessage: (message: string | null) => void
  updateResumeDraft: UpdateResumeDraft
}

export function useResumeDraftTranslationActions({
  isTranslationMode,
  setErrorMessage,
  setFeedbackMessage,
  updateResumeDraft,
}: UseResumeDraftTranslationActionsArgs) {
  const showTranslationPlaceholder = useCallback(
    (scopeTitle: string) => {
      setErrorMessage(null)
      setFeedbackMessage(
        `${scopeTitle} 的 AI 翻译入口将在后续 issue 接入，这里先把工作区和人工校对路径立住。`,
      )
    },
    [setErrorMessage, setFeedbackMessage],
  )

  const copyProfileTranslations = useCallback(() => {
    updateResumeDraft(
      (draft) => {
        copyLocalizedTextValue(draft.profile.fullName)
        copyLocalizedTextValue(draft.profile.headline)
        copyLocalizedTextValue(draft.profile.summary)
        copyLocalizedTextValue(draft.profile.location)
        draft.profile.hero = ensureHeroSlogans(draft.profile.hero)
        draft.profile.links.forEach((link) => {
          copyLocalizedTextValue(link.label)
        })
        draft.profile.interests = copyProfileInterestValues(draft.profile.interests)
        draft.profile.hero.slogans = copyLocalizedLineValues(draft.profile.hero.slogans)
      },
      { syncDraftFields: true },
    )
    setErrorMessage(null)
    setFeedbackMessage('已将基础信息中的中文内容复制到英文翻译工作区。')
  }, [setErrorMessage, setFeedbackMessage, updateResumeDraft])

  const clearProfileTranslations = useCallback(() => {
    updateResumeDraft(
      (draft) => {
        clearLocalizedTextValue(draft.profile.fullName)
        clearLocalizedTextValue(draft.profile.headline)
        clearLocalizedTextValue(draft.profile.summary)
        clearLocalizedTextValue(draft.profile.location)
        draft.profile.hero = ensureHeroSlogans(draft.profile.hero)
        draft.profile.links.forEach((link) => {
          clearLocalizedTextValue(link.label)
        })
        draft.profile.interests = clearProfileInterestValues(draft.profile.interests)
        draft.profile.hero.slogans = clearLocalizedLineValues(draft.profile.hero.slogans)
      },
      { syncDraftFields: true },
    )
    setErrorMessage(null)
    setFeedbackMessage('已清空基础信息中的英文翻译字段。')
  }, [setErrorMessage, setFeedbackMessage, updateResumeDraft])

  const copyEducationTranslations = useCallback(() => {
    updateResumeDraft(
      (draft) => {
        draft.education.forEach((education) => {
          copyLocalizedTextValue(education.schoolName)
          copyLocalizedTextValue(education.degree)
          copyLocalizedTextValue(education.fieldOfStudy)
          copyLocalizedTextValue(education.location)
          education.highlights = copyLocalizedLineValues(education.highlights)
        })
      },
      { syncDraftFields: true },
    )
    setErrorMessage(null)
    setFeedbackMessage('已将教育经历中的中文内容复制到英文翻译工作区。')
  }, [setErrorMessage, setFeedbackMessage, updateResumeDraft])

  const clearEducationTranslations = useCallback(() => {
    updateResumeDraft(
      (draft) => {
        draft.education.forEach((education) => {
          clearLocalizedTextValue(education.schoolName)
          clearLocalizedTextValue(education.degree)
          clearLocalizedTextValue(education.fieldOfStudy)
          clearLocalizedTextValue(education.location)
          education.highlights = clearLocalizedLineValues(education.highlights)
        })
      },
      { syncDraftFields: true },
    )
    setErrorMessage(null)
    setFeedbackMessage('已清空教育经历中的英文翻译字段。')
  }, [setErrorMessage, setFeedbackMessage, updateResumeDraft])

  const copyExperienceTranslations = useCallback(() => {
    updateResumeDraft(
      (draft) => {
        draft.experiences.forEach((experience) => {
          copyLocalizedTextValue(experience.companyName)
          copyLocalizedTextValue(experience.role)
          copyLocalizedTextValue(experience.employmentType)
          copyLocalizedTextValue(experience.location)
          copyLocalizedTextValue(experience.summary)
          experience.highlights = copyLocalizedLineValues(experience.highlights)
        })
      },
      { syncDraftFields: true },
    )
    setErrorMessage(null)
    setFeedbackMessage('已将工作经历中的中文内容复制到英文翻译工作区。')
  }, [setErrorMessage, setFeedbackMessage, updateResumeDraft])

  const clearExperienceTranslations = useCallback(() => {
    updateResumeDraft(
      (draft) => {
        draft.experiences.forEach((experience) => {
          clearLocalizedTextValue(experience.companyName)
          clearLocalizedTextValue(experience.role)
          clearLocalizedTextValue(experience.employmentType)
          clearLocalizedTextValue(experience.location)
          clearLocalizedTextValue(experience.summary)
          experience.highlights = clearLocalizedLineValues(experience.highlights)
        })
      },
      { syncDraftFields: true },
    )
    setErrorMessage(null)
    setFeedbackMessage('已清空工作经历中的英文翻译字段。')
  }, [setErrorMessage, setFeedbackMessage, updateResumeDraft])

  const copyProjectTranslations = useCallback(() => {
    updateResumeDraft(
      (draft) => {
        draft.projects.forEach((project) => {
          copyLocalizedTextValue(project.name)
          copyLocalizedTextValue(project.role)
          copyLocalizedTextValue(project.summary)
          copyLocalizedTextValue(project.coreFunctions)
          project.highlights = copyLocalizedLineValues(project.highlights)
          project.links.forEach((link) => {
            copyLocalizedTextValue(link.label)
          })
        })
      },
      { syncDraftFields: true },
    )
    setErrorMessage(null)
    setFeedbackMessage('已将项目经历中的中文内容复制到英文翻译工作区。')
  }, [setErrorMessage, setFeedbackMessage, updateResumeDraft])

  const clearProjectTranslations = useCallback(() => {
    updateResumeDraft(
      (draft) => {
        draft.projects.forEach((project) => {
          clearLocalizedTextValue(project.name)
          clearLocalizedTextValue(project.role)
          clearLocalizedTextValue(project.summary)
          clearLocalizedTextValue(project.coreFunctions)
          project.highlights = clearLocalizedLineValues(project.highlights)
          project.links.forEach((link) => {
            clearLocalizedTextValue(link.label)
          })
        })
      },
      { syncDraftFields: true },
    )
    setErrorMessage(null)
    setFeedbackMessage('已清空项目经历中的英文翻译字段。')
  }, [setErrorMessage, setFeedbackMessage, updateResumeDraft])

  const copySkillTranslations = useCallback(() => {
    updateResumeDraft((draft) => {
      draft.skills.forEach((skill) => {
        copyLocalizedTextValue(skill.name)
      })
    })
    setErrorMessage(null)
    setFeedbackMessage('已将技能组名称复制到英文翻译工作区。')
  }, [setErrorMessage, setFeedbackMessage, updateResumeDraft])

  const clearSkillTranslations = useCallback(() => {
    updateResumeDraft((draft) => {
      draft.skills.forEach((skill) => {
        clearLocalizedTextValue(skill.name)
      })
    })
    setErrorMessage(null)
    setFeedbackMessage('已清空技能组中的英文翻译字段。')
  }, [setErrorMessage, setFeedbackMessage, updateResumeDraft])

  const copyHighlightTranslations = useCallback(() => {
    updateResumeDraft((draft) => {
      draft.highlights.forEach((highlight) => {
        copyLocalizedTextValue(highlight.title)
        copyLocalizedTextValue(highlight.description)
      })
    })
    setErrorMessage(null)
    setFeedbackMessage('已将亮点中的中文内容复制到英文翻译工作区。')
  }, [setErrorMessage, setFeedbackMessage, updateResumeDraft])

  const clearHighlightTranslations = useCallback(() => {
    updateResumeDraft((draft) => {
      draft.highlights.forEach((highlight) => {
        clearLocalizedTextValue(highlight.title)
        clearLocalizedTextValue(highlight.description)
      })
    })
    setErrorMessage(null)
    setFeedbackMessage('已清空亮点中的英文翻译字段。')
  }, [setErrorMessage, setFeedbackMessage, updateResumeDraft])

  const renderTranslationActions = useCallback<RenderTranslationActions>(
    (scopeTitle, handlers) => {
      if (!isTranslationMode) {
        return null
      }

      return (
        <div className="flex flex-wrap justify-end gap-2">
          <Button
            aria-label={`${scopeTitle} 复制中文到英文`}
            onPress={handlers.onCopy}
            size="sm"
            type="button"
            variant="outline">
            复制中文到英文
          </Button>
          <Button
            aria-label={`${scopeTitle} 清空英文`}
            onPress={handlers.onClear}
            size="sm"
            type="button"
            variant="ghost">
            清空英文
          </Button>
          <Button
            aria-label={`${scopeTitle} AI 翻译入口预留`}
            onPress={() => showTranslationPlaceholder(scopeTitle)}
            size="sm"
            type="button"
            variant="ghost">
            AI 翻译入口预留
          </Button>
        </div>
      )
    },
    [isTranslationMode, showTranslationPlaceholder],
  )

  return {
    clearEducationTranslations,
    clearExperienceTranslations,
    clearHighlightTranslations,
    clearProfileTranslations,
    clearProjectTranslations,
    clearSkillTranslations,
    copyEducationTranslations,
    copyExperienceTranslations,
    copyHighlightTranslations,
    copyProfileTranslations,
    copyProjectTranslations,
    copySkillTranslations,
    renderTranslationActions,
  }
}
