'use client';

import { DndContext, closestCenter, type DragEndEvent } from '@dnd-kit/core';
import { restrictToVerticalAxis } from '@dnd-kit/modifiers';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { Input } from '@heroui/react';
import type { ComponentProps, ReactNode } from 'react';

import type { StandardResume } from '../../lib/resume-types';
import {
  buildDraftFieldKey,
  formatCommaSeparatedValues,
  formatLocalizedLines,
  type DraftFieldValues,
  type EditorLocaleMode,
  type SortableCollectionState,
} from './draft-editor-helpers';
import {
  buildEntryActions,
  EditorEntry,
  EditorSection,
  IconActionButton,
  LocalizedEditorField,
  PlusIcon,
  SortableItemShell,
  TrashIcon,
} from './editor-primitives';

interface ProjectsSectionProps {
  draftFieldValues: DraftFieldValues;
  editorLocaleMode: EditorLocaleMode;
  isTranslationMode: boolean;
  resumeDraft: StandardResume;
  sensors: ComponentProps<typeof DndContext>['sensors'];
  sortableCollections: SortableCollectionState;
  translationAction?: ReactNode;
  addProject: () => void;
  addProjectLink: (projectIndex: number) => void;
  handleDragEnd: (event: DragEndEvent) => void;
  removeProject: (index: number) => void;
  removeProjectLink: (projectIndex: number, linkIndex: number) => void;
  updateProjectHighlights: (index: number, locale: 'zh' | 'en', value: string) => void;
  updateProjectLinkField: (
    projectIndex: number,
    linkIndex: number,
    field: 'label' | 'url',
    value: string,
    locale?: 'zh' | 'en',
  ) => void;
  updateProjectLocalizedField: (
    index: number,
    field: 'name' | 'role' | 'summary',
    locale: 'zh' | 'en',
    value: string,
  ) => void;
  updateProjectPlainField: (
    index: number,
    field: 'startDate' | 'endDate',
    value: string,
  ) => void;
  updateProjectTechnologies: (index: number, value: string) => void;
}

