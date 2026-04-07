'use client';

import { useSortable } from '@dnd-kit/sortable';
import {
  Button,
  Chip,
  Disclosure,
  Input,
  TextArea,
  Tooltip,
} from '@heroui/react';
import type { ComponentProps, ReactNode } from 'react';

import { buildSortableTransformStyle, type EditorLocaleMode } from './draft-editor-helpers';

export function DisclosureChevron() {
  return (
    <svg aria-hidden="true" fill="none" height="16" viewBox="0 0 20 20" width="16">
      <path
        d="m5.5 7.5 4.5 4.5 4.5-4.5"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.8"
      />
    </svg>
  );
}

export function PlusIcon() {
  return (
    <svg aria-hidden="true" fill="none" height="18" viewBox="0 0 20 20" width="18">
      <path
        d="M10 4.5v11m5.5-5.5h-11"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.8"
      />
    </svg>
  );
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
  );
}

export function DragHandleIcon() {
  return (
    <svg aria-hidden="true" fill="none" height="22" viewBox="0 0 24 24" width="22">
      <circle cx="8" cy="7" fill="currentColor" r="1.7" />
      <circle cx="16" cy="7" fill="currentColor" r="1.7" />
      <circle cx="8" cy="12" fill="currentColor" r="1.7" />
      <circle cx="16" cy="12" fill="currentColor" r="1.7" />
      <circle cx="8" cy="17" fill="currentColor" r="1.7" />
      <circle cx="16" cy="17" fill="currentColor" r="1.7" />
    </svg>
  );
}

interface IconActionButtonProps {
  icon: ReactNode;
  label: string;
  onClick: () => void;
  variant?: 'ghost' | 'outline';
  className?: string;
  tone?: 'default' | 'danger';
  buttonProps?: ComponentProps<typeof Button>;
}

export function IconActionButton({
  icon,
  label,
  onClick,
  variant = 'outline',
  className,
  tone = 'default',
  buttonProps,
}: IconActionButtonProps) {
  const forwardedButtonProps = (buttonProps ?? {}) as ComponentProps<typeof Button>;

  return (
    <Tooltip delay={300}>
      <Tooltip.Trigger>
        <Button
          {...forwardedButtonProps}
          aria-label={label}
          className={[
            'h-11 w-11 min-w-11 rounded-full px-0 transition-colors focus-visible:ring-2 [&_svg]:h-6 [&_svg]:w-6 [&_svg]:shrink-0',
            tone === 'danger'
              ? 'border-rose-200/80 text-zinc-500 hover:border-rose-300 hover:bg-rose-50 hover:text-rose-600 focus-visible:ring-rose-500/30 dark:border-zinc-800 dark:text-zinc-300 dark:hover:border-rose-500/40 dark:hover:bg-rose-500/10 dark:hover:text-rose-300'
              : 'border-zinc-200/80 text-zinc-600 hover:border-zinc-300 hover:bg-zinc-100 hover:text-zinc-950 focus-visible:ring-blue-500/30 dark:border-zinc-800 dark:text-zinc-300 dark:hover:border-zinc-700 dark:hover:bg-zinc-900 dark:hover:text-white',
            forwardedButtonProps.className,
            className,
          ]
            .filter(Boolean)
            .join(' ')}
          isIconOnly
          onClick={onClick}
          size="sm"
          type="button"
          variant={variant}
        >
          {icon}
        </Button>
      </Tooltip.Trigger>
      <Tooltip.Content offset={10} placement="bottom">
        {label}
      </Tooltip.Content>
    </Tooltip>
  );
}

function SortableHandleButton({
  label,
  attributes,
  listeners,
}: {
  label: string;
  attributes?: Record<string, unknown>;
  listeners?: Record<string, unknown>;
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
  );
}

export function buildEntryActions({
  dragHandle,
  deleteAction,
}: {
  dragHandle: ReactNode;
  deleteAction: ReactNode;
}) {
  if (!dragHandle && !deleteAction) {
    return null;
  }

  return <div className="flex items-center gap-2">{dragHandle}{deleteAction}</div>;
}

export function SortableItemShell({
  id,
  dragHandleLabel,
  disabled = false,
  className,
  children,
}: {
  id: string;
  dragHandleLabel: string;
  disabled?: boolean;
  className?: string;
  children: (params: { dragHandle: ReactNode; isDragging: boolean }) => ReactNode;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id,
    disabled,
  });

  const dragHandle = !disabled ? (
    <SortableHandleButton
      attributes={attributes as unknown as Record<string, unknown>}
      label={dragHandleLabel}
      listeners={listeners as unknown as Record<string, unknown>}
    />
  ) : null;

  return (
    <div
      className={className}
      ref={setNodeRef}
      style={buildSortableTransformStyle(transform, transition, isDragging)}
    >
      {children({
        dragHandle,
        isDragging,
      })}
    </div>
  );
}

