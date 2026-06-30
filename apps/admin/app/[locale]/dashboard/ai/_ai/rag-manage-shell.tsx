'use client'

import { DndContext, KeyboardSensor, PointerSensor, TouchSensor, closestCenter, useSensor, useSensors, type DragEndEvent } from '@dnd-kit/core'
import { arrayMove, SortableContext, sortableKeyboardCoordinates, verticalListSortingStrategy } from '@dnd-kit/sortable'
import { Button, ButtonGroup, Card, CardContent, CardHeader, CardTitle, Chip, Drawer, Dropdown, Form, Input, Label, ListBox, Pagination, Popover, Radio, RadioGroup, Select, Spinner, Tabs, TextArea } from '@heroui/react'
import { useEffect, useMemo, useRef, useState } from 'react'

import { useAdminSession } from '@core/admin-session'
import { adminPrimaryButtonClass } from '@core/button-styles'
import { DEFAULT_API_BASE_URL } from '@core/env'
import type { AppLocale } from '@i18n/types'
import { AdminDrawerShell } from '../../../../_shared/ui/components/heroui'
import { CloseActionButton, IconActionButton, PlusIcon, SortableItemShell } from '../../resume/_resume/editor/editor-primitives'

import { AiUserDocIngestionPanel } from './components/user-doc-ingestion-panel'
import type { UserDocIngestResult } from './types/ai-file.types'
import type { RagUserDocContentType } from './rag-extension.types'
const CONTENT_TYPE_OPTIONS: Array<{
  label: string
  description: string
  value: RagUserDocContentType
}> = [
  { label: '兴趣爱好', description: '生活方式、运动、收藏、兴趣记录', value: 'hobby' },
  { label: '技术博客', description: '技术文章、实践复盘、项目过程', value: 'tech_blog' },
  { label: '知识专栏', description: '系列专栏、长期输出、主题整理', value: 'knowledge_column' },
  { label: '工作经历补充', description: '工作经历细节、行业背景、项目补充说明', value: 'work_detail' },
  { label: '其他通用', description: '不便细分的综合资料', value: 'general' },
]

const PAGE_SIZE_OPTIONS = [10, 20, 50] as const
const PAGE_SIZE_SELECT_OPTIONS = PAGE_SIZE_OPTIONS.map((size) => ({
  label: `${size}`,
  value: String(size),
}))

function getPageNumbers(page: number, totalPages: number): Array<number | 'ellipsis'> {
  if (totalPages <= 7) {
    return Array.from({ length: totalPages }, (_, index) => index + 1)
  }

  const pages: Array<number | 'ellipsis'> = [1]

  if (page > 3) {
    pages.push('ellipsis')
  }

  const start = Math.max(2, page - 1)
  const end = Math.min(totalPages - 1, page + 1)

  for (let item = start; item <= end; item += 1) {
    pages.push(item)
  }

  if (page < totalPages - 2) {
    pages.push('ellipsis')
  }

  pages.push(totalPages)

  return pages
}

function formatDateTime(value: string) {
  return new Date(value).toLocaleString('zh-CN', {
    hour12: false, month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit',
  })
}

function contentTypeLabel(type?: string) {
  const map: Record<string, string> = {
    hobby: '兴趣爱好',
    tech_blog: '技术博客',
    knowledge_column: '知识专栏',
    work_detail: '工作经历补充',
    general: '其他通用',
    article: '技术博客',
    media: '知识专栏',
  }
  return map[type ?? ''] ?? type ?? '—'
}

function CardTypeOption({
  description,
  label,
  value,
  selected,
}: {
  description: string
  label: string
  value: RagUserDocContentType
  selected: boolean
}) {
  return (
    <Radio
      className="group relative flex-col gap-2 rounded-2xl border border-transparent bg-zinc-50 px-4 py-3 transition-colors data-[selected=true]:border-[color:var(--admin-primary)] data-[selected=true]:bg-[color:var(--admin-primary)]/8"
      value={value}>
      <Radio.Control className="absolute top-3 right-3 size-5">
        <Radio.Indicator />
      </Radio.Control>
      <Radio.Content className="grid gap-1 pr-6">
        <Label className="text-sm font-medium text-zinc-950 dark:text-white">{label}</Label>
        <span className="text-xs leading-5 text-zinc-500 dark:text-zinc-400">{description}</span>
      </Radio.Content>
      {selected ? <span className="sr-only">已选中</span> : null}
    </Radio>
  )
}

function ContentTypeRadioGroup({
  label,
  value,
  onChange,
}: {
  label: string
  value: RagUserDocContentType
  onChange: (value: RagUserDocContentType) => void
}) {
  return (
    <div className="field">
      <span>{label}</span>
      <RadioGroup
        aria-label={label}
        name={label}
        onChange={(nextValue) => onChange(String(nextValue) as RagUserDocContentType)}
        value={value}
        variant="secondary">
        <div className="grid gap-3 sm:grid-cols-4">
          {CONTENT_TYPE_OPTIONS.map((option) => (
            <CardTypeOption
              description={option.description}
              key={option.value}
              label={option.label}
              selected={value === option.value}
              value={option.value}
            />
          ))}
        </div>
      </RadioGroup>
    </div>
  )
}

function buildSortableIds(values: string[], scope: string, nextId: () => string) {
  const count = Math.max(values.length, 1)

  return Array.from({ length: count }, () => `${scope}-${nextId()}`)
}

function reorderStringArray(values: string[], fromIndex: number, toIndex: number) {
  return arrayMove(values, fromIndex, toIndex)
}

function reorderSortableIds(ids: string[], fromIndex: number, toIndex: number) {
  return arrayMove(ids, fromIndex, toIndex)
}

function ensureSortableIds(values: string[], ids: string[], scope: string, nextId: () => string) {
  const targetCount = Math.max(values.length, 1)

  if (ids.length === targetCount) {
    return ids
  }

  if (ids.length > targetCount) {
    return ids.slice(0, targetCount)
  }

  return [...ids, ...Array.from({ length: targetCount - ids.length }, () => `${scope}-${nextId()}`)]
}

function MoveUpIcon() {
  return (
    <svg aria-hidden="true" fill="none" height="16" viewBox="0 0 16 16" width="16">
      <path
        d="M4 10.5 8 6.5l4 4"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.8"
      />
    </svg>
  )
}

function MoveDownIcon() {
  return (
    <svg aria-hidden="true" fill="none" height="16" viewBox="0 0 16 16" width="16">
      <path
        d="m4 5.5 4 4 4-4"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.8"
      />
    </svg>
  )
}

