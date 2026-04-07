'use client';

import { DndContext, closestCenter, type DragEndEvent } from '@dnd-kit/core';
import { restrictToVerticalAxis } from '@dnd-kit/modifiers';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { Input, TextArea } from '@heroui/react';
import type { ComponentProps, ReactNode } from 'react';

import type { StandardResume } from '../../lib/resume-types';
import {
  buildDraftFieldKey,
  formatLineSeparatedValues,
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

interface SkillsSectionProps {
  draftFieldValues: DraftFieldValues;
  editorLocaleMode: EditorLocaleMode;
  isTranslationMode: boolean;
  resumeDraft: StandardResume;
  sensors: ComponentProps<typeof DndContext>['sensors'];
  sortableCollections: SortableCollectionState;
  translationAction?: ReactNode;
  addSkillGroup: () => void;
  handleDragEnd: (event: DragEndEvent) => void;
  removeSkillGroup: (index: number) => void;
  updateSkillKeywords: (index: number, value: string) => void;
  updateSkillLocalizedField: (index: number, locale: 'zh' | 'en', value: string) => void;
}

export function SkillsSection({
  draftFieldValues,
  editorLocaleMode,
  isTranslationMode,
  resumeDraft,
  sensors,
  sortableCollections,
  translationAction,
  addSkillGroup,
  handleDragEnd,
  removeSkillGroup,
  updateSkillKeywords,
  updateSkillLocalizedField,
}: SkillsSectionProps) {
  return (
    <EditorSection
      action={
        isTranslationMode
          ? translationAction
          : (
            <IconActionButton
              icon={<PlusIcon />}
              label="添加技能组"
              onClick={addSkillGroup}
            />
            )
      }
      count={resumeDraft.skills.length}
      description={
        isTranslationMode
          ? '英文翻译工作区只维护技能组名称。关键词仍按当前原始技术名在中文主编辑中维护。'
          : '按技能组维护关键词，公开页会按组展示能力结构。'
      }
      title="技能组"
    >
      {resumeDraft.skills.length === 0 ? (
        <div className="status-box">
          <strong>当前还没有技能组</strong>
          <span>可按技术方向逐组补充关键词，保持结构清晰。</span>
        </div>
      ) : null}

      <DndContext
        collisionDetection={closestCenter}
        modifiers={[restrictToVerticalAxis]}
        onDragEnd={handleDragEnd}
        sensors={sensors}
      >
        <SortableContext
          items={sortableCollections.skills}
          strategy={verticalListSortingStrategy}
        >
          <div className="grid gap-4">
            {resumeDraft.skills.map((skill, index) => (
              <SortableItemShell
                disabled={isTranslationMode}
                dragHandleLabel={`拖拽排序技能组 ${index + 1}`}
                id={sortableCollections.skills[index] ?? `skill-${index}`}
                key={sortableCollections.skills[index] ?? `skill-${index}`}
              >
                {({ dragHandle }) => (
                  <EditorEntry
                    action={buildEntryActions({
                      deleteAction: !isTranslationMode ? (
                        <IconActionButton
                          icon={<TrashIcon />}
                          label={`删除技能组 ${index + 1}`}
                          onClick={() => removeSkillGroup(index)}
                          tone="danger"
                          variant="ghost"
                        />
                      ) : null,
                      dragHandle,
                    })}
                    defaultExpanded={
                      resumeDraft.skills.length === 1 ||
                      index === resumeDraft.skills.length - 1
                    }
                    summary={skill.name.zh || skill.name.en || '未命名技能组'}
                    title={`技能组 ${index + 1}`}
                    toggleLabel={`技能组 ${index + 1} 条目开关`}
                    variant="embedded"
                  >
                    <LocalizedEditorField
                      label={`技能组 ${index + 1} 名称`}
                      localeMode={editorLocaleMode}
                      onChange={(value) =>
                        updateSkillLocalizedField(index, editorLocaleMode, value)
                      }
                      sourceValue={skill.name.zh}
                      value={skill.name[editorLocaleMode]}
                    />

                    {!isTranslationMode ? (
                      <label className="field">
                        <span>{`技能组 ${index + 1} 关键词（每行一条）`}</span>
                        <TextArea
                          fullWidth
                          onChange={(event) => updateSkillKeywords(index, event.target.value)}
                          rows={5}
                          value={
                            draftFieldValues[buildDraftFieldKey('skill', index, 'keywords')] ??
                            formatLineSeparatedValues(skill.keywords)
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
  );
}

interface HighlightsSectionProps {
  editorLocaleMode: EditorLocaleMode;
  isTranslationMode: boolean;
  resumeDraft: StandardResume;
  sensors: ComponentProps<typeof DndContext>['sensors'];
  sortableCollections: SortableCollectionState;
  translationAction?: ReactNode;
  addHighlight: () => void;
  handleDragEnd: (event: DragEndEvent) => void;
  removeHighlight: (index: number) => void;
  updateHighlightLocalizedField: (
    index: number,
    field: 'title' | 'description',
    locale: 'zh' | 'en',
    value: string,
  ) => void;
}

export function HighlightsSection({
  editorLocaleMode,
  isTranslationMode,
  resumeDraft,
  sensors,
  sortableCollections,
  translationAction,
  addHighlight,
  handleDragEnd,
  removeHighlight,
  updateHighlightLocalizedField,
}: HighlightsSectionProps) {
  return (
    <EditorSection
      action={
        isTranslationMode
          ? translationAction
          : (
            <IconActionButton
              icon={<PlusIcon />}
              label="添加亮点"
              onClick={addHighlight}
            />
            )
      }
      count={resumeDraft.highlights.length}
      description={
        isTranslationMode
          ? '英文翻译工作区集中维护亮点标题和描述，方便后续对接 AI / 工具翻译。'
          : '维护个人优势、开源、团队协作等补充亮点，丰富公开页结尾信息。'
      }
      title="亮点"
    >
      {resumeDraft.highlights.length === 0 ? (
        <div className="status-box">
          <strong>当前还没有亮点</strong>
          <span>可补充开源、技术写作、团队建设等补充优势。</span>
        </div>
      ) : null}

      <DndContext
        collisionDetection={closestCenter}
        modifiers={[restrictToVerticalAxis]}
        onDragEnd={handleDragEnd}
        sensors={sensors}
      >
        <SortableContext
          items={sortableCollections.highlights}
          strategy={verticalListSortingStrategy}
        >
          <div className="grid gap-4">
            {resumeDraft.highlights.map((highlight, index) => (
              <SortableItemShell
                disabled={isTranslationMode}
                dragHandleLabel={`拖拽排序亮点 ${index + 1}`}
                id={sortableCollections.highlights[index] ?? `highlight-${index}`}
                key={sortableCollections.highlights[index] ?? `highlight-${index}`}
              >
                {({ dragHandle }) => (
                  <EditorEntry
                    action={buildEntryActions({
                      deleteAction: !isTranslationMode ? (
                        <IconActionButton
                          icon={<TrashIcon />}
                          label={`删除亮点 ${index + 1}`}
                          onClick={() => removeHighlight(index)}
                          tone="danger"
                          variant="ghost"
                        />
                      ) : null,
                      dragHandle,
                    })}
                    defaultExpanded={
                      resumeDraft.highlights.length === 1 ||
                      index === resumeDraft.highlights.length - 1
                    }
                    summary={highlight.title.zh || highlight.title.en || '未命名亮点'}
                    title={`亮点 ${index + 1}`}
                    toggleLabel={`亮点 ${index + 1} 条目开关`}
                    variant="embedded"
                  >
                    <LocalizedEditorField
                      label={`亮点 ${index + 1} 标题`}
                      localeMode={editorLocaleMode}
                      onChange={(value) =>
                        updateHighlightLocalizedField(index, 'title', editorLocaleMode, value)
                      }
                      sourceValue={highlight.title.zh}
                      value={highlight.title[editorLocaleMode]}
                    />

                    <LocalizedEditorField
                      label={`亮点 ${index + 1} 描述`}
                      localeMode={editorLocaleMode}
                      onChange={(value) =>
                        updateHighlightLocalizedField(
                          index,
                          'description',
                          editorLocaleMode,
                          value,
                        )
                      }
                      rows={4}
                      sourceValue={highlight.description.zh}
                      value={highlight.description[editorLocaleMode]}
                      variant="textarea"
                    />
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