interface LocalizedEditorFieldProps {
  label: string;
  localeMode: EditorLocaleMode;
  onChange: (value: string) => void;
  rows?: number;
  sourceValue?: string;
  value: string;
  variant?: 'input' | 'textarea';
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
          className="rounded-2xl border border-dashed border-zinc-200/80 bg-zinc-50 px-3 py-2 text-sm leading-6 text-zinc-500 dark:border-zinc-800 dark:bg-zinc-900/60 dark:text-zinc-400"
        >
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
  );
}

interface EditorSectionProps {
  title: string;
  description: string;
  count?: number;
  defaultExpanded?: boolean;
  action?: ReactNode;
  children: ReactNode;
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
      className="overflow-hidden rounded-[28px] border border-zinc-200/70 bg-white/85 dark:border-zinc-800 dark:bg-zinc-950/70"
      defaultExpanded={defaultExpanded}
    >
      <div className="flex flex-col gap-3 border-b border-zinc-200/70 px-5 py-5 dark:border-zinc-800 md:flex-row md:items-start md:justify-between md:px-6">
        <Disclosure.Heading className="min-w-0 flex-1">
          <Disclosure.Trigger
            aria-label={`${title} 模块开关`}
            className="flex w-full items-start justify-between gap-4 text-left"
          >
            <div className="space-y-1">
              <div className="flex flex-wrap items-center gap-2">
                <h3 className="text-base font-semibold text-zinc-950 dark:text-white">
                  {title}
                </h3>
                {typeof count === 'number' ? (
                  <Chip size="sm">
                    {count}
                    {' '}
                    条
                  </Chip>
                ) : null}
              </div>
              <p className="muted">{description}</p>
            </div>
            <span className="inline-flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full border border-zinc-200 bg-zinc-50 text-zinc-500 dark:border-zinc-800 dark:bg-zinc-900/70 dark:text-zinc-300">
              <Disclosure.Indicator>
                <DisclosureChevron />
              </Disclosure.Indicator>
            </span>
          </Disclosure.Trigger>
        </Disclosure.Heading>
        {action ? <div className="shrink-0">{action}</div> : null}
      </div>
      <Disclosure.Content>
        <Disclosure.Body className="stack px-5 py-5 md:px-6">
          {children}
        </Disclosure.Body>
      </Disclosure.Content>
    </Disclosure.Root>
  );
}

interface EditorEntryProps {
  title: string;
  summary: string;
  toggleLabel: string;
  defaultExpanded?: boolean;
  action?: ReactNode;
  children: ReactNode;
  variant?: 'default' | 'embedded';
}

export function EditorEntry({
  title,
  summary,
  toggleLabel,
  defaultExpanded = true,
  action,
  children,
  variant = 'default',
}: EditorEntryProps) {
  const entryShellClassName =
    variant === 'embedded'
      ? 'overflow-hidden rounded-[24px] border border-zinc-200/60 bg-zinc-50/55 shadow-none dark:border-zinc-800/80 dark:bg-zinc-950/60'
      : 'overflow-hidden rounded-[24px] border border-zinc-200/70 bg-white dark:border-zinc-800 dark:bg-zinc-950/80';

  const entryHeaderClassName =
    'flex flex-col gap-3 px-4 py-4 md:flex-row md:items-start md:justify-between md:px-5';

  const entryBodyClassName =
    'stack border-t border-zinc-200/60 px-4 py-4 dark:border-zinc-800/80 md:px-5';

  return (
    <Disclosure.Root
      className={entryShellClassName}
      defaultExpanded={defaultExpanded}
    >
      <div className={entryHeaderClassName}>
        <Disclosure.Heading className="min-w-0 flex-1">
          <Disclosure.Trigger
            aria-label={toggleLabel}
            className="flex w-full items-start justify-between gap-4 text-left"
          >
            <div className="space-y-1">
              <h4 className="text-sm font-semibold text-zinc-950 dark:text-white">
                {title}
              </h4>
              <p className="muted">{summary}</p>
            </div>
            <span className="inline-flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full border border-zinc-200 bg-zinc-50 text-zinc-500 dark:border-zinc-800 dark:bg-zinc-900/70 dark:text-zinc-300">
              <Disclosure.Indicator>
                <DisclosureChevron />
              </Disclosure.Indicator>
            </span>
          </Disclosure.Trigger>
        </Disclosure.Heading>
        {action ? <div className="shrink-0">{action}</div> : null}
      </div>
      <Disclosure.Content>
        <Disclosure.Body className={entryBodyClassName}>
          {children}
        </Disclosure.Body>
      </Disclosure.Content>
    </Disclosure.Root>
  );
}
