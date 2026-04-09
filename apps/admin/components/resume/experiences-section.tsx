'use client'

import { DndContext, closestCenter, type DragEndEvent } from '@dnd-kit/core'
import { restrictToVerticalAxis } from '@dnd-kit/modifiers'
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable'
import { Input } from '@heroui/react'
import type { ComponentProps, ReactNode } from 'react'

import type { StandardResume } from '../../lib/resume-types'
import {
  buildDraftFieldKey,
  formatCommaSeparatedValues,
  formatLocalizedLines,
  type DraftFieldValues,
  type EditorLocaleMode,
  type SortableCollectionState,
} from './draft-editor-helpers'
import {
  buildEntryActions,
  EditorEntry,
  EditorSection,
  IconActionButton,
  LocalizedEditorField,
  PlusIcon,
  SortableItemShell,
  TrashIcon,
} from './editor-primitives'

interface ExperiencesSectionProps {
  draftFieldValues: DraftFieldValues
  editorLocaleMode: EditorLocaleMode
  isTranslationMode: boolean
  resumeDraft: StandardResume
  sensors: ComponentProps<typeof DndContext>['sensors']
  sortableCollections: SortableCollectionState
  translationAction?: ReactNode
  addExperience: () => void
  handleDragEnd: (event: DragEndEvent) => void
  removeExperience: (index: number) => void
  updateExperienceHighlights: (index: number, locale: 'zh' | 'en', value: string) => void
  updateExperienceLocalizedField: (
    index: number,
    field: 'companyName' | 'role' | 'employmentType' | 'location' | 'summary',
    locale: 'zh' | 'en',
    value: string,
  ) => void
  updateExperiencePlainField: (
    index: number,
    field: 'startDate' | 'endDate',
    value: string,
  ) => void
  updateExperienceTechnologies: (index: number, value: string) => void
}

