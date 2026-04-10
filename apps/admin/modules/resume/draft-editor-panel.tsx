'use client'

import {
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Chip,
} from '@heroui/react'
import type { FormEvent } from 'react'

import { adminPrimaryButtonClass } from '../../core/button-styles'
import { ensureDraftResume } from '../../core/admin-resource-store'
import { updateDraftResume } from './services/resume-draft-api'
import { EducationSection } from './sections/education-section'
import { ExperiencesSection } from './sections/experiences-section'
import { ProfileSection } from './sections/profile-section'
import { ProjectsSection } from './sections/projects-section'
import { submitDraftResume } from './editor/resume-draft-editor-submit'
import { HighlightsSection, SkillsSection } from './sections/skills-highlights-sections'
import type { ResumeDraftEditorPanelProps } from './types/draft-editor-panel.types'
import { useResumeDraftEditorState } from './hooks/use-resume-draft-editor-state'
import { useResumeDraftSectionActions } from './hooks/use-resume-draft-section-actions'
import { useResumeDraftTranslationActions } from './hooks/use-resume-draft-translation-actions'

/**
 * 草稿编辑器主容器负责串起加载、编辑、翻译工作区、排序与保存提交流程
 *
 * @param apiBaseUrl 当前后台访问的 API 基地址
 * @param accessToken 当前登录会话的访问令牌
 * @param canEdit 当前角色是否具备草稿编辑权限
 * @param loadDraft 草稿加载函数
 * @param saveDraft 草稿保存函数
 * @returns 草稿编辑器节点
 */