export function ProjectsSection({
  draftFieldValues,
  editorLocaleMode,
  isTranslationMode,
  resumeDraft,
  sensors,
  sortableCollections,
  translationAction,
  addProject,
  addProjectLink,
  handleDragEnd,
  removeProject,
  removeProjectLink,
  updateProjectHighlights,
  updateProjectLinkField,
  updateProjectLocalizedField,
  updateProjectPlainField,
  updateProjectTechnologies,
}: ProjectsSectionProps) {
  return (
    <EditorSection
      action={
        isTranslationMode
          ? translationAction
          : (
            <IconActionButton
              icon={<PlusIcon />}
              label="添加项目经历"
              onClick={addProject}
            />
            )
      }
      count={resumeDraft.projects.length}
      description={
        isTranslationMode
          ? '英文翻译工作区只维护项目名称、角色、摘要、亮点与链接标签的英文内容。'
          : '当前已接通项目名称、角色、时间、摘要、亮点、技术栈与项目链接，保持与公开展示结构一致。'
      }
      title="项目经历"
    >
      {resumeDraft.projects.length === 0 ? (
        <div className="status-box">
          <strong>当前还没有项目经历</strong>
          <span>可先新增一个项目，再补摘要、亮点和技术栈。</span>
        </div>
      ) : null}

      <DndContext
        collisionDetection={closestCenter}
        modifiers={[restrictToVerticalAxis]}
        onDragEnd={handleDragEnd}
        sensors={sensors}
      >
        <SortableContext
          items={sortableCollections.projects}
          strategy={verticalListSortingStrategy}
        >
          <div className="grid gap-4">
            {resumeDraft.projects.map((project, index) => (
              <SortableItemShell
                disabled={isTranslationMode}
                dragHandleLabel={`拖拽排序项目经历 ${index + 1}`}
                id={sortableCollections.projects[index] ?? `project-${index}`}
                key={sortableCollections.projects[index] ?? `project-${index}`}
              >
                {({ dragHandle }) => (
                  <EditorEntry
                    action={buildEntryActions({
                      deleteAction: !isTranslationMode ? (
                        <IconActionButton
                          icon={<TrashIcon />}
                          label={`删除项目经历 ${index + 1}`}
                          onClick={() => removeProject(index)}
                          tone="danger"
                          variant="ghost"
                        />
                      ) : null,
                      dragHandle,
                    })}
                    defaultExpanded={
                      resumeDraft.projects.length === 1 ||
                      index === resumeDraft.projects.length - 1
                    }
                    summary={project.name.zh || project.name.en || '未命名项目'}
                    title={`项目经历 ${index + 1}`}
                    toggleLabel={`项目经历 ${index + 1} 条目开关`}
                    variant="embedded"
                  >
                    <div className="grid gap-4 md:grid-cols-2">
                      <LocalizedEditorField
                        label={`项目经历 ${index + 1} 名称`}
                        localeMode={editorLocaleMode}
                        onChange={(value) =>
                          updateProjectLocalizedField(index, 'name', editorLocaleMode, value)
                        }
                        sourceValue={project.name.zh}
                        value={project.name[editorLocaleMode]}
                      />
                      <LocalizedEditorField
                        label={`项目经历 ${index + 1} 角色`}
                        localeMode={editorLocaleMode}
                        onChange={(value) =>
                          updateProjectLocalizedField(index, 'role', editorLocaleMode, value)
                        }
                        sourceValue={project.role.zh}
                        value={project.role[editorLocaleMode]}
                      />
                      {!isTranslationMode ? (
                        <>
                          <label className="field">
                            <span>{`项目经历 ${index + 1} 开始时间`}</span>
                            <Input
                              fullWidth
                              onChange={(event) =>
                                updateProjectPlainField(index, 'startDate', event.target.value)
                              }
                              value={project.startDate}
                              variant="secondary"
                            />
                          </label>
                          <label className="field">
                            <span>{`项目经历 ${index + 1} 结束时间`}</span>
                            <Input
                              fullWidth
                              onChange={(event) =>
                                updateProjectPlainField(index, 'endDate', event.target.value)
                              }
                              value={project.endDate}
                              variant="secondary"
                            />
                          </label>
                        </>
                      ) : null}
                    </div>

                    <LocalizedEditorField
                      label={`项目经历 ${index + 1} 摘要`}
                      localeMode={editorLocaleMode}
                      onChange={(value) =>
                        updateProjectLocalizedField(index, 'summary', editorLocaleMode, value)
                      }
                      rows={4}
                      sourceValue={project.summary.zh}
                      value={project.summary[editorLocaleMode]}
                      variant="textarea"
                    />

                    <LocalizedEditorField
                      label={`项目经历 ${index + 1} 亮点（每行一条）`}
                      localeMode={editorLocaleMode}
                      onChange={(value) =>
                        updateProjectHighlights(index, editorLocaleMode, value)
                      }
                      rows={5}
                      sourceValue={formatLocalizedLines(project.highlights, 'zh')}
                      value={
                        draftFieldValues[
                          buildDraftFieldKey('project', index, 'highlights', editorLocaleMode)
                        ] ?? formatLocalizedLines(project.highlights, editorLocaleMode)
                      }
                      variant="textarea"
                    />

                    {!isTranslationMode ? (
                      <label className="field">
                        <span>{`项目经历 ${index + 1} 技术栈（逗号分隔）`}</span>
                        <Input
                          fullWidth
                          onChange={(event) => updateProjectTechnologies(index, event.target.value)}
                          value={
                            draftFieldValues[
                              buildDraftFieldKey('project', index, 'technologies')
                            ] ?? formatCommaSeparatedValues(project.technologies)
                          }
                          variant="secondary"
                        />
                      </label>
                    ) : null}

                    <div className="stack">
                      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                        <div className="space-y-1">
                          <h5 className="text-sm font-semibold text-zinc-950 dark:text-white">
                            项目链接
                          </h5>
                          <p className="muted">
                            {isTranslationMode
                              ? '这里集中维护项目链接标签的英文版本。链接地址与新增删除动作仍在中文主编辑处理。'
                              : '可补充项目地址、演示入口或仓库链接，公开页和导出内容会复用这些字段。'}
                          </p>
                        </div>
                        {!isTranslationMode ? (
                          <IconActionButton
                            icon={<PlusIcon />}
                            label={`为项目经历 ${index + 1} 添加项目链接`}
                            onClick={() => addProjectLink(index)}
                          />
                        ) : null}
                      </div>

                      {project.links.length === 0 ? (
                        <div className="status-box">
                          <strong>当前还没有项目链接</strong>
                          <span>可按项目补充 demo、仓库或案例文章入口。</span>
                        </div>
                      ) : null}

                      {project.links.map((link, linkIndex) => (
                        <div
                          className="grid min-w-0 gap-4 rounded-[20px] border border-zinc-200/60 bg-zinc-50/60 p-4 shadow-none dark:border-zinc-800/80 dark:bg-zinc-950/55"
                          key={`project-${index}-link-${linkIndex}`}
                        >
                          <div className="flex min-w-0 items-start justify-between gap-3">
                            <div className="min-w-0 space-y-1">
                              <h6 className="text-sm font-semibold text-zinc-950 dark:text-white">
                                {`项目链接 ${linkIndex + 1}`}
                              </h6>
                              <p className="muted truncate">{link.url || link.label.zh || '未命名链接'}</p>
                            </div>
                            {!isTranslationMode ? (
                              <IconActionButton
                                className="mt-0.5"
                                icon={<TrashIcon />}
                                label={`删除项目经历 ${index + 1} 的链接 ${linkIndex + 1}`}
                                onClick={() => removeProjectLink(index, linkIndex)}
                                tone="danger"
                                variant="ghost"
                              />
                            ) : null}
                          </div>

                          <LocalizedEditorField
                            label={`项目经历 ${index + 1} 链接 ${linkIndex + 1} 标签`}
                            localeMode={editorLocaleMode}
                            onChange={(value) =>
                              updateProjectLinkField(
                                index,
                                linkIndex,
                                'label',
                                value,
                                editorLocaleMode,
                              )
                            }
                            sourceValue={link.label.zh}
                            value={link.label[editorLocaleMode]}
                          />

                          {!isTranslationMode ? (
                            <label className="field min-w-0">
                              <span>{`项目经历 ${index + 1} 链接 ${linkIndex + 1} 地址`}</span>
                              <Input
                                className="min-w-0"
                                fullWidth
                                onChange={(event) =>
                                  updateProjectLinkField(index, linkIndex, 'url', event.target.value)
                                }
                                value={link.url}
                                variant="secondary"
                              />
                            </label>
                          ) : null}
                        </div>
                      ))}
                    </div>
                  </EditorEntry>
                )}
              </SortableItemShell>
            ))}
          </div>
        </SortableContext>
      </DndContext>
    </EditorSection>
  );
}
