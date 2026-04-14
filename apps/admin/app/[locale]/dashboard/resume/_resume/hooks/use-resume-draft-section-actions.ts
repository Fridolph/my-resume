import { useCallback } from 'react'

import type {
  ResumeEducationItem,
  ResumeExperienceItem,
  ResumeHighlightItem,
  ResumeProfile,
  ResumeProfileHero,
  ResumeProjectItem,
} from '../types/resume.types'
import {
  buildDraftFieldKey,
  mergeLocalizedLines,
  parseCommaSeparatedValues,
  parseLineSeparatedValues,
  createEmptyEducation,
  createEmptyExperience,
  createEmptyHighlight,
  createEmptyProfileHero,
  createEmptyProfileInterest,
  createEmptyProfileLink,
  createEmptyProject,
  createEmptySkillGroup,
  ensureHeroSlogans,
} from '../editor/draft-editor-helpers'
import type {
  SortableCollectionKey,
  UpdateResumeDraft,
  UpdateSortableCollection,
} from '../types/draft-editor.types'

interface UseResumeDraftSectionActionsArgs {
  nextSortableId: (scope: SortableCollectionKey) => string
  setDraftFieldValues: (
    updater: (current: Record<string, string>) => Record<string, string>,
  ) => void
  updateResumeDraft: UpdateResumeDraft
  updateSortableCollection: UpdateSortableCollection
}

