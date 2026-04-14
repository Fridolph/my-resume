'use client'

import { useSortable } from '@dnd-kit/sortable'
import {
  Button,
  Chip,
  CloseButton,
  Disclosure,
  Input,
  Popover,
  TextArea,
  Tooltip,
} from '@heroui/react'
import type { ComponentProps, ReactNode } from 'react'

import { buildSortableTransformStyle } from './draft-editor-helpers'
import type {
  EditorEntryProps,
  EditorSectionProps,
  IconActionButtonProps,
  LocalizedEditorFieldProps,
} from '../types/editor-primitives.types'

export function DisclosureChevron() {
  return (
    <svg aria-hidden="true" fill="none" height="16" viewBox="0 0 16 16" width="16">
      <path
        d="m4 6 4 4 4-4"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.8"
      />
    </svg>
  )
}

export function PlusIcon() {
  return (
    <svg aria-hidden="true" fill="none" height="16" viewBox="0 0 16 16" width="16">
      <path
        d="M8 3.5v9m4.5-4.5h-9"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.8"
      />
    </svg>
  )
}

export function TrashIcon() {
  return (
    <svg aria-hidden="true" fill="none" height="22" viewBox="0 0 24 24" width="22">
      <path
        d="M9.25 5.5h5.5m-7.5 2.5h9.5m-8 3.25v5.25m4-5.25v5.25m3.25-8.5-.45 6.02a1.75 1.75 0 0 1-1.75 1.6H10.2a1.75 1.75 0 0 1-1.75-1.6L8 8m1.75-2.5.35-1.05a1.2 1.2 0 0 1 1.13-.8h1.54a1.2 1.2 0 0 1 1.13.8l.35 1.05"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="2"
      />
    </svg>
  )
}

export function CloseActionButton({
  label,
  onClick,
  className,
}: {
  label: string
  onClick: () => void
  className?: string
}) {
  const dialogContent = ({ close }: { close: () => void }) => (
    <>
      <div className="space-y-1">
        <Popover.Heading className="text-sm font-semibold text-zinc-950 dark:text-white">
          确认删除？
        </Popover.Heading>
        <p className="text-sm leading-6 text-zinc-500 dark:text-zinc-400">
          {`将删除“${label}”对应内容，此操作不会自动恢复。`}
        </p>
      </div>
      <div className="flex justify-end gap-2">
        <Button onPress={close} size="sm" type="button" variant="ghost">
          取消
        </Button>
        <Button
          className="bg-rose-500 text-white hover:bg-rose-600"
          onPress={() => {
            onClick()
            close()
          }}
          size="sm"
          type="button"
          variant="danger">
          删除
        </Button>
      </div>
    </>
  )

  return (
    <Popover>
      <CloseButton
        aria-label={label}
        className={[
          'inline-grid h-7 w-7 min-w-7 place-items-center rounded-full border border-rose-200/90 bg-rose-50/85 p-1 text-[#999] transition-colors hover:border-rose-300 hover:bg-rose-100 hover:text-[#666] focus-visible:ring-2 focus-visible:ring-rose-500/25 [&_svg]:h-4 [&_svg]:w-4 dark:border-rose-500/20 dark:bg-rose-500/10 dark:text-zinc-400 dark:hover:border-rose-500/35 dark:hover:bg-rose-500/16 dark:hover:text-zinc-200',
          className,
        ]
          .filter(Boolean)
          .join(' ')}
      />
      <Popover.Content
        className="max-w-64 rounded-2xl border border-zinc-200/80 bg-white/95 p-0 shadow-[0_20px_45px_rgba(15,23,42,0.12)] backdrop-blur dark:border-zinc-800 dark:bg-zinc-950/95"
        offset={12}
        placement="bottom end">
        <Popover.Dialog
          aria-label={`${label} 删除确认`}
          className="space-y-4 p-4 outline-none">
          {dialogContent as unknown as ReactNode}
        </Popover.Dialog>
      </Popover.Content>
    </Popover>
  )
}

export function DragHandleIcon() {
  return (
    <svg aria-hidden="true" fill="none" height="16" viewBox="0 0 16 16" width="16">
      <circle cx="5.5" cy="2.75" fill="currentColor" r="1.35" />
      <circle cx="10.5" cy="2.75" fill="currentColor" r="1.35" />
      <circle cx="5.5" cy="8" fill="currentColor" r="1.2" />
      <circle cx="10.5" cy="8" fill="currentColor" r="1.2" />
      <circle cx="5.5" cy="13.25" fill="currentColor" r="1.35" />
      <circle cx="10.5" cy="13.25" fill="currentColor" r="1.35" />
    </svg>
  )
}