export function ExperiencesSection({
  draftFieldValues,
  editorLocaleMode,
  isTranslationMode,
  resumeDraft,
  sensors,
  sortableCollections,
  translationAction,
  addExperience,
  handleDragEnd,
  removeExperience,
  updateExperienceHighlights,
  updateExperienceLocalizedField,
  updateExperiencePlainField,
  updateExperienceTechnologies,
}: ExperiencesSectionProps) {
  return (
    <EditorSection
      action={
        isTranslationMode ? (
          translationAction
        ) : (
          <IconActionButton
            icon={<PlusIcon />}
            label="添加工作经历"
            onClick={addExperience}
          />
        )
      }
      count={resumeDraft.experiences.length}
      description={
        isTranslationMode
          ? '英文翻译工作区只维护公司、岗位、类型、地点、摘要和亮点的英文内容。'
          : '优先开放公司、岗位、时间、摘要、亮点和技术栈，满足岗位定向调整的主需求。'
      }
      title="工作经历">
      {resumeDraft.experiences.length === 0 ? (
        <div className="status-box">
          <strong>当前还没有工作经历</strong>
          <span>可先新增一段经历，再继续补公司、岗位、亮点和技术栈。</span>
        </div>
      ) : null}

      <DndContext
        collisionDetection={closestCenter}
        modifiers={[restrictToVerticalAxis]}
        onDragEnd={handleDragEnd}
        sensors={sensors}>
        <SortableContext
          items={sortableCollections.experiences}
          strategy={verticalListSortingStrategy}>
          <div className="grid gap-4">
            {resumeDraft.experiences.map((experience, index) => (
              <SortableItemShell
                disabled={isTranslationMode}
                dragHandleLabel={`拖拽排序工作经历 ${index + 1}`}
                id={sortableCollections.experiences[index] ?? `experience-${index}`}
                key={sortableCollections.experiences[index] ?? `experience-${index}`}>
                {({ dragHandle }) => (
                  <EditorEntry
                    action={buildEntryActions({
                      deleteAction: !isTranslationMode ? (
                        <IconActionButton
                          icon={<TrashIcon />}
                          label={`删除工作经历 ${index + 1}`}
                          onClick={() => removeExperience(index)}
                          tone="danger"
                          variant="ghost"
                        />
                      ) : null,
                      dragHandle,
                    })}
                    defaultExpanded={
                      resumeDraft.experiences.length === 1 ||
                      index === resumeDraft.experiences.length - 1
                    }
                    summary={
                      experience.companyName.zh ||
                      experience.companyName.en ||
                      '未命名工作经历'
                    }
                    title={`工作经历 ${index + 1}`}
                    toggleLabel={`工作经历 ${index + 1} 条目开关`}
                    variant="embedded">
                    <div className="grid gap-4 md:grid-cols-2">
                      <LocalizedEditorField
                        label={`工作经历 ${index + 1} 公司`}
                        localeMode={editorLocaleMode}
                        onChange={(value) =>
                          updateExperienceLocalizedField(
                            index,
                            'companyName',
                            editorLocaleMode,
                            value,
                          )
                        }
                        sourceValue={experience.companyName.zh}
                        value={experience.companyName[editorLocaleMode]}
                      />
                      <LocalizedEditorField
                        label={`工作经历 ${index + 1} 岗位`}
                        localeMode={editorLocaleMode}
                        onChange={(value) =>
                          updateExperienceLocalizedField(
                            index,
                            'role',
                            editorLocaleMode,
                            value,
                          )
                        }
                        sourceValue={experience.role.zh}
                        value={experience.role[editorLocaleMode]}
                      />
                      <LocalizedEditorField
                        label={`工作经历 ${index + 1} 类型`}
                        localeMode={editorLocaleMode}
                        onChange={(value) =>
                          updateExperienceLocalizedField(
                            index,
                            'employmentType',
                            editorLocaleMode,
                            value,
                          )
                        }
                        sourceValue={experience.employmentType.zh}
                        value={experience.employmentType[editorLocaleMode]}
                      />
                      {!isTranslationMode ? (
                        <>
                          <label className="field">
                            <span>{`工作经历 ${index + 1} 开始时间`}</span>
                            <Input
                              fullWidth
                              onChange={(event) =>
                                updateExperiencePlainField(
                                  index,
                                  'startDate',
                                  event.target.value,
                                )
                              }
                              value={experience.startDate}
                              variant="secondary"
                            />
                          </label>
                          <label className="field">
                            <span>{`工作经历 ${index + 1} 结束时间`}</span>
                            <Input
                              fullWidth
                              onChange={(event) =>
                                updateExperiencePlainField(
                                  index,
                                  'endDate',
                                  event.target.value,
                                )
                              }
                              value={experience.endDate}
                              variant="secondary"
                            />
                          </label>
                        </>
                      ) : null}
                      <LocalizedEditorField
                        label={`工作经历 ${index + 1} 地点`}
                        localeMode={editorLocaleMode}
                        onChange={(value) =>
                          updateExperienceLocalizedField(
                            index,
                            'location',
                            editorLocaleMode,
                            value,
                          )
                        }
                        sourceValue={experience.location.zh}
                        value={experience.location[editorLocaleMode]}
                      />
                    </div>

                    <LocalizedEditorField
                      label={`工作经历 ${index + 1} 摘要`}
                      localeMode={editorLocaleMode}
                      onChange={(value) =>
                        updateExperienceLocalizedField(
                          index,
                          'summary',
                          editorLocaleMode,
                          value,
                        )
                      }
                      rows={4}
                      sourceValue={experience.summary.zh}
                      value={experience.summary[editorLocaleMode]}
                      variant="textarea"
                    />

                    <LocalizedEditorField
                      label={`工作经历 ${index + 1} 亮点（每行一条）`}
                      localeMode={editorLocaleMode}
                      onChange={(value) =>
                        updateExperienceHighlights(index, editorLocaleMode, value)
                      }
                      rows={5}
                      sourceValue={formatLocalizedLines(experience.highlights, 'zh')}
                      value={
                        draftFieldValues[
                          buildDraftFieldKey(
                            'experience',
                            index,
                            'highlights',
                            editorLocaleMode,
                          )
                        ] ?? formatLocalizedLines(experience.highlights, editorLocaleMode)
                      }
                      variant="textarea"
                    />

                    {!isTranslationMode ? (
                      <label className="field">
                        <span>{`工作经历 ${index + 1} 技术栈（逗号分隔）`}</span>
                        <Input
                          fullWidth
                          onChange={(event) =>
                            updateExperienceTechnologies(index, event.target.value)
                          }
                          value={
                            draftFieldValues[
                              buildDraftFieldKey('experience', index, 'technologies')
                            ] ?? formatCommaSeparatedValues(experience.technologies)
                          }
                          variant="secondary"
                        />
                      </label>
                    ) : null}
                  </EditorEntry>
                )}
              </SortableItemShell>
            ))}
          </div>
        </SortableContext>
      </DndContext>
    </EditorSection>
  )
}