export function ResumeDraftEditorPanel({
  apiBaseUrl,
  accessToken,
  canEdit,
  loadDraft = ensureDraftResume,
  saveDraft = updateDraftResume,
}: ResumeDraftEditorPanelProps) {
  const {
    draftFieldValues,
    draftSnapshot,
    editorLocaleMode,
    errorMessage,
    feedbackMessage,
    handleCollectionDragEnd,
    hydrateDraft,
    isTranslationMode,
    lastUpdatedLabel,
    nextSortableId,
    pendingSave,
    resumeDraft,
    sensors,
    setDraftFieldValues,
    setEditorLocaleMode,
    setErrorMessage,
    setFeedbackMessage,
    setPendingSave,
    sortableCollections,
    status,
    retryLoadDraft,
    updateResumeDraft,
    updateSortableCollection,
  } = useResumeDraftEditorState({
    accessToken,
    apiBaseUrl,
    canEdit,
    loadDraft,
  })

  const {
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
  } = useResumeDraftSectionActions({
    nextSortableId,
    setDraftFieldValues,
    updateResumeDraft,
    updateSortableCollection,
  })

  const {
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
  } = useResumeDraftTranslationActions({
    isTranslationMode,
    setErrorMessage,
    setFeedbackMessage,
    updateResumeDraft,
  })

  /**
   * 提交当前工作副本：把本地编辑态转换回服务端草稿快照，并刷新页面基线状态
   *
   * @param event 表单提交事件
   * @returns 保存链路完成后的 Promise
   */
  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    if (!draftSnapshot || !resumeDraft) {
      return
    }

    setPendingSave(true)
    setErrorMessage(null)
    setFeedbackMessage(null)

    try {
      // 保存成功后用服务端新快照回填，让前端工作副本与远端基线重新对齐
      const nextSnapshot = await submitDraftResume({
        apiBaseUrl,
        accessToken,
        resumeDraft,
        saveDraft,
      })
      hydrateDraft(nextSnapshot)
      setFeedbackMessage('草稿已保存。公开站内容不会自动变化，仍需手动发布。')
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : '草稿保存失败，请稍后重试')
    } finally {
      setPendingSave(false)
    }
  }

  if (!canEdit) {
    return (
      <Card className="border border-zinc-200/70 dark:border-zinc-800">
        <CardHeader className="flex flex-col items-start gap-2">
          <p className="eyebrow">草稿编辑</p>
          <CardTitle>当前角色只读</CardTitle>
          <CardDescription>只有管理员可读取并保存草稿。</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="readonly-box">
            当前账号没有草稿编辑权限，后台仅展示角色与导出入口。
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="border border-zinc-200/70 dark:border-zinc-800">
      <CardHeader className="flex flex-col items-start gap-1.5 px-4 py-4 sm:px-5 md:gap-2">
        <p className="eyebrow">草稿编辑</p>
        <CardTitle className="text-[1.2rem] sm:text-[1.35rem]">
          完整标准简历模块编辑
        </CardTitle>
        <CardDescription className="text-sm leading-6">
          当前后台已按标准简历模型接通基础信息、教育、工作、项目、技能与亮点编辑，并改成“中文主编辑
          + 英文翻译工作区”的维护方式，保存后仍需手动发布。
        </CardDescription>
      </CardHeader>
      <CardContent className="grid gap-3 px-4 pb-4 sm:px-5 md:gap-4">
        {status === 'loading' ? (
          <div className="grid gap-2">
            <div className="h-4 animate-pulse rounded-md bg-zinc-200/80 dark:bg-zinc-800/80" />
            <div className="h-4 animate-pulse rounded-md bg-zinc-200/80 dark:bg-zinc-800/80" />
            <div className="h-4 w-2/3 animate-pulse rounded-md bg-zinc-200/80 dark:bg-zinc-800/80" />
          </div>
        ) : null}

        {status === 'error' && errorMessage ? (
          <div className="grid gap-3">
            <p className="error-text">{errorMessage}</p>
            <Button
              className="w-fit"
              onPress={retryLoadDraft}
              size="sm"
              variant="secondary">
              重试草稿加载
            </Button>
          </div>
        ) : null}

        {status === 'ready' && resumeDraft && draftSnapshot ? (
          <form
            className="grid gap-3 md:gap-4"
            onSubmit={(event) => void handleSubmit(event)}>
            <div className="flex flex-col gap-2.5 rounded-[20px] border border-zinc-200/70 bg-zinc-50/90 px-4 py-3.5 dark:border-zinc-800 dark:bg-zinc-900/60 md:flex-row md:items-center md:justify-between md:gap-3 md:rounded-[24px] md:px-5 md:py-4">
              <div className="space-y-0.5 md:space-y-1">
                <strong className="block text-sm text-zinc-950 dark:text-white">
                  草稿态与发布态分离
                </strong>
                <span className="text-sm leading-5 text-zinc-500 dark:text-zinc-400 md:leading-6">
                  保存只会更新后台草稿，公开站仍读取最近一次手动发布的版本。
                </span>
              </div>
              {lastUpdatedLabel ? (
                <Chip size="sm">
                  最近保存：
                  {lastUpdatedLabel}
                </Chip>
              ) : null}
            </div>

            <div className="flex flex-col gap-3 rounded-[20px] border border-zinc-200/70 bg-white/90 px-4 py-3.5 dark:border-zinc-800 dark:bg-zinc-950/70 md:flex-row md:items-center md:justify-between md:gap-4 md:rounded-[24px] md:px-5 md:py-4">
              <div className="space-y-0.5 md:space-y-1">
                <strong className="block text-sm text-zinc-950 dark:text-white">
                  {isTranslationMode ? '英文翻译工作区' : '中文主编辑'}
                </strong>
                <p className="text-sm leading-5 text-zinc-500 dark:text-zinc-400 md:leading-6">
                  {isTranslationMode
                    ? '这里集中维护所有英文字段。条目增删、时间、技术栈、链接地址等结构性信息仍回到中文主编辑处理。'
                    : '中文主编辑负责维护主文案与结构字段。英文字段改到独立翻译工作区，避免继续双列直填。'}
                </p>
              </div>
              <div
                aria-label="编辑模式切换"
                className="inline-flex w-full rounded-full border border-zinc-200/80 bg-zinc-50 p-1 dark:border-zinc-800 dark:bg-zinc-900/70 md:w-auto"
                role="tablist">
                <Button
                  aria-selected={editorLocaleMode === 'zh'}
                  className="h-9 flex-1 px-3 text-sm md:h-10 md:flex-none"
                  onClick={() => setEditorLocaleMode('zh')}
                  size="sm"
                  type="button"
                  variant={editorLocaleMode === 'zh' ? 'primary' : 'ghost'}>
                  中文主编辑
                </Button>
                <Button
                  aria-selected={editorLocaleMode === 'en'}
                  className="h-9 flex-1 px-3 text-sm md:h-10 md:flex-none"
                  onClick={() => setEditorLocaleMode('en')}
                  size="sm"
                  type="button"
                  variant={editorLocaleMode === 'en' ? 'primary' : 'ghost'}>
                  英文翻译工作区
                </Button>
              </div>
            </div>

            <ProfileSection
              addProfileInterest={addProfileInterest}
              addProfileLink={addProfileLink}
              draftFieldValues={draftFieldValues}
              editorLocaleMode={editorLocaleMode}
              handleProfileInterestsDragEnd={(event) =>
                handleCollectionDragEnd('profileInterests', event)
              }
              handleProfileLinksDragEnd={(event) =>
                handleCollectionDragEnd('profileLinks', event)
              }
              isTranslationMode={isTranslationMode}
              removeProfileInterest={removeProfileInterest}
              removeProfileLink={removeProfileLink}
              resumeDraft={resumeDraft}
              sensors={sensors}
              sortableCollections={sortableCollections}
              translationAction={renderTranslationActions('基础信息', {
                onCopy: copyProfileTranslations,
                onClear: clearProfileTranslations,
              })}
              updateProfileHeroField={updateProfileHeroField}
              updateProfileHeroSlogans={updateProfileHeroSlogans}
              updateProfileInterestField={updateProfileInterestField}
              updateProfileLinkField={updateProfileLinkField}
              updateProfileLocalizedField={updateProfileLocalizedField}
              updateProfilePlainField={updateProfilePlainField}
            />

            <EducationSection
              addEducation={addEducation}
              draftFieldValues={draftFieldValues}
              editorLocaleMode={editorLocaleMode}
              handleDragEnd={(event) => handleCollectionDragEnd('education', event)}
              isTranslationMode={isTranslationMode}
              removeEducation={removeEducation}
              resumeDraft={resumeDraft}
              sensors={sensors}
              sortableCollections={sortableCollections}
              translationAction={renderTranslationActions('教育经历', {
                onCopy: copyEducationTranslations,
                onClear: clearEducationTranslations,
              })}
              updateEducationHighlights={updateEducationHighlights}
              updateEducationLocalizedField={updateEducationLocalizedField}
              updateEducationPlainField={updateEducationPlainField}
            />

            <ExperiencesSection
              addExperience={addExperience}
              draftFieldValues={draftFieldValues}
              editorLocaleMode={editorLocaleMode}
              handleDragEnd={(event) => handleCollectionDragEnd('experiences', event)}
              isTranslationMode={isTranslationMode}
              removeExperience={removeExperience}
              resumeDraft={resumeDraft}
              sensors={sensors}
              sortableCollections={sortableCollections}
              translationAction={renderTranslationActions('工作经历', {
                onCopy: copyExperienceTranslations,
                onClear: clearExperienceTranslations,
              })}
              updateExperienceHighlights={updateExperienceHighlights}
              updateExperienceLocalizedField={updateExperienceLocalizedField}
              updateExperiencePlainField={updateExperiencePlainField}
              updateExperienceTechnologies={updateExperienceTechnologies}
            />

            <ProjectsSection
              addProject={addProject}
              addProjectLink={addProjectLink}
              draftFieldValues={draftFieldValues}
              editorLocaleMode={editorLocaleMode}
              handleDragEnd={(event) => handleCollectionDragEnd('projects', event)}
              isTranslationMode={isTranslationMode}
              removeProject={removeProject}
              removeProjectLink={removeProjectLink}
              resumeDraft={resumeDraft}
              sensors={sensors}
              sortableCollections={sortableCollections}
              translationAction={renderTranslationActions('项目经历', {
                onCopy: copyProjectTranslations,
                onClear: clearProjectTranslations,
              })}
              updateProjectHighlights={updateProjectHighlights}
              updateProjectLinkField={updateProjectLinkField}
              updateProjectLocalizedField={updateProjectLocalizedField}
              updateProjectPlainField={updateProjectPlainField}
              updateProjectTechnologies={updateProjectTechnologies}
            />

            <SkillsSection
              addSkillGroup={addSkillGroup}
              draftFieldValues={draftFieldValues}
              editorLocaleMode={editorLocaleMode}
              handleDragEnd={(event) => handleCollectionDragEnd('skills', event)}
              isTranslationMode={isTranslationMode}
              removeSkillGroup={removeSkillGroup}
              resumeDraft={resumeDraft}
              sensors={sensors}
              sortableCollections={sortableCollections}
              translationAction={renderTranslationActions('技能组', {
                onCopy: copySkillTranslations,
                onClear: clearSkillTranslations,
              })}
              updateSkillKeywords={updateSkillKeywords}
              updateSkillLocalizedField={updateSkillLocalizedField}
            />

            <HighlightsSection
              addHighlight={addHighlight}
              editorLocaleMode={editorLocaleMode}
              handleDragEnd={(event) => handleCollectionDragEnd('highlights', event)}
              isTranslationMode={isTranslationMode}
              removeHighlight={removeHighlight}
              resumeDraft={resumeDraft}
              sensors={sensors}
              sortableCollections={sortableCollections}
              translationAction={renderTranslationActions('亮点', {
                onCopy: copyHighlightTranslations,
                onClear: clearHighlightTranslations,
              })}
              updateHighlightLocalizedField={updateHighlightLocalizedField}
            />

            {errorMessage ? <p className="error-text">{errorMessage}</p> : null}
            {feedbackMessage ? (
              <div className="dashboard-inline-note">{feedbackMessage}</div>
            ) : null}

            <Button
              className={adminPrimaryButtonClass}
              fullWidth
              isDisabled={pendingSave}
              size="md"
              type="submit"
              variant="primary">
              {pendingSave ? '保存中...' : '保存当前草稿'}
            </Button>
          </form>
        ) : null}
      </CardContent>
    </Card>
  )
}