export function IconActionButton({
  icon,
  label,
  onClick,
  variant = 'outline',
  className,
  size = 'compact',
  tone = 'default',
  buttonProps,
}: IconActionButtonProps) {
  const forwardedButtonProps = (buttonProps ?? {}) as ComponentProps<typeof Button>
  const sizeClassName =
    size === 'compact'
      ? 'inline-grid h-7 w-7 min-w-7 place-items-center rounded-lg p-1 [&_svg]:h-4 [&_svg]:w-4 [&_svg]:shrink-0'
      : 'inline-flex h-10 w-10 min-w-10 items-center justify-center rounded-full px-0 md:h-11 md:w-11 md:min-w-11 [&_svg]:h-5 [&_svg]:w-5 [&_svg]:shrink-0 md:[&_svg]:h-5 md:[&_svg]:w-5'

  return (
    <Tooltip delay={300}>
      <Tooltip.Trigger>
        <Button
          {...forwardedButtonProps}
          aria-label={label}
          className={[
            sizeClassName,
            'transition-colors focus-visible:ring-2',
            tone === 'danger'
              ? 'border-rose-100/90 bg-rose-50/75 text-rose-500 hover:border-rose-200 hover:bg-rose-100 hover:text-rose-700 focus-visible:ring-rose-500/25 dark:border-rose-500/15 dark:bg-rose-500/10 dark:text-rose-200 dark:hover:border-rose-500/30 dark:hover:bg-rose-500/16 dark:hover:text-rose-100'
              : 'border-zinc-200/80 text-zinc-600 hover:border-zinc-300 hover:bg-zinc-100 hover:text-zinc-950 focus-visible:ring-blue-500/30 dark:border-zinc-800 dark:text-zinc-300 dark:hover:border-zinc-700 dark:hover:bg-zinc-900 dark:hover:text-white',
            forwardedButtonProps.className,
            className,
          ]
            .filter(Boolean)
            .join(' ')}
          isIconOnly
          onPress={onClick}
          size="sm"
          type="button"
          variant={variant}>
          {icon}
        </Button>
      </Tooltip.Trigger>
      <Tooltip.Content offset={10} placement="bottom">
        {label}
      </Tooltip.Content>
    </Tooltip>
  )
}

function SortableHandleButton({
  label,
  attributes,
  listeners,
}: {
  label: string
  attributes?: Record<string, unknown>
  listeners?: Record<string, unknown>
}) {
  return (
    <IconActionButton
      buttonProps={{
        ...(attributes as ComponentProps<typeof Button>),
        ...(listeners as ComponentProps<typeof Button>),
      }}
      icon={<DragHandleIcon />}
      label={label}
      onClick={() => undefined}
      variant="ghost"
    />
  )
}

