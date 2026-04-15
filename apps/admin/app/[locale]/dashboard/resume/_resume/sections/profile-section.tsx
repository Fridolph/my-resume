'use client'

import { DndContext, closestCenter } from '@dnd-kit/core'
import { SortableContext, rectSortingStrategy } from '@dnd-kit/sortable'
import { Input } from '@heroui/react'
import {
  buildDraftFieldKey,
  formatLocalizedLines,
} from '../editor/draft-editor-helpers'
import {
  CloseActionButton,
  EditorSection,
  IconActionButton,
  LocalizedEditorField,
  PlusIcon,
  SortableItemShell,
} from '../editor/editor-primitives'
import type { ProfileSectionProps } from '../types/profile-section.types'

export function ProfileSection({
  draftFieldValues,
  editorLocaleMode,
  isTranslationMode,
  resumeDraft,
  sensors,
  sortableCollections,
  translationAction,
  updateProfileHeroField,
  updateProfileHeroSlogans,
  updateProfileInterestField,
  updateProfileLinkField,
  updateProfileLocalizedField,
  updateProfilePlainField,
  addProfileInterest,
  addProfileLink,
  handleProfileInterestsDragEnd,
  handleProfileLinksDragEnd,
  removeProfileInterest,
  removeProfileLink,
}: ProfileSectionProps) {
  return (
    <EditorSection
      action={translationAction}
      count={
        7 +
        resumeDraft.profile.links.length +
        resumeDraft.profile.interests.length +
        Math.min(resumeDraft.profile.hero.slogans.length, 2)
      }
      description={
        isTranslationMode
          ? '英文翻译工作区只维护姓名、标题、简介、地点、主视觉 slogan、链接标签和兴趣方向的英文内容。'
          : '先保留原有 profile 编辑，继续作为标准简历的稳定基础层。'
      }
      title="基础信息">
      <div className="grid gap-4 md:grid-cols-2">
        <LocalizedEditorField
          label="姓名"
          localeMode={editorLocaleMode}
          onChange={(value) =>
            updateProfileLocalizedField('fullName', editorLocaleMode, value)
          }
          sourceValue={resumeDraft.profile.fullName.zh}
          value={resumeDraft.profile.fullName[editorLocaleMode]}
        />
        <LocalizedEditorField
          label="标题"
          localeMode={editorLocaleMode}
          onChange={(value) =>
            updateProfileLocalizedField('headline', editorLocaleMode, value)
          }
          sourceValue={resumeDraft.profile.headline.zh}
          value={resumeDraft.profile.headline[editorLocaleMode]}
        />
        <LocalizedEditorField
          label="所在地"
          localeMode={editorLocaleMode}
          onChange={(value) =>
            updateProfileLocalizedField('location', editorLocaleMode, value)
          }
          sourceValue={resumeDraft.profile.location.zh}
          value={resumeDraft.profile.location[editorLocaleMode]}
        />
        {!isTranslationMode ? (
          <>
            <label className="field">
              <span>邮箱</span>
              <Input
                fullWidth
                onChange={(event) => updateProfilePlainField('email', event.target.value)}
                value={resumeDraft.profile.email}
                variant="secondary"
              />
            </label>
            <label className="field">
              <span>电话</span>
              <Input
                fullWidth
                onChange={(event) => updateProfilePlainField('phone', event.target.value)}
                value={resumeDraft.profile.phone}
                variant="secondary"
              />
            </label>
          </>
        ) : null}
      </div>

      {!isTranslationMode ? (
        <label className="field">
          <span>个人网站</span>
          <Input
            fullWidth
            onChange={(event) => updateProfilePlainField('website', event.target.value)}
            value={resumeDraft.profile.website}
            variant="secondary"
          />
        </label>
      ) : null}

      <div className="stack rounded-[24px] border border-zinc-200/70 bg-zinc-50/70 px-4 py-4 dark:border-zinc-800 dark:bg-zinc-900/40">
        <div className="space-y-1">
          <h4 className="text-sm font-semibold text-zinc-950 dark:text-white">
            侧栏主视觉
          </h4>
          <p className="muted">
            {isTranslationMode
              ? '这里集中维护头像区两句 slogan 的英文文案。图片地址和点击跳转链接仍在中文主编辑中维护。'
              : '维护头像正反图片地址、头像点击跳转链接，以及公开侧栏头像区的两句 slogan。'}
          </p>
        </div>

        {!isTranslationMode ? (
          <div className="grid gap-4 md:grid-cols-3">
            <label className="field">
              <span>头像正面图片地址</span>
              <Input
                fullWidth
                onChange={(event) =>
                  updateProfileHeroField('frontImageUrl', event.target.value)
                }
                value={resumeDraft.profile.hero.frontImageUrl}
                variant="secondary"
              />
            </label>
            <label className="field">
              <span>头像背面图片地址</span>
              <Input
                fullWidth
                onChange={(event) =>
                  updateProfileHeroField('backImageUrl', event.target.value)
                }
                value={resumeDraft.profile.hero.backImageUrl}
                variant="secondary"
              />
            </label>
            <label className="field">
              <span>头像点击跳转地址</span>
              <Input
                fullWidth
                onChange={(event) =>
                  updateProfileHeroField('linkUrl', event.target.value)
                }
                value={resumeDraft.profile.hero.linkUrl}
                variant="secondary"
              />
            </label>
          </div>
        ) : null}

        <LocalizedEditorField
          label="主视觉 slogan（每行一条，最多两行）"
          localeMode={editorLocaleMode}
          onChange={(value) => updateProfileHeroSlogans(editorLocaleMode, value)}
          rows={3}
          sourceValue={formatLocalizedLines(resumeDraft.profile.hero.slogans, 'zh')}
          value={
            draftFieldValues[
              buildDraftFieldKey('profile', 'hero', 'slogans', editorLocaleMode)
            ] ?? formatLocalizedLines(resumeDraft.profile.hero.slogans, editorLocaleMode)
          }
          variant="textarea"
        />
      </div>

      <div className="stack">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div className="space-y-1">
            <h4 className="text-sm font-semibold text-zinc-950 dark:text-white">
              个人链接
            </h4>
            <p className="muted">
              {isTranslationMode
                ? '这里只维护链接标签的英文版本。链接地址与新增删除动作留在中文主编辑里处理。'
                : '用于公开侧栏展示 GitHub、博客等对外入口。'}
            </p>
          </div>
          {!isTranslationMode ? (
            <IconActionButton
              icon={<PlusIcon />}
              label="添加个人链接"
              onClick={addProfileLink}
            />
          ) : null}
        </div>

        {resumeDraft.profile.links.length === 0 ? (
          <div className="status-box min-h-0 px-4 py-3">
            <strong>当前还没有个人链接</strong>
            <span>可继续补 GitHub、博客或其他公开主页入口。</span>
          </div>
        ) : null}

        <DndContext
          collisionDetection={closestCenter}
          onDragEnd={handleProfileLinksDragEnd}
          sensors={sensors}>
          <SortableContext
            items={sortableCollections.profileLinks}
            strategy={rectSortingStrategy}>
            <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
              {resumeDraft.profile.links.map((link, index) => (
                <SortableItemShell
                  className="min-w-0"
                  disabled={isTranslationMode}
                  dragHandleLabel={`拖拽排序个人链接 ${index + 1}`}
                  id={sortableCollections.profileLinks[index] ?? `profile-link-${index}`}
                  key={
                    sortableCollections.profileLinks[index] ?? `profile-link-${index}`
                  }>
                  {({ dragHandle, isDragging }) => (
                    <div
                      className={[
                        'card stack min-h-full min-w-0 gap-3 rounded-[22px] p-4 transition-shadow',
                        isDragging
                          ? 'border-blue-300 shadow-[0_18px_38px_rgba(37,99,235,0.18)] dark:border-blue-400/40'
                          : '',
                      ].join(' ')}>
                      <div className="flex min-w-0 items-start justify-between gap-3">
                        <div className="flex min-w-0 items-start gap-3">
                          {dragHandle ? <div className="shrink-0">{dragHandle}</div> : null}
                          <div className="min-w-0 space-y-1">
                            <h5 className="text-sm font-semibold text-zinc-950 dark:text-white">
                              个人链接 {index + 1}
                            </h5>
                            <p className="muted truncate">
                              {link.url || link.label.zh || '未命名链接'}
                            </p>
                          </div>
                        </div>
                        {!isTranslationMode ? (
                          <CloseActionButton
                            className="mt-0.5"
                            label={`删除个人链接 ${index + 1}`}
                            onClick={() => removeProfileLink(index)}
                          />
                        ) : null}
                      </div>

                      <LocalizedEditorField
                        label={`个人链接 ${index + 1} 标签`}
                        localeMode={editorLocaleMode}
                        onChange={(value) =>
                          updateProfileLinkField(index, 'label', value, editorLocaleMode)
                        }
                        sourceValue={link.label.zh}
                        value={link.label[editorLocaleMode]}
                      />

                      {!isTranslationMode ? (
                        <>
                          <label className="field min-w-0">
                            <span>{`个人链接 ${index + 1} 地址`}</span>
                            <Input
                              className="min-w-0"
                              fullWidth
                              onChange={(event) =>
                                updateProfileLinkField(index, 'url', event.target.value)
                              }
                              value={link.url}
                              variant="secondary"
                            />
                          </label>
                          <label className="field min-w-0">
                            <span>{`个人链接 ${index + 1} Iconify 图标`}</span>
                            <Input
                              className="min-w-0"
                              fullWidth
                              onChange={(event) =>
                                updateProfileLinkField(index, 'icon', event.target.value)
                              }
                              placeholder="ri:github-fill"
                              value={link.icon ?? ''}
                              variant="secondary"
                            />
                          </label>
                        </>
                      ) : null}
                    </div>
                  )}
                </SortableItemShell>
              ))}
            </div>
          </SortableContext>
        </DndContext>
      </div>

      <LocalizedEditorField
        label="简介"
        localeMode={editorLocaleMode}
        onChange={(value) =>
          updateProfileLocalizedField('summary', editorLocaleMode, value)
        }
        rows={5}
        sourceValue={resumeDraft.profile.summary.zh}
        value={resumeDraft.profile.summary[editorLocaleMode]}
        variant="textarea"
      />

      <div className="stack">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div className="space-y-1">
            <h4 className="text-sm font-semibold text-zinc-950 dark:text-white">
              兴趣方向
            </h4>
            <p className="muted">
              {isTranslationMode
                ? '这里只维护兴趣名称的英文内容。图标、增删与排序保持在中文主编辑里处理。'
                : '可为公开侧栏的兴趣模块维护双语名称与 Iconify 图标，例如 ri:music-2-line。'}
            </p>
          </div>
          {!isTranslationMode ? (
            <IconActionButton
              icon={<PlusIcon />}
              label="添加兴趣方向"
              onClick={addProfileInterest}
            />
          ) : null}
        </div>

        {resumeDraft.profile.interests.length === 0 ? (
          <div className="status-box min-h-0 px-4 py-3">
            <strong>当前还没有兴趣方向</strong>
            <span>可继续补兴趣名称和 Iconify 图标，让公开侧栏更有个性。</span>
          </div>
        ) : null}

        <DndContext
          collisionDetection={closestCenter}
          onDragEnd={handleProfileInterestsDragEnd}
          sensors={sensors}>
          <SortableContext
            items={sortableCollections.profileInterests}
            strategy={rectSortingStrategy}>
            <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
              {resumeDraft.profile.interests.map((interest, index) => (
                <SortableItemShell
                  className="min-w-0"
                  disabled={isTranslationMode}
                  dragHandleLabel={`拖拽排序兴趣方向 ${index + 1}`}
                  id={
                    sortableCollections.profileInterests[index] ??
                    `profile-interest-${index}`
                  }
                  key={
                    sortableCollections.profileInterests[index] ??
                    `profile-interest-${index}`
                  }>
                  {({ dragHandle, isDragging }) => (
                    <div
                      className={[
                        'card stack min-h-full min-w-0 gap-3 rounded-[22px] p-4 transition-shadow',
                        isDragging
                          ? 'border-blue-300 shadow-[0_18px_38px_rgba(37,99,235,0.18)] dark:border-blue-400/40'
                          : '',
                      ].join(' ')}>
                      <div className="flex min-w-0 items-start justify-between gap-3">
                        <div className="flex min-w-0 items-start gap-3">
                          {dragHandle ? <div className="shrink-0">{dragHandle}</div> : null}
                          <div className="min-w-0 space-y-1">
                            <h5 className="text-sm font-semibold text-zinc-950 dark:text-white">
                              兴趣方向 {index + 1}
                            </h5>
                            <p className="muted truncate">
                              {interest.label.zh ||
                                interest.label.en ||
                                interest.icon ||
                                '未命名兴趣'}
                            </p>
                          </div>
                        </div>
                        {!isTranslationMode ? (
                          <CloseActionButton
                            className="mt-0.5"
                            label={`删除兴趣方向 ${index + 1}`}
                            onClick={() => removeProfileInterest(index)}
                          />
                        ) : null}
                      </div>

                      <LocalizedEditorField
                        label={`兴趣方向 ${index + 1} 名称`}
                        localeMode={editorLocaleMode}
                        onChange={(value) =>
                          updateProfileInterestField(
                            index,
                            'label',
                            value,
                            editorLocaleMode,
                          )
                        }
                        sourceValue={interest.label.zh}
                        value={interest.label[editorLocaleMode]}
                      />

                      {!isTranslationMode ? (
                        <label className="field min-w-0">
                          <span>{`兴趣方向 ${index + 1} Iconify 图标`}</span>
                          <Input
                            className="min-w-0"
                            fullWidth
                            onChange={(event) =>
                              updateProfileInterestField(
                                index,
                                'icon',
                                event.target.value,
                              )
                            }
                            placeholder="ri:rocket-line"
                            value={interest.icon ?? ''}
                            variant="secondary"
                          />
                        </label>
                      ) : null}
                    </div>
                  )}
                </SortableItemShell>
              ))}
            </div>
          </SortableContext>
        </DndContext>
      </div>
    </EditorSection>
  )
}