export function useResumeDraftSectionActions({
  nextSortableId,
  setDraftFieldValues,
  updateResumeDraft,
  updateSortableCollection,
}: UseResumeDraftSectionActionsArgs) {
  const updateProfileLocalizedField = useCallback(
    (
      field: keyof Pick<ResumeProfile, 'fullName' | 'headline' | 'summary' | 'location'>,
      locale: 'zh' | 'en',
      value: string,
    ) => {
      updateResumeDraft((draft) => {
        draft.profile[field][locale] = value
      })
    },
    [updateResumeDraft],
  )

  const updateProfilePlainField = useCallback(
    (field: keyof Pick<ResumeProfile, 'email' | 'phone' | 'website'>, value: string) => {
      updateResumeDraft((draft) => {
        draft.profile[field] = value
      })
    },
    [updateResumeDraft],
  )

  const updateProfileHeroField = useCallback(
    (
      field: keyof Pick<ResumeProfileHero, 'frontImageUrl' | 'backImageUrl' | 'linkUrl'>,
      value: string,
    ) => {
      updateResumeDraft((draft) => {
        draft.profile.hero = ensureHeroSlogans(
          draft.profile.hero ?? createEmptyProfileHero(),
        )
        draft.profile.hero[field] = value
      })
    },
    [updateResumeDraft],
  )

  const updateProfileHeroSlogans = useCallback(
    (locale: 'zh' | 'en', value: string) => {
      setDraftFieldValues((current) => ({
        ...current,
        [buildDraftFieldKey('profile', 'hero', 'slogans', locale)]: value,
      }))

      updateResumeDraft((draft) => {
        draft.profile.hero = ensureHeroSlogans(
          draft.profile.hero ?? createEmptyProfileHero(),
        )
        draft.profile.hero.slogans = mergeLocalizedLines(
          draft.profile.hero.slogans,
          locale,
          value,
        ).slice(0, 2)

        if (draft.profile.hero.slogans.length < 2) {
          draft.profile.hero = ensureHeroSlogans(draft.profile.hero)
        }
      })
    },
    [setDraftFieldValues, updateResumeDraft],
  )

  const updateProfileLinkField = useCallback(
    (
      index: number,
      field: 'label' | 'url' | 'icon',
      value: string,
      locale?: 'zh' | 'en',
    ) => {
      updateResumeDraft((draft) => {
        if (field === 'url') {
          draft.profile.links[index].url = value
          return
        }

        if (field === 'icon') {
          draft.profile.links[index].icon = value.trim() ? value : undefined
          return
        }

        draft.profile.links[index].label[locale ?? 'zh'] = value
      })
    },
    [updateResumeDraft],
  )

  const updateProfileInterestField = useCallback(
    (
      index: number,
      field: 'label' | 'icon',
      value: string,
      locale?: 'zh' | 'en',
    ) => {
      updateResumeDraft((draft) => {
        if (field === 'icon') {
          draft.profile.interests[index].icon = value.trim() ? value : undefined
          return
        }

        draft.profile.interests[index].label[locale ?? 'zh'] = value
      })
    },
    [updateResumeDraft],
  )

  const addProfileLink = useCallback(() => {
    updateResumeDraft((draft) => {
      draft.profile.links.push(createEmptyProfileLink())
    })
    updateSortableCollection('profileLinks', (currentIds) => [
      ...currentIds,
      nextSortableId('profileLinks'),
    ])
  }, [nextSortableId, updateResumeDraft, updateSortableCollection])

  const addProfileInterest = useCallback(() => {
    updateResumeDraft((draft) => {
      draft.profile.interests.push(createEmptyProfileInterest())
    })
    updateSortableCollection('profileInterests', (currentIds) => [
      ...currentIds,
      nextSortableId('profileInterests'),
    ])
  }, [nextSortableId, updateResumeDraft, updateSortableCollection])

  const removeProfileLink = useCallback(
    (index: number) => {
      updateResumeDraft((draft) => {
        draft.profile.links.splice(index, 1)
      })
      updateSortableCollection('profileLinks', (currentIds) =>
        currentIds.filter((_, currentIndex) => currentIndex !== index),
      )
    },
    [updateResumeDraft, updateSortableCollection],
  )

  const removeProfileInterest = useCallback(
    (index: number) => {
      updateResumeDraft((draft) => {
        draft.profile.interests.splice(index, 1)
      })
      updateSortableCollection('profileInterests', (currentIds) =>
        currentIds.filter((_, currentIndex) => currentIndex !== index),
      )
    },
    [updateResumeDraft, updateSortableCollection],
  )

  const updateEducationLocalizedField = useCallback(
    (
      index: number,
      field: keyof Pick<
        ResumeEducationItem,
        'schoolName' | 'degree' | 'fieldOfStudy' | 'location'
      >,
      locale: 'zh' | 'en',
      value: string,
    ) => {
      updateResumeDraft((draft) => {
        draft.education[index][field][locale] = value
      })
    },
    [updateResumeDraft],
  )

  const updateEducationPlainField = useCallback(
    (
      index: number,
      field: keyof Pick<ResumeEducationItem, 'startDate' | 'endDate'>,
      value: string,
    ) => {
      updateResumeDraft((draft) => {
        draft.education[index][field] = value
      })
    },
    [updateResumeDraft],
  )

  const updateEducationHighlights = useCallback(
    (index: number, locale: 'zh' | 'en', value: string) => {
      setDraftFieldValues((current) => ({
        ...current,
        [buildDraftFieldKey('education', index, 'highlights', locale)]: value,
      }))

      updateResumeDraft((draft) => {
        draft.education[index].highlights = mergeLocalizedLines(
          draft.education[index].highlights,
          locale,
          value,
        )
      })
    },
    [setDraftFieldValues, updateResumeDraft],
  )

  const addEducation = useCallback(() => {
    updateResumeDraft(
      (draft) => {
        draft.education.push(createEmptyEducation())
      },
      { syncDraftFields: true },
    )
    updateSortableCollection('education', (currentIds) => [
      ...currentIds,
      nextSortableId('education'),
    ])
  }, [nextSortableId, updateResumeDraft, updateSortableCollection])

  const removeEducation = useCallback(
    (index: number) => {
      updateResumeDraft(
        (draft) => {
          draft.education.splice(index, 1)
        },
        { syncDraftFields: true },
      )
      updateSortableCollection('education', (currentIds) =>
        currentIds.filter((_, currentIndex) => currentIndex !== index),
      )
    },
    [updateResumeDraft, updateSortableCollection],
  )

  const updateExperienceLocalizedField = useCallback(
    (
      index: number,
      field: keyof Pick<
        ResumeExperienceItem,
        'companyName' | 'role' | 'employmentType' | 'location' | 'summary'
      >,
      locale: 'zh' | 'en',
      value: string,
    ) => {
      updateResumeDraft((draft) => {
        draft.experiences[index][field][locale] = value
      })
    },
    [updateResumeDraft],
  )

  const updateExperiencePlainField = useCallback(
    (
      index: number,
      field: keyof Pick<ResumeExperienceItem, 'startDate' | 'endDate'>,
      value: string,
    ) => {
      updateResumeDraft((draft) => {
        draft.experiences[index][field] = value
      })
    },
    [updateResumeDraft],
  )

  const updateExperienceHighlights = useCallback(
    (index: number, locale: 'zh' | 'en', value: string) => {
      setDraftFieldValues((current) => ({
        ...current,
        [buildDraftFieldKey('experience', index, 'highlights', locale)]: value,
      }))

      updateResumeDraft((draft) => {
        draft.experiences[index].highlights = mergeLocalizedLines(
          draft.experiences[index].highlights,
          locale,
          value,
        )
      })
    },
    [setDraftFieldValues, updateResumeDraft],
  )

  const updateExperienceTechnologies = useCallback(
    (index: number, value: string) => {
      setDraftFieldValues((current) => ({
        ...current,
        [buildDraftFieldKey('experience', index, 'technologies')]: value,
      }))

      updateResumeDraft((draft) => {
        draft.experiences[index].technologies = parseCommaSeparatedValues(value)
      })
    },
    [setDraftFieldValues, updateResumeDraft],
  )

  const addExperience = useCallback(() => {
    updateResumeDraft(
      (draft) => {
        draft.experiences.push(createEmptyExperience())
      },
      { syncDraftFields: true },
    )
    updateSortableCollection('experiences', (currentIds) => [
      ...currentIds,
      nextSortableId('experiences'),
    ])
  }, [nextSortableId, updateResumeDraft, updateSortableCollection])

  const removeExperience = useCallback(
    (index: number) => {
      updateResumeDraft(
        (draft) => {
          draft.experiences.splice(index, 1)
        },
        { syncDraftFields: true },
      )
      updateSortableCollection('experiences', (currentIds) =>
        currentIds.filter((_, currentIndex) => currentIndex !== index),
      )
    },
    [updateResumeDraft, updateSortableCollection],
  )

  const updateProjectLocalizedField = useCallback(
    (
      index: number,
      field: keyof Pick<ResumeProjectItem, 'name' | 'role' | 'summary' | 'coreFunctions'>,
      locale: 'zh' | 'en',
      value: string,
    ) => {
      updateResumeDraft((draft) => {
        draft.projects[index][field][locale] = value
      })
    },
    [updateResumeDraft],
  )

  const updateProjectPlainField = useCallback(
    (
      index: number,
      field: keyof Pick<ResumeProjectItem, 'startDate' | 'endDate'>,
      value: string,
    ) => {
      updateResumeDraft((draft) => {
        draft.projects[index][field] = value
      })
    },
    [updateResumeDraft],
  )

  const updateProjectHighlights = useCallback(
    (index: number, locale: 'zh' | 'en', value: string) => {
      setDraftFieldValues((current) => ({
        ...current,
        [buildDraftFieldKey('project', index, 'highlights', locale)]: value,
      }))

      updateResumeDraft((draft) => {
        draft.projects[index].highlights = mergeLocalizedLines(
          draft.projects[index].highlights,
          locale,
          value,
        )
      })
    },
    [setDraftFieldValues, updateResumeDraft],
  )

  const updateProjectTechnologies = useCallback(
    (index: number, value: string) => {
      setDraftFieldValues((current) => ({
        ...current,
        [buildDraftFieldKey('project', index, 'technologies')]: value,
      }))

      updateResumeDraft((draft) => {
        draft.projects[index].technologies = parseCommaSeparatedValues(value)
      })
    },
    [setDraftFieldValues, updateResumeDraft],
  )

  const updateProjectLinkField = useCallback(
    (
      projectIndex: number,
      linkIndex: number,
      field: 'label' | 'url',
      value: string,
      locale?: 'zh' | 'en',
    ) => {
      updateResumeDraft((draft) => {
        if (field === 'url') {
          draft.projects[projectIndex].links[linkIndex].url = value
          return
        }

        draft.projects[projectIndex].links[linkIndex].label[locale ?? 'zh'] = value
      })
    },
    [updateResumeDraft],
  )

  const addProjectLink = useCallback(
    (projectIndex: number) => {
      updateResumeDraft((draft) => {
        draft.projects[projectIndex].links.push(createEmptyProfileLink())
      })
    },
    [updateResumeDraft],
  )

  const removeProjectLink = useCallback(
    (projectIndex: number, linkIndex: number) => {
      updateResumeDraft((draft) => {
        draft.projects[projectIndex].links.splice(linkIndex, 1)
      })
    },
    [updateResumeDraft],
  )

  const addProject = useCallback(() => {
    updateResumeDraft(
      (draft) => {
        draft.projects.push(createEmptyProject())
      },
      { syncDraftFields: true },
    )
    updateSortableCollection('projects', (currentIds) => [
      ...currentIds,
      nextSortableId('projects'),
    ])
  }, [nextSortableId, updateResumeDraft, updateSortableCollection])

  const removeProject = useCallback(
    (index: number) => {
      updateResumeDraft(
        (draft) => {
          draft.projects.splice(index, 1)
        },
        { syncDraftFields: true },
      )
      updateSortableCollection('projects', (currentIds) =>
        currentIds.filter((_, currentIndex) => currentIndex !== index),
      )
    },
    [updateResumeDraft, updateSortableCollection],
  )

  const updateSkillLocalizedField = useCallback(
    (index: number, locale: 'zh' | 'en', value: string) => {
      updateResumeDraft((draft) => {
        draft.skills[index].name[locale] = value
      })
    },
    [updateResumeDraft],
  )

  const updateSkillKeywords = useCallback(
    (index: number, value: string) => {
      setDraftFieldValues((current) => ({
        ...current,
        [buildDraftFieldKey('skill', index, 'keywords')]: value,
      }))

      updateResumeDraft((draft) => {
        draft.skills[index].keywords = parseLineSeparatedValues(value)
      })
    },
    [setDraftFieldValues, updateResumeDraft],
  )

  const updateSkillProficiency = useCallback(
    (index: number, value: string) => {
      const trimmedValue = value.trim()
      const proficiency = Number(trimmedValue)

      updateResumeDraft((draft) => {
        draft.skills[index].proficiency = trimmedValue !== '' && Number.isFinite(proficiency)
          ? Math.min(100, Math.max(0, Math.round(proficiency)))
          : undefined
      })
    },
    [updateResumeDraft],
  )

  const addSkillGroup = useCallback(() => {
    updateResumeDraft(
      (draft) => {
        draft.skills.push(createEmptySkillGroup())
      },
      { syncDraftFields: true },
    )
    updateSortableCollection('skills', (currentIds) => [
      ...currentIds,
      nextSortableId('skills'),
    ])
  }, [nextSortableId, updateResumeDraft, updateSortableCollection])

  const removeSkillGroup = useCallback(
    (index: number) => {
      updateResumeDraft(
        (draft) => {
          draft.skills.splice(index, 1)
        },
        { syncDraftFields: true },
      )
      updateSortableCollection('skills', (currentIds) =>
        currentIds.filter((_, currentIndex) => currentIndex !== index),
      )
    },
    [updateResumeDraft, updateSortableCollection],
  )

  const updateHighlightLocalizedField = useCallback(
    (
      index: number,
      field: keyof Pick<ResumeHighlightItem, 'title' | 'description'>,
      locale: 'zh' | 'en',
      value: string,
    ) => {
      updateResumeDraft((draft) => {
        draft.highlights[index][field][locale] = value
      })
    },
    [updateResumeDraft],
  )

  const addHighlight = useCallback(() => {
    updateResumeDraft((draft) => {
      draft.highlights.push(createEmptyHighlight())
    })
    updateSortableCollection('highlights', (currentIds) => [
      ...currentIds,
      nextSortableId('highlights'),
    ])
  }, [nextSortableId, updateResumeDraft, updateSortableCollection])

  const removeHighlight = useCallback(
    (index: number) => {
      updateResumeDraft((draft) => {
        draft.highlights.splice(index, 1)
      })
      updateSortableCollection('highlights', (currentIds) =>
        currentIds.filter((_, currentIndex) => currentIndex !== index),
      )
    },
    [updateResumeDraft, updateSortableCollection],
  )

  return {
    addEducation,
    addExperience,
    addHighlight,
    addProfileInterest,
    addProfileLink,
    addProject,
    addProjectLink,
    addSkillGroup,
    removeEducation,
    removeExperience,
    removeHighlight,
    removeProfileInterest,
    removeProfileLink,
    removeProject,
    removeProjectLink,
    removeSkillGroup,
    updateEducationHighlights,
    updateEducationLocalizedField,
    updateEducationPlainField,
    updateExperienceHighlights,
    updateExperienceLocalizedField,
    updateExperiencePlainField,
    updateExperienceTechnologies,
    updateHighlightLocalizedField,
    updateProfileHeroField,
    updateProfileHeroSlogans,
    updateProfileInterestField,
    updateProfileLinkField,
    updateProfileLocalizedField,
    updateProfilePlainField,
    updateProjectHighlights,
    updateProjectLinkField,
    updateProjectLocalizedField,
    updateProjectPlainField,
    updateProjectTechnologies,
    updateSkillKeywords,
    updateSkillLocalizedField,
    updateSkillProficiency,
  }
}