function SortableRichUrlEditor({
  label,
  placeholder,
  values,
  titles,
  descriptions,
  sortableIds,
  sensors,
  onReorder,
  onChange,
  onTitlesChange,
  onDescriptionsChange,
}: {
  label: string
  placeholder: string
  values: string[]
  titles: string[]
  descriptions: string[]
  sortableIds: string[]
  sensors: ReturnType<typeof useSensors>
  onReorder: (fromIndex: number, toIndex: number) => void
  onChange: (values: string[]) => void
  onTitlesChange: (titles: string[]) => void
  onDescriptionsChange: (descriptions: string[]) => void
}) {
  function updateValue(index: number, value: string) {
    onChange(values.map((item, itemIndex) => (itemIndex === index ? value : item)))
  }

  function updateTitle(index: number, value: string) {
    onTitlesChange(titles.map((item, itemIndex) => (itemIndex === index ? value : item)))
  }

  function updateDescription(index: number, value: string) {
    onDescriptionsChange(descriptions.map((item, itemIndex) => (itemIndex === index ? value : item)))
  }

  function removeValue(index: number) {
    const nextValues = values.filter((_, itemIndex) => itemIndex !== index)
    const nextTitles = titles.filter((_, itemIndex) => itemIndex !== index)
    const nextDescriptions = descriptions.filter((_, itemIndex) => itemIndex !== index)
    onChange(nextValues.length > 0 ? nextValues : [''])
    onTitlesChange(nextTitles.length > 0 ? nextTitles : [''])
    onDescriptionsChange(nextDescriptions.length > 0 ? nextDescriptions : [''])
  }

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event
    if (!over || active.id === over.id) return
    const fromIndex = sortableIds.indexOf(String(active.id))
    const toIndex = sortableIds.indexOf(String(over.id))
    if (fromIndex === -1 || toIndex === -1 || fromIndex === toIndex) return
    onReorder(fromIndex, toIndex)
  }

  return (
    <div className="field">
      <span>{label}</span>
      <div className="grid gap-3">
        <DndContext collisionDetection={closestCenter} onDragEnd={handleDragEnd} sensors={sensors}>
          <SortableContext items={sortableIds} strategy={verticalListSortingStrategy}>
            <div className="grid gap-3">
              {values.map((value, index) => (
                <SortableItemShell
                  className="min-w-0"
                  dragHandleLabel={`拖拽排序${label} ${index + 1}`}
                  id={sortableIds[index] ?? `${label}-${index}`}
                  key={sortableIds[index] ?? `${label}-${index}`}>
                  {({ dragHandle, isDragging }) => (
                    <div className={['card stack gap-3 rounded-[22px] p-4 transition-shadow', isDragging ? 'border-blue-300 shadow-[0_18px_38px_rgba(37,99,235,0.18)] dark:border-blue-400/40' : ''].join(' ')}>
                      <div className="flex min-w-0 items-start justify-between gap-3">
                        {dragHandle ? <div className="shrink-0">{dragHandle}</div> : null}
                        <h5 className="text-sm font-semibold text-zinc-950 dark:text-white">{label} {index + 1}</h5>
                        <CloseActionButton label={`删除${label} ${index + 1}`} onClick={() => removeValue(index)} />
                      </div>
                      <Input className="min-w-0" fullWidth onChange={(e) => updateValue(index, e.target.value)} placeholder={placeholder} value={value} variant="secondary" />
                      <div className="grid gap-2 md:grid-cols-2">
                        <Input onChange={(e) => updateTitle(index, e.target.value)} placeholder="展示标题（可选）" value={titles[index] ?? ''} variant="secondary" />
                        <Input onChange={(e) => updateDescription(index, e.target.value)} placeholder="简短描述（可选）" value={descriptions[index] ?? ''} variant="secondary" />
                      </div>
                    </div>
                  )}
                </SortableItemShell>
              ))}
            </div>
          </SortableContext>
        </DndContext>
        <div>
          <Button onPress={() => { onChange([...values, '']); onTitlesChange([...titles, '']); onDescriptionsChange([...descriptions, '']) }} size="sm" variant="secondary">
            + 添加{label}
          </Button>
        </div>
      </div>
    </div>
  )
}

function SortableUrlListEditor({
  label,
  placeholder,
  values,
  sortableIds,
  sensors,
  onReorder,
  onChange,
}: {
  label: string
  placeholder: string
  values: string[]
  sortableIds: string[]
  sensors: ReturnType<typeof useSensors>
  onReorder: (fromIndex: number, toIndex: number) => void
  onChange: (values: string[]) => void
}) {
  function updateValue(index: number, value: string) {
    onChange(values.map((item, itemIndex) => (itemIndex === index ? value : item)))
  }

  function removeValue(index: number) {
    const nextValues = values.filter((_, itemIndex) => itemIndex !== index)
    onChange(nextValues.length > 0 ? nextValues : [''])
  }

  function moveValue(index: number, direction: 'up' | 'down') {
    const targetIndex = direction === 'up' ? index - 1 : index + 1

    if (targetIndex < 0 || targetIndex >= values.length) {
      return
    }

    onReorder(index, targetIndex)
  }

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event

    if (!over || active.id === over.id) {
      return
    }

    const fromIndex = sortableIds.indexOf(String(active.id))
    const toIndex = sortableIds.indexOf(String(over.id))

    if (fromIndex === -1 || toIndex === -1 || fromIndex === toIndex) {
      return
    }

    onReorder(fromIndex, toIndex)
  }

  return (
    <div className="field">
      <span>{label}</span>
      <div className="grid gap-3">
        <DndContext
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
          sensors={sensors}>
          <SortableContext
            items={sortableIds}
            strategy={verticalListSortingStrategy}>
            <div className="grid gap-3">
              {values.map((value, index) => (
                <SortableItemShell
                  className="min-w-0"
                  dragHandleLabel={`拖拽排序${label} ${index + 1}`}
                  id={sortableIds[index] ?? `${label}-${index}`}
                  key={sortableIds[index] ?? `${label}-${index}`}>
                  {({ dragHandle, isDragging }) => (
                    <div
                      className={[
                        'card stack gap-3 rounded-[22px] p-4 transition-shadow',
                        isDragging
                          ? 'border-blue-300 shadow-[0_18px_38px_rgba(37,99,235,0.18)] dark:border-blue-400/40'
                          : '',
                      ].join(' ')}>
                      <div className="flex min-w-0 items-start justify-between gap-3">
                        <div className="flex min-w-0 items-start gap-3">
                          {dragHandle ? <div className="shrink-0">{dragHandle}</div> : null}
                          <div className="min-w-0 space-y-1">
                            <h5 className="text-sm font-semibold text-zinc-950 dark:text-white">
                              {label} {index + 1}
                            </h5>
                            <p className="muted truncate">
                              {value || placeholder}
                            </p>
                          </div>
                        </div>
                        <div className="flex shrink-0 items-center gap-1">
                          <IconActionButton
                            buttonProps={{ isDisabled: index === 0 }}
                            icon={<MoveUpIcon />}
                            label={`上移${label} ${index + 1}`}
                            onClick={() => moveValue(index, 'up')}
                            size="compact"
                            variant="ghost"
                          />
                          <IconActionButton
                            buttonProps={{ isDisabled: index === values.length - 1 }}
                            icon={<MoveDownIcon />}
                            label={`下移${label} ${index + 1}`}
                            onClick={() => moveValue(index, 'down')}
                            size="compact"
                            variant="ghost"
                          />
                          <CloseActionButton
                            className="mt-0.5"
                            label={`${label} ${index + 1}`}
                            onClick={() => removeValue(index)}
                          />
                        </div>
                      </div>

                      <label className="field min-w-0">
                        <span>{`${label} ${index + 1} 地址`}</span>
                        <Input
                          aria-label={`${label} ${index + 1} 地址`}
                          className="min-w-0"
                          fullWidth
                          onChange={(event) => updateValue(index, event.target.value)}
                          placeholder={placeholder}
                          value={value}
                          variant="secondary"
                        />
                      </label>
                    </div>
                  )}
                </SortableItemShell>
              ))}
            </div>
          </SortableContext>
        </DndContext>
        <Button
          className="w-fit"
          onPress={() => onChange([...values, ''])}
          size="sm"
          variant="outline">
          <PlusIcon />
          添加一项
        </Button>
      </div>
    </div>
  )
}

