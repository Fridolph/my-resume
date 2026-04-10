'use client'

import { DndContext, closestCenter } from '@dnd-kit/core'
import { restrictToVerticalAxis } from '@dnd-kit/modifiers'
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable'
import { Input } from '@heroui/react'
import {
  buildDraftFieldKey,
  formatLocalizedLines,
} from '../editor/draft-editor-helpers'
import {
  buildEntryActions,
  EditorEntry,
  EditorSection,
  IconActionButton,
  LocalizedEditorField,
  PlusIcon,
  SortableItemShell,
  TrashIcon,
} from '../editor/editor-primitives'
import type { EducationSectionProps } from '../types/education-section.types'

export function EducationSection({
  draftFieldValues,
  editorLocaleMode,
  isTranslationMode,
  resumeDraft,
  sensors,
  sortableCollections,
  translationAction,
  addEducation,
  handleDragEnd,
  removeEducation,
  updateEducationHighlights,
  updateEducationLocalizedField,
  updateEducationPlainField,
}: EducationSectionProps) {
  return (
    <EditorSection
      action={
        isTranslationMode ? (
          translationAction
        ) : (
          <IconActionButton
            icon={<PlusIcon />}
            label="添加教育经历"
            onClick={addEducation}
          />
        )
      }
      count={resumeDraft.education.length}
      description={
        isTranslationMode
          ? '英文翻译工作区集中维护学校、学位、专业、地点和教育亮点的英文内容。'
          : '补齐学校、学历、专业、时间、地点与教育亮点的双语维护。'
      }
      title="教育经历">
      {resumeDraft.education.length === 0 ? (
        <div className="status-box">
          <strong>当前还没有教育经历</strong>
          <span>可先新增一段教育经历，再继续补学校、学历和亮点。</span>
        </div>
      ) : null}

      <DndContext
        collisionDetection={closestCenter}
        modifiers={[restrictToVerticalAxis]}
        onDragEnd={handleDragEnd}
        sensors={sensors}>
        <SortableContext
          items={sortableCollections.education}
          strategy={verticalListSortingStrategy}>
          <div className="grid gap-4">
            {resumeDraft.education.map((education, index) => (
              <SortableItemShell
                disabled={isTranslationMode}
                dragHandleLabel={`拖拽排序教育经历 ${index + 1}`}
                id={sortableCollections.education[index] ?? `education-${index}`}
                key={sortableCollections.education[index] ?? `education-${index}`}>
                {({ dragHandle, isDragging }) => (
                  <div className={isDragging ? 'rounded-[24px]' : undefined}>
                    <EditorEntry
                      action={buildEntryActions({
                        deleteAction: !isTranslationMode ? (
                          <IconActionButton
                            icon={<TrashIcon />}
                            label={`删除教育经历 ${index + 1}`}
                            onClick={() => removeEducation(index)}
                            tone="danger"
                            variant="ghost"
                          />
                        ) : null,
                        dragHandle,
                      })}
                      defaultExpanded={
                        resumeDraft.education.length === 1 ||
                        index === resumeDraft.education.length - 1
                      }
                      summary={
                        education.schoolName.zh ||
                        education.schoolName.en ||
                        '未命名教育经历'
                      }
                      title={`教育经历 ${index + 1}`}
                      toggleLabel={`教育经历 ${index + 1} 条目开关`}
                      variant="embedded">
                      <div className="grid gap-4 md:grid-cols-2">
                        <LocalizedEditorField
                          label={`教育经历 ${index + 1} 学校`}
                          localeMode={editorLocaleMode}
                          onChange={(value) =>
                            updateEducationLocalizedField(
                              index,
                              'schoolName',
                              editorLocaleMode,
                              value,
                            )
                          }
                          sourceValue={education.schoolName.zh}
                          value={education.schoolName[editorLocaleMode]}
                        />
                        <LocalizedEditorField
                          label={`教育经历 ${index + 1} 学位`}
                          localeMode={editorLocaleMode}
                          onChange={(value) =>
                            updateEducationLocalizedField(
                              index,
                              'degree',
                              editorLocaleMode,
                              value,
                            )
                          }
                          sourceValue={education.degree.zh}
                          value={education.degree[editorLocaleMode]}
                        />
                        <LocalizedEditorField
                          label={`教育经历 ${index + 1} 专业`}
                          localeMode={editorLocaleMode}
                          onChange={(value) =>
                            updateEducationLocalizedField(
                              index,
                              'fieldOfStudy',
                              editorLocaleMode,
                              value,
                            )
                          }
                          sourceValue={education.fieldOfStudy.zh}
                          value={education.fieldOfStudy[editorLocaleMode]}
                        />
                        {!isTranslationMode ? (
                          <>
                            <label className="field">
                              <span>{`教育经历 ${index + 1} 开始时间`}</span>
                              <Input
                                fullWidth
                                onChange={(event) =>
                                  updateEducationPlainField(
                                    index,
                                    'startDate',
                                    event.target.value,
                                  )
                                }
                                value={education.startDate}
                                variant="secondary"
                              />
                            </label>
                            <label className="field">
                              <span>{`教育经历 ${index + 1} 结束时间`}</span>
                              <Input
                                fullWidth
                                onChange={(event) =>
                                  updateEducationPlainField(
                                    index,
                                    'endDate',
                                    event.target.value,
                                  )
                                }
                                value={education.endDate}
                                variant="secondary"
                              />
                            </label>
                          </>
                        ) : null}
                        <LocalizedEditorField
                          label={`教育经历 ${index + 1} 地点`}
                          localeMode={editorLocaleMode}
                          onChange={(value) =>
                            updateEducationLocalizedField(
                              index,
                              'location',
                              editorLocaleMode,
                              value,
                            )
                          }
                          sourceValue={education.location.zh}
                          value={education.location[editorLocaleMode]}
                        />
                      </div>

                      <LocalizedEditorField
                        label={`教育经历 ${index + 1} 亮点（每行一条）`}
                        localeMode={editorLocaleMode}
                        onChange={(value) =>
                          updateEducationHighlights(index, editorLocaleMode, value)
                        }
                        rows={4}
                        sourceValue={formatLocalizedLines(education.highlights, 'zh')}
                        value={
                          draftFieldValues[
                            buildDraftFieldKey(
                              'education',
                              index,
                              'highlights',
                              editorLocaleMode,
                            )
                          ] ??
                          formatLocalizedLines(education.highlights, editorLocaleMode)
                        }
                        variant="textarea"
                      />
                    </EditorEntry>
                  </div>
                )}
              </SortableItemShell>
            ))}
          </div>
        </SortableContext>
      </DndContext>
    </EditorSection>
  )
}