export function SortableItemShell({
  id,
  dragHandleLabel,
  disabled = false,
  className,
  children,
}: {
  id: string
  dragHandleLabel: string
  disabled?: boolean
  className?: string
  children: (params: { dragHandle: ReactNode; isDragging: boolean }) => ReactNode
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({
      id,
      disabled,
    })

  const dragHandle = !disabled ? (
    <SortableHandleButton
      attributes={attributes as unknown as Record<string, unknown>}
      label={dragHandleLabel}
      listeners={listeners as unknown as Record<string, unknown>}
    />
  ) : null

  return (
    <div
      className={className}
      ref={setNodeRef}
      style={buildSortableTransformStyle(transform, transition, isDragging)}>
      {children({
        dragHandle,
        isDragging,
      })}
    </div>
  )
}

export function LocalizedEditorField({
  label,
  localeMode,
  onChange,
  rows = 4,
  sourceValue,
  value,
  variant = 'input',
}: LocalizedEditorFieldProps) {
  return (
    <label className="field">
      <span>{label}</span>
      {localeMode === 'en' ? (
        <span
          aria-hidden="true"
          className="rounded-[18px] border border-dashed border-zinc-200/80 bg-zinc-50 px-2.5 py-2 text-xs leading-5 text-zinc-500 dark:border-zinc-800 dark:bg-zinc-900/60 dark:text-zinc-400 md:rounded-2xl md:px-3 md:text-sm md:leading-6">
          主文案参考：
          {sourceValue || '当前主编辑还没有内容，可先回主编辑工作区补充文案。'}
        </span>
      ) : null}
      {variant === 'textarea' ? (
        <TextArea
          fullWidth
          onChange={(event) => onChange(event.target.value)}
          rows={rows}
          value={value}
          variant="secondary"
        />
      ) : (
        <Input
          fullWidth
          onChange={(event) => onChange(event.target.value)}
          value={value}
          variant="secondary"
        />
      )}
    </label>
  )
}

export function EditorSection({
  title,
  description,
  count,
  defaultExpanded = true,
  action,
  children,
}: EditorSectionProps) {
  return (
    <Disclosure.Root
      className="overflow-hidden rounded-[22px] border border-zinc-200/70 bg-white/85 dark:border-zinc-800 dark:bg-zinc-950/70 md:rounded-[28px]"
      defaultExpanded={defaultExpanded}
      data-slot="editor-section">
      <div
        className="group relative flex flex-col gap-2.5 border-b border-zinc-200/70 px-4 py-4 dark:border-zinc-800 md:flex-row md:items-center md:justify-between md:gap-3 md:px-6 md:py-5"
        data-slot="editor-section-header">
        <span className="pointer-events-none absolute left-3 top-1/2 inline-grid h-7 w-7 -translate-y-1/2 place-items-center rounded-md text-zinc-400 transition-colors group-hover:bg-zinc-100/80 group-hover:text-zinc-600 dark:text-zinc-500 dark:group-hover:bg-zinc-900/70 dark:group-hover:text-zinc-300 md:left-4">
          <Disclosure.Indicator>
            <span
              className="transition-transform duration-200 ease-out data-[expanded=false]:-rotate-180"
              data-slot="editor-disclosure-icon">
              <DisclosureChevron />
            </span>
          </Disclosure.Indicator>
        </span>
        <Disclosure.Heading className="min-w-0 flex-1 pl-10 md:pl-11">
          <Disclosure.Trigger
            aria-label={`${title} 模块开关`}
            className="group flex w-full items-start text-left">
            <div className="space-y-0.5 md:space-y-1">
              <div className="flex flex-wrap items-center gap-2">
                <h3 className="text-[0.95rem] font-semibold text-zinc-950 dark:text-white md:text-base">
                  {title}
                </h3>
                {typeof count === 'number' ? <Chip size="sm">{count} 条</Chip> : null}
              </div>
              <p className="muted text-sm leading-5 md:leading-6">{description}</p>
            </div>
          </Disclosure.Trigger>
        </Disclosure.Heading>
        {action ? <div className="shrink-0 self-center">{action}</div> : null}
      </div>
      <Disclosure.Content>
        <Disclosure.Body
          className="stack px-4 py-4 md:px-6 md:py-5"
          data-slot="editor-section-body">
          {children}
        </Disclosure.Body>
      </Disclosure.Content>
    </Disclosure.Root>
  )
}

export function EditorEntry({
  title,
  summary,
  toggleLabel,
  defaultExpanded = true,
  leadingAction,
  action,
  children,
  variant = 'default',
}: EditorEntryProps) {
  const entryShellClassName =
    variant === 'embedded'
      ? 'overflow-hidden rounded-[18px] border border-zinc-200/40 bg-transparent shadow-none dark:border-zinc-800/70 dark:bg-transparent md:rounded-[24px] md:border-zinc-200/60 md:bg-zinc-50/55 md:dark:bg-zinc-950/60'
      : 'overflow-hidden rounded-[18px] border border-zinc-200/50 bg-white/72 shadow-none dark:border-zinc-800/70 dark:bg-zinc-950/60 md:rounded-[24px] md:border-zinc-200/70 md:bg-white md:dark:bg-zinc-950/80'

  const entryHeaderClassName =
    'group relative flex flex-col gap-2.5 px-3.5 py-3 md:flex-row md:items-center md:justify-between md:gap-3 md:px-5 md:py-4'

  const entryBodyClassName =
    'stack border-t border-zinc-200/50 px-3.5 py-3 dark:border-zinc-800/70 md:border-zinc-200/60 md:px-5 md:py-4 md:dark:border-zinc-800/80'

  return (
    <Disclosure.Root
      className={entryShellClassName}
      defaultExpanded={defaultExpanded}
      data-slot="editor-entry">
      <div className={entryHeaderClassName} data-slot="editor-entry-header">
        <div className="flex min-w-0 flex-1 items-start gap-3 pl-10 md:pl-11">
          {leadingAction ? (
            <div className="shrink-0 self-start md:self-center">{leadingAction}</div>
          ) : null}
          <Disclosure.Heading className="min-w-0 flex-1">
            <Disclosure.Trigger
              aria-label={toggleLabel}
              className="flex w-full items-center justify-between gap-4 text-left">
              <div className="space-y-0.5 md:space-y-1">
                <h4 className="text-[0.95rem] font-semibold text-zinc-950 dark:text-white md:text-sm">
                  {title}
                </h4>
                <p className="muted text-sm leading-5 md:leading-6">{summary}</p>
              </div>
            </Disclosure.Trigger>
          </Disclosure.Heading>
        </div>
        <span className="pointer-events-none absolute left-2.5 top-1/2 inline-grid h-7 w-7 -translate-y-1/2 place-items-center rounded-md text-zinc-400 transition-colors group-hover:bg-zinc-100/80 group-hover:text-zinc-600 dark:text-zinc-500 dark:group-hover:bg-zinc-900/70 dark:group-hover:text-zinc-300 md:left-3">
          <Disclosure.Indicator>
            <span
              className="transition-transform duration-200 ease-out data-[expanded=false]:-rotate-180"
              data-slot="editor-disclosure-icon">
              <DisclosureChevron />
            </span>
          </Disclosure.Indicator>
        </span>
        {action ? <div className="shrink-0 self-center">{action}</div> : null}
      </div>
      <Disclosure.Content>
        <Disclosure.Body className={entryBodyClassName} data-slot="editor-entry-body">
          {children}
        </Disclosure.Body>
      </Disclosure.Content>
    </Disclosure.Root>
  )
}