function ViewIcon() {
  return (
    <svg aria-hidden="true" fill="none" height="16" viewBox="0 0 24 24" width="16">
      <path d="M4 12s2.8-5 8-5 8 5 8 5-2.8 5-8 5-8-5-8-5Z" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" />
      <circle cx="12" cy="12" r="2.4" stroke="currentColor" strokeWidth="1.8" />
    </svg>
  )
}

function TrashIcon() {
  return (
    <svg aria-hidden="true" fill="none" height="16" viewBox="0 0 24 24" width="16">
      <path d="M6 7h12M9.5 7V5.5a1 1 0 0 1 1-1h3a1 1 0 0 1 1 1V7" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" />
      <path d="M5 7l1.5 12a1 1 0 0 0 1 1h9a1 1 0 0 0 1-1L19 7" stroke="currentColor" strokeLinejoin="round" strokeWidth="1.8" />
      <path d="M10.5 11v6M13.5 11v6" stroke="currentColor" strokeLinecap="round" strokeWidth="1.8" />
    </svg>
  )
}

const actionIconClass = [
  'inline-flex h-8 w-8 min-w-8 items-center justify-center rounded-full p-0 text-zinc-500',
  'transition-colors focus-visible:ring-2 focus-visible:ring-blue-500/20',
  'data-[hovered=true]:text-zinc-900',
  'dark:text-zinc-300',
  'dark:data-[hovered=true]:text-white',
].join(' ')

interface RagDocument {
  id: string
  title: string
  contentType?: string
  summary?: string
  sourceScope?: string
  chunkCount?: number
  preview?: string | null
  fileName?: string
  fileType?: string
  editable?: boolean
  createdAt: string
  updatedAt?: string
}

interface RagDocumentDetail extends RagDocument {
  sourceType: string
  locale: string
  content: string
  linkUrl?: string
  linkUrls?: string[]
  imageUrls?: string[]
  summary?: string
}

function normalizeInputRows(values: string[]) {
  const normalized = values.map((value) => value.trim()).filter(Boolean)

  return normalized.length > 0 ? normalized : []
}

function ensureInputRows(values: string[] | undefined) {
  return values && values.length > 0 ? values : ['']
}

function PencilIcon() {
  return (
    <svg aria-hidden="true" fill="none" height="16" viewBox="0 0 24 24" width="16">
      <path d="M4 20h4l10-10a2.1 2.1 0 0 0-4-4L4 16v4Z" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" />
      <path d="m13.5 6.5 4 4" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" />
    </svg>
  )
}

function ChevronDownIcon() {
  return (
    <svg aria-hidden="true" fill="none" height="16" viewBox="0 0 24 24" width="16">
      <path d="M6 9l6 6 6-6" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" />
    </svg>
  )
}

export function RagManageShell({ locale: _locale }: { locale: AppLocale }) {
  const { accessToken, currentUser, status } = useAdminSession()
  const sortableIdCounterRef = useRef(0)
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(TouchSensor, {
      activationConstraint: {
        delay: 180,
        tolerance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  )

  function nextSortableId() {
    sortableIdCounterRef.current += 1
    return String(sortableIdCounterRef.current)
  }

  // Tab 1: 自定义数据
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [summary, setSummary] = useState('')
  const [linkDisplayTitle, setLinkDisplayTitle] = useState('')
  const [linkTitles, setLinkTitles] = useState<string[]>([''])
  const [linkDescriptions, setLinkDescriptions] = useState<string[]>([''])
  const [imageTitles, setImageTitles] = useState<string[]>([''])
  const [contentType, setContentType] = useState<RagUserDocContentType>('tech_blog')
  const [linkUrls, setLinkUrls] = useState<string[]>([''])
  const [imageUrls, setImageUrls] = useState<string[]>([''])
  const [linkSortableIds, setLinkSortableIds] = useState<string[]>(() =>
    buildSortableIds([''], 'rag-link', nextSortableId),
  )
  const [imageSortableIds, setImageSortableIds] = useState<string[]>(() =>
    buildSortableIds([''], 'rag-image', nextSortableId),
  )
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [formResult, setFormResult] = useState<string | null>(null)
  const [formError, setFormError] = useState<string | null>(null)

  // Tab 2: 文件上传
  const [uploadResult, setUploadResult] = useState<UserDocIngestResult | null>(null)

  // Tab 3: 文档管理
  const [documents, setDocuments] = useState<RagDocument[]>([])
  const [documentsLoading, setDocumentsLoading] = useState(false)
  const [documentsPage, setDocumentsPage] = useState(1)
  const [documentsPageSize, setDocumentsPageSize] = useState<(typeof PAGE_SIZE_OPTIONS)[number]>(20)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [deletePopoverId, setDeletePopoverId] = useState<string | null>(null)
  const [rebuilding, setRebuilding] = useState(false)
  const [reconciling, setReconciling] = useState(false)
  const [exporting, setExporting] = useState(false)
  const [resetting, setResetting] = useState(false)
  const [actionsMenuOpen, setActionsMenuOpen] = useState(false)
  const [detailDocumentId, setDetailDocumentId] = useState<string | null>(null)
  const [viewDetail, setViewDetail] = useState<RagDocumentDetail | null>(null)
  const [detailLoading, setDetailLoading] = useState(false)
  const [detailError, setDetailError] = useState<string | null>(null)
  const [isEditingDetail, setIsEditingDetail] = useState(false)
  const [detailSubmitting, setDetailSubmitting] = useState(false)
  const [editTitle, setEditTitle] = useState('')
  const [editContent, setEditContent] = useState('')
  const [editContentType, setEditContentType] = useState<RagUserDocContentType>('tech_blog')
  const [editLinkUrls, setEditLinkUrls] = useState<string[]>([''])
  const [editImageUrls, setEditImageUrls] = useState<string[]>([''])
  const [editLinkSortableIds, setEditLinkSortableIds] = useState<string[]>(() =>
    buildSortableIds([''], 'rag-edit-link', nextSortableId),
  )
  const [editImageSortableIds, setEditImageSortableIds] = useState<string[]>(() =>
    buildSortableIds([''], 'rag-edit-image', nextSortableId),
  )
  const [editSummary, setEditSummary] = useState('')
  const [editLinkDisplayTitle, setEditLinkDisplayTitle] = useState('')
  const [editLinkTitles, setEditLinkTitles] = useState<string[]>([''])
  const [editLinkDescriptions, setEditLinkDescriptions] = useState<string[]>([''])
  const [editImageTitles, setEditImageTitles] = useState<string[]>([''])
  const [actionError, setActionError] = useState<string | null>(null)
  const [actionResult, setActionResult] = useState<string | null>(null)

  if (status !== 'ready' || !currentUser || !accessToken) return null

  const documentsTotalPages = Math.max(1, Math.ceil(documents.length / documentsPageSize))
  const safeDocumentsPage = Math.min(documentsPage, documentsTotalPages)
  const documentsStartIndex = (safeDocumentsPage - 1) * documentsPageSize
  const pagedDocuments = useMemo(
    () => documents.slice(documentsStartIndex, documentsStartIndex + documentsPageSize),
    [documents, documentsPageSize, documentsStartIndex],
  )
  const documentsRangeStart = documents.length === 0 ? 0 : documentsStartIndex + 1
  const documentsRangeEnd = documents.length === 0
    ? 0
    : Math.min(documentsStartIndex + documentsPageSize, documents.length)

  const canUpload = Boolean(currentUser.capabilities.canTriggerAiAnalysis)
  if (!canUpload) {
    return (
      <div className="bg-[#ebebee] dark:bg-zinc-950">
        <section className="border-b border-zinc-200/80 bg-white px-4 py-5 dark:border-zinc-800 dark:bg-zinc-950">
          <div className="readonly-box">
            <strong>当前角色只读</strong>
            <span>只有管理员可以管理 RAG 资料库。</span>
          </div>
        </section>
      </div>
    )
  }

  async function fetchDocuments() {
    if (!accessToken) return
    setDocumentsLoading(true)
    try {
      const res = await fetch(`${DEFAULT_API_BASE_URL}/api/ai/rag/documents`, {
        headers: { Authorization: `Bearer ${accessToken}` },
      })
      const json = await res.json()
      const list = Array.isArray(json.data) ? json.data : Array.isArray(json) ? json : []
      setDocuments(list)
    } catch { /* ignore */ }
    finally { setDocumentsLoading(false) }
  }

  useEffect(() => {
    if (documentsPage > documentsTotalPages) {
      setDocumentsPage(documentsTotalPages)
    }
  }, [documentsPage, documentsTotalPages])

  useEffect(() => {
    setLinkSortableIds((current) => ensureSortableIds(linkUrls, current, 'rag-link', nextSortableId))
  }, [linkUrls])

  useEffect(() => {
    setImageSortableIds((current) => ensureSortableIds(imageUrls, current, 'rag-image', nextSortableId))
  }, [imageUrls])

  useEffect(() => {
    setEditLinkSortableIds((current) => ensureSortableIds(editLinkUrls, current, 'rag-edit-link', nextSortableId))
  }, [editLinkUrls])

  useEffect(() => {
    setEditImageSortableIds((current) => ensureSortableIds(editImageUrls, current, 'rag-edit-image', nextSortableId))
  }, [editImageUrls])

  function closeDetail() {
    setDetailDocumentId(null)
    setViewDetail(null)
    setDetailError(null)
    setDetailLoading(false)
    setIsEditingDetail(false)
    setDetailSubmitting(false)
    setEditTitle('')
    setEditContent('')
    setEditContentType('tech_blog')
    setEditLinkUrls([''])
    setEditLinkTitles([''])
    setEditLinkDescriptions([''])
    setEditImageUrls([''])
    setEditImageTitles([''])
    setEditLinkSortableIds(buildSortableIds([''], 'rag-edit-link', nextSortableId))
    setEditImageSortableIds(buildSortableIds([''], 'rag-edit-image', nextSortableId))
    setEditSummary('')
    setEditLinkDisplayTitle('')
  }

  function seedDetailEditor(detail: RagDocumentDetail) {
    setEditTitle(detail.title ?? '')
    setEditContent(detail.content ?? '')
    setEditContentType((detail.contentType as RagUserDocContentType | undefined) ?? 'tech_blog')
    const nextLinkUrls = ensureInputRows(detail.linkUrls ?? (detail.linkUrl ? [detail.linkUrl] : []))
    const nextImageUrls = ensureInputRows(detail.imageUrls)
    setEditLinkUrls(nextLinkUrls)
    setEditImageUrls(nextImageUrls)
    setEditLinkSortableIds(buildSortableIds(nextLinkUrls, 'rag-edit-link', nextSortableId))
    setEditImageSortableIds(buildSortableIds(nextImageUrls, 'rag-edit-image', nextSortableId))
    setEditSummary(detail.summary ?? '')
    setEditLinkDisplayTitle((detail as any).richCard?.linkDisplayTitle ?? '')
  }

  async function openDetail(documentId: string, startEditing = false) {
    setDetailDocumentId(documentId)
    setDetailLoading(true)
    setDetailError(null)
    setIsEditingDetail(false)
    try {
      const res = await fetch(`${DEFAULT_API_BASE_URL}/api/ai/rag/documents/${documentId}`, {
        headers: { Authorization: `Bearer ${accessToken ?? ''}` },
      })
      const json = await res.json().catch(() => null)
      if (!res.ok) {
        throw new Error(json?.message || '资料详情加载失败')
      }
      const detail = (json?.data ?? json) as RagDocumentDetail
      setViewDetail(detail)
      seedDetailEditor(detail)
      setIsEditingDetail(startEditing && Boolean(detail.editable))
    } catch (error) {
      setViewDetail(null)
      setDetailError(error instanceof Error ? error.message : '资料详情加载失败')
    } finally {
      setDetailLoading(false)
    }
  }

  async function handleUpdateDetail() {
    if (!detailDocumentId || !viewDetail) return
    if (!editContent.trim()) {
      setDetailError('正文不能为空')
      return
    }

    setDetailSubmitting(true)
    setDetailError(null)
    try {
      const res = await fetch(`${DEFAULT_API_BASE_URL}/api/ai/rag/custom/${detailDocumentId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken ?? ''}`,
        },
        body: JSON.stringify({
          title: editTitle.trim() || undefined,
          content: editContent,
          contentType: editContentType,
          linkUrls: normalizeInputRows(editLinkUrls),
          linkTitles: normalizeInputRows(editLinkTitles),
          linkDescriptions: normalizeInputRows(editLinkDescriptions),
          imageUrls: normalizeInputRows(editImageUrls),
          imageTitles: normalizeInputRows(editImageTitles),
          summary: editSummary.trim() || undefined,
          linkDisplayTitle: editLinkDisplayTitle.trim() || undefined,
          scope: viewDetail.sourceScope ?? 'published',
        }),
      })
      const json = await res.json().catch(() => null)
      if (!res.ok) {
        throw new Error(json?.message || '资料更新失败')
      }

      await fetchDocuments()
      await openDetail(detailDocumentId, false)
      setActionResult('资料已更新，RAG 检索内容已同步重建。')
    } catch (error) {
      setDetailError(error instanceof Error ? error.message : '资料更新失败')
    } finally {
      setDetailSubmitting(false)
    }
  }

  async function handleRebuildIndex() {
    setRebuilding(true)
    setActionError(null)
    setActionResult(null)
    try {
      const res = await fetch(`${DEFAULT_API_BASE_URL}/api/ai/rag/index/rebuild`, {
        method: 'POST', headers: { Authorization: `Bearer ${accessToken ?? ''}` },
      })
      if (!res.ok) {
        const json = await res.json().catch(() => null)
        throw new Error(json?.message || '简历索引重建失败')
      }
      setActionResult('简历主索引已重建完成。')
    } catch (error) {
      setActionError(error instanceof Error ? error.message : '简历索引重建失败')
    } finally { setRebuilding(false) }
  }

  async function handleExportUserDocs() {
    setExporting(true)
    setActionError(null)
    setActionResult(null)
    try {
      const res = await fetch(`${DEFAULT_API_BASE_URL}/api/ai/rag/user-docs/export`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${accessToken ?? ''}` },
      })
      const json = await res.json().catch(() => null)
      if (!res.ok) {
        throw new Error(json?.message || 'user_docs 备份导出失败')
      }
      const data = json?.data ?? json
      setActionResult(`user_docs 备份完成：共导出 ${data?.documentCount ?? 0} 条资料。`)
    } catch (error) {
      setActionError(error instanceof Error ? error.message : 'user_docs 备份导出失败')
    } finally {
      setExporting(false)
    }
  }

  async function handleResetUserDocs() {
    setResetting(true)
    setActionError(null)
    setActionResult(null)
    try {
      const res = await fetch(`${DEFAULT_API_BASE_URL}/api/ai/rag/user-docs/reset`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${accessToken ?? ''}` },
      })
      const json = await res.json().catch(() => null)
      if (!res.ok) {
        throw new Error(json?.message || 'user_docs 清空失败')
      }
      const data = json?.data ?? json
      setActionResult(`user_docs 已清空：删除 ${Array.isArray(data?.deletedDocumentIds) ? data.deletedDocumentIds.length : 0} 条资料，并清理对应向量。`)
      await fetchDocuments()
    } catch (error) {
      setActionError(error instanceof Error ? error.message : 'user_docs 清空失败')
    } finally {
      setResetting(false)
    }
  }

  async function handleReconcileUserDocsVectors() {
    setReconciling(true)
    setActionError(null)
    setActionResult(null)
    try {
      const res = await fetch(`${DEFAULT_API_BASE_URL}/api/ai/rag/user-docs/reconcile`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${accessToken ?? ''}` },
      })
      const json = await res.json().catch(() => null)
      if (!res.ok) {
        throw new Error(json?.message || 'user_docs 向量同步失败')
      }
      const data = json?.data ?? json
      const deletedOrphans = Array.isArray(data?.deletedOrphans) ? data.deletedOrphans.length : 0
      const reindexedDocuments = Array.isArray(data?.reindexedDocuments) ? data.reindexedDocuments.length : 0
      setActionResult(`user_docs 向量同步完成：清理残留 ${deletedOrphans} 条，重建资料 ${reindexedDocuments} 条。`)
      await fetchDocuments()
    } catch (error) {
      setActionError(error instanceof Error ? error.message : 'user_docs 向量同步失败')
    } finally {
      setReconciling(false)
    }
  }

  async function handleDelete(documentId: string) {
    setDeletingId(documentId)
    setActionError(null)
    setActionResult(null)
    try {
      const deletingPage = safeDocumentsPage
      const deletingLastVisibleDocument =
        pagedDocuments.length === 1 && documents.length > 1 && deletingPage > 1
      const res = await fetch(`${DEFAULT_API_BASE_URL}/api/ai/rag/documents/${documentId}`, {
        method: 'DELETE', headers: { Authorization: `Bearer ${accessToken ?? ''}` },
      })
      if (!res.ok) {
        const json = await res.json().catch(() => null)
        throw new Error(json?.message || '向量删除失败，未执行 DB 删除')
      }
      if (deletingLastVisibleDocument) {
        setDocumentsPage(deletingPage - 1)
      }
      await fetchDocuments()
      setActionResult(
        deletingLastVisibleDocument
          ? '资料已删除，并同步清理向量数据。当前页已无剩余资料，已自动返回上一页。'
          : '资料已删除，并同步清理向量数据。',
      )
    } catch (error) {
      setActionError(error instanceof Error ? error.message : '向量删除失败，未执行 DB 删除')
    } finally {
      setDeletingId(null)
      setDeletePopoverId(null)
    }
  }

  async function handleManageAction(actionKey: React.Key) {
    setActionsMenuOpen(false)

    switch (String(actionKey)) {
      case 'backup-user-docs':
        await handleExportUserDocs()
        break
      case 'reset-user-docs':
        await handleResetUserDocs()
        break
      case 'rebuild-rag-index':
        await handleRebuildIndex()
        break
      default:
        break
    }
  }

  async function handleCustomSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!content.trim()) return
    setIsSubmitting(true)
    setFormError(null)
    setFormResult(null)
    try {
      const res = await fetch(`${DEFAULT_API_BASE_URL}/api/ai/rag/custom`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken ?? ''}`,
        },
        body: JSON.stringify({
          title: title || undefined,
          content,
          contentType,
          linkUrls: normalizeInputRows(linkUrls),
          linkTitles: normalizeInputRows(linkTitles),
          linkDescriptions: normalizeInputRows(linkDescriptions),
          imageUrls: normalizeInputRows(imageUrls),
          imageTitles: normalizeInputRows(imageTitles),
          summary: summary.trim() || undefined,
          linkDisplayTitle: linkDisplayTitle.trim() || undefined,
          scope: 'published',
        }),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.message || '入库失败')
      const data = json.data ?? json
      setFormResult(`入库成功：${title || '资料'}，切块 ${data.chunkCount} 条`)
      setTitle('')
      setContent('')
      setSummary('')
      setLinkUrls([''])
      setLinkTitles([''])
      setLinkDescriptions([''])
      setImageUrls([''])
      setImageTitles([''])
      setLinkDisplayTitle('')
      setLinkSortableIds(buildSortableIds([''], 'rag-link', nextSortableId))
      setImageSortableIds(buildSortableIds([''], 'rag-image', nextSortableId))
      fetchDocuments()
    } catch (error) {
      setFormError(error instanceof Error ? error.message : '入库失败')
    } finally { setIsSubmitting(false) }
  }

  function handleLinkUrlsChange(nextValues: string[]) {
    setLinkUrls(nextValues)
  }

  function handleImageUrlsChange(nextValues: string[]) {
    setImageUrls(nextValues)
  }

  function handleEditLinkUrlsChange(nextValues: string[]) {
    setEditLinkUrls(nextValues)
  }

  function handleEditImageUrlsChange(nextValues: string[]) {
    setEditImageUrls(nextValues)
  }

  function handleLinkUrlsReorder(fromIndex: number, toIndex: number) {
    setLinkUrls((current) => reorderStringArray(current, fromIndex, toIndex))
    setLinkSortableIds((current) => reorderSortableIds(current, fromIndex, toIndex))
  }

  function handleImageUrlsReorder(fromIndex: number, toIndex: number) {
    setImageUrls((current) => reorderStringArray(current, fromIndex, toIndex))
    setImageSortableIds((current) => reorderSortableIds(current, fromIndex, toIndex))
  }

  function handleEditLinkUrlsReorder(fromIndex: number, toIndex: number) {
    setEditLinkUrls((current) => reorderStringArray(current, fromIndex, toIndex))
    setEditLinkSortableIds((current) => reorderSortableIds(current, fromIndex, toIndex))
  }

  function handleEditImageUrlsReorder(fromIndex: number, toIndex: number) {
    setEditImageUrls((current) => reorderStringArray(current, fromIndex, toIndex))
    setEditImageSortableIds((current) => reorderSortableIds(current, fromIndex, toIndex))
  }

  useEffect(() => { if (accessToken) fetchDocuments() }, [accessToken])

  return (
    <div className="stack">
      <Card>
        <CardHeader className="grid gap-3">
          <div className="flex flex-wrap gap-2">
            <Chip size="sm" variant="soft">RAG 管理</Chip>
            <Chip size="sm" variant="soft">{documents.length} 条资料</Chip>
          </div>
          <div className="grid gap-2">
            <CardTitle className="text-3xl font-semibold tracking-tight text-zinc-950 dark:text-white">
              RAG 知识库管理
            </CardTitle>
            <p className="max-w-4xl text-sm leading-7 text-zinc-500 dark:text-zinc-400">
              管理简历之外的 RAG 检索资料：通过自定义表单或文件上传添加兴趣爱好、技术博客、知识专栏和通用资料，已入库资料可在此管理。
            </p>
          </div>
        </CardHeader>
      </Card>

      {/* Tabs */}
      <Tabs aria-label="RAG 管理模块">
        <Tabs.List>
          <Tabs.Tab className="data-[selected=true]:border-b-2 data-[selected=true]:border-[color:var(--admin-primary)]" id="custom">自定义数据</Tabs.Tab>
          <Tabs.Tab className="data-[selected=true]:border-b-2 data-[selected=true]:border-[color:var(--admin-primary)]" id="upload">文件上传</Tabs.Tab>
          <Tabs.Tab className="data-[selected=true]:border-b-2 data-[selected=true]:border-[color:var(--admin-primary)]" id="manage">已入库管理</Tabs.Tab>
        </Tabs.List>

        {/* Tab 1: 自定义数据添加 */}
        <Tabs.Panel id="custom">
          <Card>
            <CardHeader>
              <CardTitle className="text-xl font-semibold text-zinc-950 dark:text-white">添加自定义数据</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="mb-4 text-sm leading-6 text-zinc-500 dark:text-zinc-400">
                输入标题、正文、简介和内容类型，系统自动语义分块写入 RAG 检索态。
              </p>
              <Form className="grid gap-4" onSubmit={(event) => void handleCustomSubmit(event)}>
                <label className="field">
                  <span>标题</span>
                  <Input onChange={(e) => setTitle(e.target.value)} placeholder="例如：我的易经学习心得" value={title} variant="secondary" />
                </label>
                <label className="field">
                  <span>正文</span>
                  <TextArea className="min-h-[10rem]" onChange={(e: any) => setContent(e.target.value)} placeholder="输入资料正文内容，支持 Markdown 格式..." value={content} />
                </label>
                <label className="field">
                  <span>简介（可选）</span>
                  <Input onChange={(e) => setSummary(e.target.value)} placeholder="不填时会由系统自动生成 3 句话内简介" value={summary} variant="secondary" />
                </label>
                <ContentTypeRadioGroup label="内容类型" onChange={setContentType} value={contentType} />
                <SortableRichUrlEditor
                  label="参考链接"
                  onChange={handleLinkUrlsChange}
                  onDescriptionsChange={setLinkDescriptions}
                  onReorder={handleLinkUrlsReorder}
                  onTitlesChange={setLinkTitles}
                  descriptions={linkDescriptions}
                  placeholder="https://..."
                  sensors={sensors}
                  sortableIds={linkSortableIds}
                  titles={linkTitles}
                  values={linkUrls}
                />
                <label className="field">
                  <span>链接展示标题（可选）</span>
                  <Input onChange={(e) => setLinkDisplayTitle(e.target.value)} placeholder='不填则显示"查看链接"' value={linkDisplayTitle} variant="secondary" />
                </label>
                <SortableUrlListEditor
                  label="参考图片"
                  onChange={handleImageUrlsChange}
                  onReorder={handleImageUrlsReorder}
                  placeholder="https://..."
                  sensors={sensors}
                  sortableIds={imageSortableIds}
                  values={imageUrls}
                />
                {formError ? <p className="rounded-xl bg-rose-50 px-3 py-2 text-sm text-rose-700 dark:bg-rose-500/10 dark:text-rose-300">{formError}</p> : null}
                {formResult ? <p className="rounded-xl bg-emerald-50 px-3 py-2 text-sm text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300">{formResult}</p> : null}
                <Button
                  className={adminPrimaryButtonClass}
                  isDisabled={!content.trim() || isSubmitting}
                  size="md"
                  type="submit"
                  variant="primary">
                  {isSubmitting ? <span className="inline-flex items-center gap-2"><Spinner size="sm" />正在写入...</span> : '提交并写入 RAG 检索态'}
                </Button>
              </Form>
            </CardContent>
          </Card>
        </Tabs.Panel>

        {/* Tab 2: 文件上传 */}
        <Tabs.Panel id="upload">
          <Card>
            <CardHeader>
              <CardTitle className="text-xl font-semibold text-zinc-950 dark:text-white">上传文件入库</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="mb-4 text-sm leading-6 text-zinc-500 dark:text-zinc-400">
                通过上传 md/txt/pdf/docx 文件的方式添加资料，系统自动提取文本并写入 RAG 检索态。
              </p>
              <AiUserDocIngestionPanel
                accessToken={accessToken}
                apiBaseUrl={DEFAULT_API_BASE_URL}
                canUpload={canUpload}
                onIngested={(result) => { setUploadResult(result); fetchDocuments() }}
              />
              {uploadResult ? (
                <div className="mt-4 grid gap-1 rounded-xl border border-emerald-200/80 bg-emerald-50/70 p-3 text-sm dark:border-emerald-500/20 dark:bg-emerald-500/10">
                  <strong className="text-emerald-800 dark:text-emerald-200">入库成功</strong>
                  <span className="text-emerald-700 dark:text-emerald-300">{uploadResult.fileName} · {uploadResult.sourceScope} · 切块 {uploadResult.chunkCount} 条</span>
                </div>
              ) : null}
            </CardContent>
          </Card>
        </Tabs.Panel>

        {/* Tab 3: 已入库管理 */}
        <Tabs.Panel id="manage">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between gap-4">
                <CardTitle className="text-xl font-semibold text-zinc-950 dark:text-white">已入库资料</CardTitle>
                <ButtonGroup className="shrink-0" size="sm">
                  <Button
                    className={adminPrimaryButtonClass}
                    isDisabled={reconciling}
                    onPress={() => void handleReconcileUserDocsVectors()}
                    size="sm">
                    {reconciling ? '同步中...' : '同步 user_docs 向量'}
                  </Button>
                  <Dropdown
                    isOpen={actionsMenuOpen}
                    onOpenChange={setActionsMenuOpen}>
                    <Button
                      aria-label="更多 user_docs 操作"
                      isIconOnly
                      size="sm">
                      <ButtonGroup.Separator />
                      <ChevronDownIcon />
                    </Button>
                    <Dropdown.Popover className="w-[max-content] min-w-[240px]" placement="bottom end">
                      <Dropdown.Menu onAction={(key) => void handleManageAction(key)}>
                        <Dropdown.Item
                          id="backup-user-docs"
                          textValue="备份 user_docs"
                          isDisabled={exporting}>
                          <div className="flex items-center gap-2">
                            <span>{exporting ? '备份中...' : '备份 user_docs'}</span>
                          </div>
                        </Dropdown.Item>
                        <Dropdown.Item
                          id="reset-user-docs"
                          textValue="清空 user_docs"
                          isDisabled={resetting}
                          variant="danger">
                          <div className="flex items-center gap-2">
                            <span>{resetting ? '清空中...' : '清空 user_docs'}</span>
                          </div>
                        </Dropdown.Item>
                        <Dropdown.Item
                          id="rebuild-rag-index"
                          textValue="重建简历索引"
                          isDisabled={rebuilding}
                          variant="danger">
                          <div className="flex items-center gap-2">
                            <span>{rebuilding ? '重建中...' : '重建简历索引'}</span>
                          </div>
                        </Dropdown.Item>
                      </Dropdown.Menu>
                    </Dropdown.Popover>
                  </Dropdown>
                </ButtonGroup>
              </div>
            </CardHeader>
            <CardContent>
              {actionError ? (
                <div className="mb-4 rounded-xl border border-rose-200/80 bg-rose-50/80 px-3 py-2 text-sm text-rose-900 dark:border-rose-500/20 dark:bg-rose-500/10 dark:text-rose-100">
                  {actionError}
                </div>
              ) : null}
              {actionResult ? (
                <div className="mb-4 rounded-xl border border-emerald-200/80 bg-emerald-50/80 px-3 py-2 text-sm text-emerald-900 dark:border-emerald-500/20 dark:bg-emerald-500/10 dark:text-emerald-100">
                  {actionResult}
                </div>
              ) : null}

              {documentsLoading ? (
                <div className="flex justify-center py-10 text-sm text-zinc-500">加载中...</div>
              ) : documents.length === 0 ? (
                <div className="grid min-h-[10rem] place-items-center rounded-[1rem] border border-dashed border-zinc-200/80 text-center dark:border-zinc-800">
                  <div className="grid gap-2">
                    <strong className="text-base text-zinc-950 dark:text-white">暂无入库资料</strong>
                    <span className="text-sm text-zinc-500 dark:text-zinc-400">在自定义数据或文件上传标签页添加资料后将出现在这里。</span>
                  </div>
                </div>
              ) : (
                <div className="grid gap-1.5">
                  {/* table header */}
                  <div className="grid grid-cols-[minmax(0,2fr)_5rem_minmax(0,3fr)_7rem_8rem] gap-2 px-3 py-1.5 text-xs font-medium text-zinc-400">
                    <span>标题</span>
                    <span>类型</span>
                    <span>内容预览</span>
                    <span>时间</span>
                    <span className="text-right">操作</span>
                  </div>
                  {pagedDocuments.map((doc) => (
                    <div
                      className="grid grid-cols-[minmax(0,2fr)_5rem_minmax(0,3fr)_7rem_8rem] items-center gap-2 rounded-xl border border-zinc-200/80 bg-white px-3 py-2.5 dark:border-zinc-800 dark:bg-zinc-950"
                      key={doc.id}>
                      <div className="min-w-0">
                        <div className="flex min-w-0 items-center gap-2">
                          <strong className="block truncate text-sm text-zinc-950 dark:text-white">{doc.title || '未命名'}</strong>
                          {doc.editable ? <Chip size="sm" variant="soft">可编辑</Chip> : null}
                          {doc.summary ? <Chip size="sm" variant="soft">有概览</Chip> : null}
                        </div>
                      </div>
                      <div>
                        <Chip size="sm" variant="soft">{contentTypeLabel(doc.contentType)}</Chip>
                      </div>
                      <div className="min-w-0">
                        <span className="line-clamp-2 text-xs text-zinc-400 dark:text-zinc-500">
                          {doc.summary ?? doc.preview ?? '暂无内容'}
                        </span>
                      </div>
                      <div>
                        <span className="text-xs text-zinc-400 dark:text-zinc-500">{formatDateTime(doc.createdAt)}</span>
                      </div>
                       <div className="flex items-center justify-end gap-0.5">
                         <Button
                           aria-label="查看详情"
                           className={actionIconClass}
                           isIconOnly
                           onPress={() => void openDetail(doc.id)}
                           size="sm"
                           variant="ghost">
                           <ViewIcon />
                         </Button>
                         {doc.editable ? (
                           <Button
                             aria-label="编辑资料"
                             className={actionIconClass}
                             isIconOnly
                             onPress={() => void openDetail(doc.id, true)}
                             size="sm"
                             variant="ghost">
                             <PencilIcon />
                           </Button>
                         ) : null}
                         <Popover
                           isOpen={deletePopoverId === doc.id}
                           onOpenChange={(open) => setDeletePopoverId(open ? doc.id : null)}>
                           <Popover.Trigger>
                             <Button
                               aria-label="删除"
                               className={actionIconClass}
                               isIconOnly
                               size="sm"
                               variant="ghost">
                               <TrashIcon />
                             </Button>
                           </Popover.Trigger>
                           <Popover.Content
                             className="max-w-64"
                             render={(props) => <div {...props} className={`${props.className} rounded-2xl border border-zinc-200/80 bg-white p-4 shadow-lg dark:border-zinc-700 dark:bg-zinc-900`} />}>
                             <div className="grid gap-2">
                               <strong className="text-sm text-zinc-950 dark:text-white">确认删除</strong>
                               <p className="text-sm text-zinc-500 dark:text-zinc-400">确定删除「{doc.title || '未命名'}」及其所有关联数据？</p>
                               <div className="flex justify-end gap-2">
                                 <Button onPress={() => setDeletePopoverId(null)} size="sm" variant="ghost">取消</Button>
                                 <Button
                                   onPress={() => handleDelete(doc.id)}
                                   size="sm"
                                   variant="danger">
                                   删除
                                 </Button>
                               </div>
                             </div>
                           </Popover.Content>
                         </Popover>
                      </div>
                    </div>
                  ))}
                  <div className="flex justify-end px-1 pt-3">
                    <div className="flex flex-col items-end gap-3 md:flex-row md:items-center md:justify-end">
                      <div className="flex flex-wrap items-center justify-end gap-3 text-sm text-zinc-500 dark:text-zinc-400">
                        <span data-testid="rag-documents-pagination-summary">
                          {`显示 ${documentsRangeStart}-${documentsRangeEnd} / 共 ${documents.length} 条`}
                        </span>
                        <label className="inline-flex items-center gap-2">
                          <span>每页</span>
                          <Select
                            aria-label="每页条数"
                            className="min-w-[5rem]"
                            onSelectionChange={(key) => {
                              setDocumentsPageSize(Number(String(key)) as (typeof PAGE_SIZE_OPTIONS)[number])
                              setDocumentsPage(1)
                            }}
                            selectedKey={String(documentsPageSize)}
                            variant="secondary">
                            <Select.Trigger aria-label="每页条数">
                              <Select.Value />
                              <Select.Indicator />
                            </Select.Trigger>
                            <Select.Popover>
                              <ListBox>
                                {PAGE_SIZE_SELECT_OPTIONS.map((option) => (
                                  <ListBox.Item id={option.value} key={option.value} textValue={option.label}>
                                    {option.label}
                                    <ListBox.ItemIndicator />
                                  </ListBox.Item>
                                ))}
                              </ListBox>
                            </Select.Popover>
                          </Select>
                          <span>条</span>
                        </label>
                      </div>
                      {documentsTotalPages > 1 ? (
                        <Pagination
                          className="w-full md:w-auto"
                          data-testid="rag-documents-pagination"
                          size="sm">
                          <Pagination.Content className="flex flex-wrap justify-end gap-1.5">
                            <Pagination.Item>
                              <Pagination.Previous
                                isDisabled={safeDocumentsPage === 1}
                                onPress={() => setDocumentsPage((current) => Math.max(1, current - 1))}>
                                <Pagination.PreviousIcon />
                                上一页
                              </Pagination.Previous>
                            </Pagination.Item>
                            {getPageNumbers(safeDocumentsPage, documentsTotalPages).map((targetPage, index) =>
                              targetPage === 'ellipsis' ? (
                                <Pagination.Item key={`ellipsis-${index}`}>
                                  <Pagination.Ellipsis />
                                </Pagination.Item>
                              ) : (
                                <Pagination.Item key={targetPage}>
                                  <Pagination.Link
                                    isActive={targetPage === safeDocumentsPage}
                                    onPress={() => setDocumentsPage(targetPage)}>
                                    {targetPage}
                                  </Pagination.Link>
                                </Pagination.Item>
                              ),
                            )}
                            <Pagination.Item>
                              <Pagination.Next
                                isDisabled={safeDocumentsPage === documentsTotalPages}
                                onPress={() =>
                                  setDocumentsPage((current) => Math.min(documentsTotalPages, current + 1))
                                }>
                                下一页
                                <Pagination.NextIcon />
                              </Pagination.Next>
                            </Pagination.Item>
                          </Pagination.Content>
                        </Pagination>
                      ) : null}
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </Tabs.Panel>
      </Tabs>

      <AdminDrawerShell
        dialogClassName="!flex h-screen w-[max(60vw,800px)] max-w-[92vw] flex-col !p-0"
        isOpen={Boolean(detailDocumentId)}
        onClose={closeDetail}>
        <Drawer.Header className="sticky top-0 z-10 border-b border-zinc-200/80 bg-white px-5 py-4 dark:border-zinc-800 dark:bg-zinc-950">
          <div className="grid min-w-0 flex-1 gap-1">
            <Drawer.Heading className="truncate text-lg font-semibold text-zinc-950 dark:text-white">
              {detailLoading ? '加载资料详情...' : isEditingDetail ? '编辑资料' : viewDetail?.title || '未命名'}
            </Drawer.Heading>
            {viewDetail ? (
              <div className="flex flex-wrap items-center gap-2">
                <Chip size="sm" variant="soft">{contentTypeLabel(viewDetail.contentType)}</Chip>
                <Chip size="sm" variant="soft">{viewDetail.sourceScope ?? 'published'}</Chip>
                {viewDetail.editable ? <Chip size="sm" variant="soft">自定义资料</Chip> : <Chip size="sm" variant="soft">只读</Chip>}
                <span className="text-xs text-zinc-400">{formatDateTime(viewDetail.updatedAt ?? viewDetail.createdAt)}</span>
              </div>
            ) : null}
          </div>
          <Drawer.CloseTrigger aria-label="关闭资料详情" />
        </Drawer.Header>

        <Drawer.Body className="min-h-0 flex-1 overflow-y-auto px-5 py-4">
          {detailLoading ? (
            <div className="flex items-center justify-center py-12">
              <Spinner size="lg" />
            </div>
          ) : detailError ? (
            <div className="rounded-xl border border-rose-200/80 bg-rose-50/80 px-3 py-2 text-sm text-rose-900 dark:border-rose-500/20 dark:bg-rose-500/10 dark:text-rose-100">
              {detailError}
            </div>
          ) : viewDetail ? (
            isEditingDetail ? (
              <Form className="grid gap-4" onSubmit={(event) => { event.preventDefault(); void handleUpdateDetail() }}>
                <label className="field">
                  <span>标题</span>
                  <Input
                    onChange={(event) => setEditTitle(event.target.value)}
                    placeholder="请输入资料标题"
                    value={editTitle}
                    variant="secondary"
                  />
                </label>
                <ContentTypeRadioGroup label="编辑内容类型" onChange={setEditContentType} value={editContentType} />
                <label className="field">
                  <span>正文</span>
                  <TextArea
                    className="min-h-[24rem]"
                    onChange={(event: any) => setEditContent(event.target.value)}
                    placeholder="输入资料正文内容，支持 Markdown 格式..."
                    value={editContent}
                  />
                </label>
                <label className="field">
                  <span>简介（可选）</span>
                  <TextArea
                    className="min-h-[8rem]"
                    onChange={(event: any) => setEditSummary(event.target.value)}
                    placeholder="若不填写，系统会根据正文自动生成 3 句话内简介..."
                    value={editSummary}
                  />
                </label>
                <SortableRichUrlEditor
                  label="参考链接"
                  onChange={handleEditLinkUrlsChange}
                  onDescriptionsChange={setEditLinkDescriptions}
                  onReorder={handleEditLinkUrlsReorder}
                  onTitlesChange={setEditLinkTitles}
                  descriptions={editLinkDescriptions}
                  placeholder="https://..."
                  sensors={sensors}
                  sortableIds={editLinkSortableIds}
                  titles={editLinkTitles}
                  values={editLinkUrls}
                />
                <label className="field">
                  <span>链接展示标题（可选）</span>
                  <Input onChange={(e) => setEditLinkDisplayTitle(e.target.value)} placeholder='不填则显示"查看链接"' value={editLinkDisplayTitle} variant="secondary" />
                </label>
                <SortableUrlListEditor
                  label="参考图片"
                  onChange={handleEditImageUrlsChange}
                  onReorder={handleEditImageUrlsReorder}
                  placeholder="https://..."
                  sensors={sensors}
                  sortableIds={editImageSortableIds}
                  values={editImageUrls}
                />
              </Form>
            ) : (
              <div className="grid gap-4 rounded-xl bg-zinc-50 p-4 dark:bg-zinc-900">
                <div className="grid gap-2 text-sm text-zinc-700 dark:text-zinc-300">
                  <div className="grid grid-cols-[6rem_1fr] gap-2">
                    <span className="text-xs text-zinc-400">文档 ID</span>
                    <span className="font-mono text-xs break-all">{viewDetail.id}</span>
                  </div>
                  <div className="grid grid-cols-[6rem_1fr] gap-2">
                    <span className="text-xs text-zinc-400">更新时间</span>
                    <span>{formatDateTime(viewDetail.updatedAt ?? viewDetail.createdAt)}</span>
                  </div>
                  {viewDetail.summary ? (
                    <div className="grid gap-1">
                      <span className="text-xs text-zinc-400">概览</span>
                      <p className="text-sm leading-6">{viewDetail.summary}</p>
                    </div>
                  ) : null}
                  {(viewDetail.linkUrls?.length ?? 0) > 0 || viewDetail.linkUrl ? (
                    <div className="grid gap-1">
                      <span className="text-xs text-zinc-400">参考链接</span>
                      <div className="grid gap-1">
                        {(viewDetail.linkUrls?.length ? viewDetail.linkUrls : [viewDetail.linkUrl]).filter(Boolean).map((url) => (
                          <a
                            className="break-all text-sky-600 underline underline-offset-2 dark:text-sky-300"
                            href={url}
                            key={url}
                            rel="noreferrer"
                            target="_blank">
                            {url}
                          </a>
                        ))}
                      </div>
                    </div>
                  ) : null}
                  {(viewDetail.imageUrls?.length ?? 0) > 0 ? (
                    <div className="grid gap-2">
                      <span className="text-xs text-zinc-400">参考图片</span>
                      <div className="grid gap-2 md:grid-cols-2">
                        {viewDetail.imageUrls?.map((url) => (
                          <a
                            className="block overflow-hidden rounded-xl border border-zinc-200/80 dark:border-zinc-800"
                            href={url}
                            key={url}
                            rel="noreferrer"
                            target="_blank">
                            <img alt="" className="h-36 w-full object-cover" src={url} />
                          </a>
                        ))}
                      </div>
                    </div>
                  ) : null}
                  <div className="grid gap-1">
                    <span className="text-xs text-zinc-400">正文</span>
                    <p className="whitespace-pre-wrap text-sm leading-6">{viewDetail.content || viewDetail.preview || '暂无内容'}</p>
                  </div>
                </div>
              </div>
            )
          ) : null}
        </Drawer.Body>

        <Drawer.Footer className="sticky bottom-0 z-10 border-t border-zinc-200/80 bg-white px-5 py-4 dark:border-zinc-800 dark:bg-zinc-950">
          {viewDetail && isEditingDetail ? (
            <div className="flex w-full justify-end gap-2">
              <Button
                onPress={() => {
                  seedDetailEditor(viewDetail)
                  setDetailError(null)
                  setIsEditingDetail(false)
                }}
                size="sm"
                variant="ghost">
                取消编辑
              </Button>
              <Button
                className={adminPrimaryButtonClass}
                isDisabled={detailSubmitting || !editContent.trim()}
                onPress={() => void handleUpdateDetail()}
                size="sm"
                variant="primary">
                {detailSubmitting ? '保存中...' : '保存修改'}
              </Button>
            </div>
          ) : (
            <div className="flex w-full justify-end gap-2">
              {viewDetail?.editable ? (
                <Button
                  onPress={() => {
                    seedDetailEditor(viewDetail)
                    setDetailError(null)
                    setIsEditingDetail(true)
                  }}
                  size="sm"
                  variant="secondary">
                  编辑资料
                </Button>
              ) : null}
            </div>
          )}
        </Drawer.Footer>
      </AdminDrawerShell>
    </div>
  )
}
