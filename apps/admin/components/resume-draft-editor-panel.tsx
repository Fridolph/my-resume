'use client';

import {
  DndContext,
  KeyboardSensor,
  PointerSensor,
  TouchSensor,
  closestCenter,
  type DragEndEvent,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import {
  SortableContext,
  arrayMove,
  rectSortingStrategy,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { restrictToVerticalAxis } from '@dnd-kit/modifiers';
import {
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Chip,
  Disclosure,
  Input,
  TextArea,
  Tooltip,
} from '@heroui/react';
import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type ComponentProps,
  type CSSProperties,
  type ReactNode,
} from 'react';

import { fetchDraftResume, updateDraftResume } from '../lib/resume-draft-api';
import type {
  LocalizedText,
  ResumeDraftSnapshot,
  ResumeEducationItem,
  ResumeExperienceItem,
  ResumeHighlightItem,
  ResumeProfile,
  ResumeProfileHero,
  ResumeProfileInterestItem,
  ResumeProfileLink,
  ResumeProjectItem,
  ResumeSkillGroup,
  StandardResume,
} from '../lib/resume-types';

interface ResumeDraftEditorPanelProps {
  apiBaseUrl: string;
  accessToken: string;
  canEdit: boolean;
  loadDraft?: typeof fetchDraftResume;
  saveDraft?: typeof updateDraftResume;
}

type DraftEditorStatus = 'idle' | 'loading' | 'ready' | 'error';
type DraftFieldValues = Record<string, string>;
type EditorLocaleMode = 'zh' | 'en';
type SortableCollectionKey =
  | 'profileLinks'
  | 'profileInterests'
  | 'education'
  | 'experiences'
  | 'projects'
  | 'skills'
  | 'highlights';
type SortableCollectionState = Record<SortableCollectionKey, string[]>;

function cloneResume(resume: StandardResume): StandardResume {
  return JSON.parse(JSON.stringify(resume)) as StandardResume;
}

function formatIsoDateTime(iso: string): string {
  return new Date(iso).toLocaleString('zh-CN', {
    hour12: false,
  });
}

function createEmptyLocalizedText(): LocalizedText {
  return {
    zh: '',
    en: '',
  };
}

function createEmptyExperience(): ResumeExperienceItem {
  return {
    companyName: createEmptyLocalizedText(),
    role: createEmptyLocalizedText(),
    employmentType: createEmptyLocalizedText(),
    startDate: '',
    endDate: '',
    location: createEmptyLocalizedText(),
    summary: createEmptyLocalizedText(),
    highlights: [],
    technologies: [],
  };
}

function createEmptyProfileLink(): ResumeProfileLink {
  return {
    label: createEmptyLocalizedText(),
    url: '',
  };
}

function createEmptyProfileInterest(): ResumeProfileInterestItem {
  return {
    label: createEmptyLocalizedText(),
  };
}

function createEmptyProfileHero(): ResumeProfileHero {
  return {
    frontImageUrl: '/img/avatar.jpg',
    backImageUrl: '/img/avatar2.jpg',
    linkUrl: 'https://github.com/Fridolph/my-resume',
    slogans: [createEmptyLocalizedText(), createEmptyLocalizedText()],
  };
}

function createEmptyEducation(): ResumeEducationItem {
  return {
    schoolName: createEmptyLocalizedText(),
    degree: createEmptyLocalizedText(),
    fieldOfStudy: createEmptyLocalizedText(),
    startDate: '',
    endDate: '',
    location: createEmptyLocalizedText(),
    highlights: [],
  };
}

function createEmptyProject(): ResumeProjectItem {
  return {
    name: createEmptyLocalizedText(),
    role: createEmptyLocalizedText(),
    startDate: '',
    endDate: '',
    summary: createEmptyLocalizedText(),
    highlights: [],
    technologies: [],
    links: [],
  };
}

function createEmptySkillGroup(): ResumeSkillGroup {
  return {
    name: createEmptyLocalizedText(),
    keywords: [],
  };
}

function createEmptyHighlight(): ResumeHighlightItem {
  return {
    title: createEmptyLocalizedText(),
    description: createEmptyLocalizedText(),
  };
}

function createEmptySortableCollectionState(): SortableCollectionState {
  return {
    profileLinks: [],
    profileInterests: [],
    education: [],
    experiences: [],
    projects: [],
    skills: [],
    highlights: [],
  };
}

function buildSortableCollectionState(
  resume: StandardResume,
  createId: (scope: SortableCollectionKey) => string,
): SortableCollectionState {
  return {
    profileLinks: resume.profile.links.map(() => createId('profileLinks')),
    profileInterests: resume.profile.interests.map(() => createId('profileInterests')),
    education: resume.education.map(() => createId('education')),
    experiences: resume.experiences.map(() => createId('experiences')),
    projects: resume.projects.map(() => createId('projects')),
    skills: resume.skills.map(() => createId('skills')),
    highlights: resume.highlights.map(() => createId('highlights')),
  };
}

function collectionNeedsDraftFieldSync(collection: SortableCollectionKey): boolean {
  return (
    collection === 'education' ||
    collection === 'experiences' ||
    collection === 'projects' ||
    collection === 'skills'
  );
}

export function reorderResumeCollection(
  resume: StandardResume,
  collection: SortableCollectionKey,
  fromIndex: number,
  toIndex: number,
): StandardResume {
  const nextResume = cloneResume(resume);

  if (collection === 'profileLinks') {
    nextResume.profile.links = arrayMove(nextResume.profile.links, fromIndex, toIndex);
    return nextResume;
  }

  if (collection === 'profileInterests') {
    nextResume.profile.interests = arrayMove(nextResume.profile.interests, fromIndex, toIndex);
    return nextResume;
  }

  if (collection === 'education') {
    nextResume.education = arrayMove(nextResume.education, fromIndex, toIndex);
    return nextResume;
  }

  if (collection === 'experiences') {
    nextResume.experiences = arrayMove(nextResume.experiences, fromIndex, toIndex);
    return nextResume;
  }

  if (collection === 'projects') {
    nextResume.projects = arrayMove(nextResume.projects, fromIndex, toIndex);
    return nextResume;
  }

  if (collection === 'skills') {
    nextResume.skills = arrayMove(nextResume.skills, fromIndex, toIndex);
    return nextResume;
  }

  nextResume.highlights = arrayMove(nextResume.highlights, fromIndex, toIndex);
  return nextResume;
}

function buildSortableTransformStyle(
  transform: { x: number; y: number; scaleX?: number; scaleY?: number } | null,
  transition: string | undefined,
  isDragging: boolean,
): CSSProperties {
  return {
    transform: transform
      ? `translate3d(${transform.x}px, ${transform.y}px, 0) scale(${transform.scaleX ?? 1}, ${transform.scaleY ?? 1})`
      : undefined,
    transition,
    zIndex: isDragging ? 20 : undefined,
  };
}

function parseCommaSeparatedValues(value: string): string[] {
  return value
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean);
}

function formatCommaSeparatedValues(values: string[]): string {
  return values.join(', ');
}

function formatLineSeparatedValues(values: string[]): string {
  return values.join('\n');
}

function parseLineSeparatedValues(value: string): string[] {
  return value
    .split('\n')
    .map((item) => item.trim())
    .filter(Boolean);
}

function formatLocalizedLines(values: LocalizedText[], locale: 'zh' | 'en'): string {
  return values.map((item) => item[locale]).filter(Boolean).join('\n');
}

function mergeLocalizedLines(
  currentValues: LocalizedText[],
  locale: 'zh' | 'en',
  rawValue: string,
): LocalizedText[] {
  const nextValues = parseLineSeparatedValues(rawValue);
  const targetLength =
    locale === 'en'
      ? Math.max(currentValues.length, nextValues.length)
      : nextValues.length;

  return Array.from({ length: targetLength }, (_, index) => ({
    zh: locale === 'zh' ? nextValues[index] ?? '' : currentValues[index]?.zh ?? '',
    en: locale === 'en' ? nextValues[index] ?? '' : currentValues[index]?.en ?? '',
  })).filter((item) => item.zh || item.en);
}

function buildDraftFieldKey(
  scope: 'experience' | 'project' | 'education' | 'skill' | 'profile',
  index: number | 'interests' | 'hero',
  field: 'highlights' | 'technologies' | 'keywords' | 'interests' | 'slogans',
  locale?: 'zh' | 'en',
): string {
  return [scope, index, field, locale ?? 'plain'].join(':');
}

function buildDraftFieldValues(resume: StandardResume): DraftFieldValues {
  const nextValues: DraftFieldValues = {};

  resume.experiences.forEach((experience, index) => {
    nextValues[buildDraftFieldKey('experience', index, 'highlights', 'zh')] =
      formatLocalizedLines(experience.highlights, 'zh');
    nextValues[buildDraftFieldKey('experience', index, 'highlights', 'en')] =
      formatLocalizedLines(experience.highlights, 'en');
    nextValues[buildDraftFieldKey('experience', index, 'technologies')] =
      formatCommaSeparatedValues(experience.technologies);
  });

  resume.projects.forEach((project, index) => {
    nextValues[buildDraftFieldKey('project', index, 'highlights', 'zh')] =
      formatLocalizedLines(project.highlights, 'zh');
    nextValues[buildDraftFieldKey('project', index, 'highlights', 'en')] =
      formatLocalizedLines(project.highlights, 'en');
    nextValues[buildDraftFieldKey('project', index, 'technologies')] =
      formatCommaSeparatedValues(project.technologies);
  });

  resume.education.forEach((education, index) => {
    nextValues[buildDraftFieldKey('education', index, 'highlights', 'zh')] =
      formatLocalizedLines(education.highlights, 'zh');
    nextValues[buildDraftFieldKey('education', index, 'highlights', 'en')] =
      formatLocalizedLines(education.highlights, 'en');
  });

  resume.skills.forEach((skill, index) => {
    nextValues[buildDraftFieldKey('skill', index, 'keywords')] =
      formatLineSeparatedValues(skill.keywords);
  });

  nextValues[buildDraftFieldKey('profile', 'hero', 'slogans', 'zh')] =
    formatLocalizedLines(resume.profile.hero.slogans, 'zh');
  nextValues[buildDraftFieldKey('profile', 'hero', 'slogans', 'en')] =
    formatLocalizedLines(resume.profile.hero.slogans, 'en');

  return nextValues;
}

function copyLocalizedTextValue(value: LocalizedText) {
  value.en = value.zh;
}

function clearLocalizedTextValue(value: LocalizedText) {
  value.en = '';
}

function copyLocalizedLineValues(values: LocalizedText[]): LocalizedText[] {
  return values.map((item) => ({
    zh: item.zh,
    en: item.zh,
  }));
}

function clearLocalizedLineValues(values: LocalizedText[]): LocalizedText[] {
  return values.map((item) => ({
    zh: item.zh,
    en: '',
  }));
}

function copyProfileInterestValues(
  values: ResumeProfileInterestItem[],
): ResumeProfileInterestItem[] {
  return values.map((item) => ({
    ...item,
    label: {
      zh: item.label.zh,
      en: item.label.zh,
    },
  }));
}

function clearProfileInterestValues(
  values: ResumeProfileInterestItem[],
): ResumeProfileInterestItem[] {
  return values.map((item) => ({
    ...item,
    label: {
      zh: item.label.zh,
      en: '',
    },
  }));
}

function ensureHeroSlogans(hero: ResumeProfileHero): ResumeProfileHero {
  if (hero.slogans.length >= 2) {
    return hero;
  }

  return {
    ...hero,
    slogans: [...hero.slogans, ...Array.from({ length: 2 - hero.slogans.length }, () => createEmptyLocalizedText())],
  };
}

function DisclosureChevron() {
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

function PlusIcon() {
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

function TrashIcon() {
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

function DragHandleIcon() {
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

function IconActionButton({
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

function buildEntryActions({
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

function SortableItemShell({
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

function LocalizedEditorField({
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

function EditorSection({
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

function EditorEntry({
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

export function ResumeDraftEditorPanel({
  apiBaseUrl,
  accessToken,
  canEdit,
  loadDraft = fetchDraftResume,
  saveDraft = updateDraftResume,
}: ResumeDraftEditorPanelProps) {
  const [status, setStatus] = useState<DraftEditorStatus>('idle');
  const [draftSnapshot, setDraftSnapshot] = useState<ResumeDraftSnapshot | null>(
    null,
  );
  const [resumeDraft, setResumeDraft] = useState<StandardResume | null>(null);
  const [draftFieldValues, setDraftFieldValues] = useState<DraftFieldValues>({});
  const [sortableCollections, setSortableCollections] = useState<SortableCollectionState>(
    createEmptySortableCollectionState(),
  );
  const [editorLocaleMode, setEditorLocaleMode] = useState<EditorLocaleMode>('zh');
  const [pendingSave, setPendingSave] = useState(false);
  const [feedbackMessage, setFeedbackMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const sortableIdCounterRef = useRef(0);

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
  );

  function nextSortableId(scope: SortableCollectionKey) {
    sortableIdCounterRef.current += 1;
    return `${scope}-${sortableIdCounterRef.current}`;
  }

  function replaceSortableCollections(nextResume: StandardResume) {
    setSortableCollections(buildSortableCollectionState(nextResume, nextSortableId));
  }

  function updateSortableCollection(
    collection: SortableCollectionKey,
    updater: (currentIds: string[]) => string[],
  ) {
    setSortableCollections((current) => ({
      ...current,
      [collection]: updater(current[collection]),
    }));
  }

  useEffect(() => {
    if (!canEdit) {
      return;
    }

    setStatus('loading');
    setErrorMessage(null);
    setFeedbackMessage(null);

    loadDraft({
      apiBaseUrl,
      accessToken,
    })
      .then((snapshot) => {
        setDraftSnapshot(snapshot);
        setResumeDraft(cloneResume(snapshot.resume));
        setDraftFieldValues(buildDraftFieldValues(snapshot.resume));
        replaceSortableCollections(snapshot.resume);
        setStatus('ready');
      })
      .catch((error) => {
        setErrorMessage(
          error instanceof Error ? error.message : '草稿读取失败，请稍后重试',
        );
        setStatus('error');
      });
  }, [accessToken, apiBaseUrl, canEdit, loadDraft]);

  const lastUpdatedLabel = useMemo(() => {
    if (!draftSnapshot) {
      return null;
    }

    return formatIsoDateTime(draftSnapshot.updatedAt);
  }, [draftSnapshot]);

  const isTranslationMode = editorLocaleMode === 'en';

  function handleCollectionDragEnd(
    collection: SortableCollectionKey,
    event: DragEndEvent,
  ) {
    const { active, over } = event;

    if (!resumeDraft || !over || active.id === over.id) {
      return;
    }

    const collectionIds = sortableCollections[collection];
    const fromIndex = collectionIds.indexOf(String(active.id));
    const toIndex = collectionIds.indexOf(String(over.id));

    if (fromIndex === -1 || toIndex === -1 || fromIndex === toIndex) {
      return;
    }

    updateSortableCollection(collection, (currentIds) =>
      arrayMove(currentIds, fromIndex, toIndex),
    );

    updateResumeDraft(
      (draft) => {
        const nextDraft = reorderResumeCollection(draft, collection, fromIndex, toIndex);

        draft.meta = nextDraft.meta;
        draft.profile = nextDraft.profile;
        draft.education = nextDraft.education;
        draft.experiences = nextDraft.experiences;
        draft.projects = nextDraft.projects;
        draft.skills = nextDraft.skills;
        draft.highlights = nextDraft.highlights;
      },
      {
        syncDraftFields: collectionNeedsDraftFieldSync(collection),
      },
    );
  }

  function updateResumeDraft(
    mutator: (draft: StandardResume) => void,
    options?: { syncDraftFields?: boolean },
  ) {
    let nextDraftForDraftFields: StandardResume | null = null;

    setResumeDraft((current) => {
      if (!current) {
        return current;
      }

      const nextDraft = cloneResume(current);
      mutator(nextDraft);
      nextDraftForDraftFields = nextDraft;
      return nextDraft;
    });

    if (options?.syncDraftFields && nextDraftForDraftFields) {
      setDraftFieldValues(buildDraftFieldValues(nextDraftForDraftFields));
    }
  }

  function showTranslationPlaceholder(scopeTitle: string) {
    setErrorMessage(null);
    setFeedbackMessage(`${scopeTitle} 的 AI 翻译入口将在后续 issue 接入，这里先把工作区和人工校对路径立住。`);
  }

  function copyProfileTranslations() {
    updateResumeDraft(
      (draft) => {
        copyLocalizedTextValue(draft.profile.fullName);
        copyLocalizedTextValue(draft.profile.headline);
        copyLocalizedTextValue(draft.profile.summary);
        copyLocalizedTextValue(draft.profile.location);
        draft.profile.hero = ensureHeroSlogans(draft.profile.hero);
        draft.profile.links.forEach((link) => {
          copyLocalizedTextValue(link.label);
        });
        draft.profile.interests = copyProfileInterestValues(draft.profile.interests);
        draft.profile.hero.slogans = copyLocalizedLineValues(draft.profile.hero.slogans);
      },
      { syncDraftFields: true },
    );
    setErrorMessage(null);
    setFeedbackMessage('已将基础信息中的中文内容复制到英文翻译工作区。');
  }

  function clearProfileTranslations() {
    updateResumeDraft(
      (draft) => {
        clearLocalizedTextValue(draft.profile.fullName);
        clearLocalizedTextValue(draft.profile.headline);
        clearLocalizedTextValue(draft.profile.summary);
        clearLocalizedTextValue(draft.profile.location);
        draft.profile.hero = ensureHeroSlogans(draft.profile.hero);
        draft.profile.links.forEach((link) => {
          clearLocalizedTextValue(link.label);
        });
        draft.profile.interests = clearProfileInterestValues(draft.profile.interests);
        draft.profile.hero.slogans = clearLocalizedLineValues(draft.profile.hero.slogans);
      },
      { syncDraftFields: true },
    );
    setErrorMessage(null);
    setFeedbackMessage('已清空基础信息中的英文翻译字段。');
  }

  function copyEducationTranslations() {
    updateResumeDraft(
      (draft) => {
        draft.education.forEach((education) => {
          copyLocalizedTextValue(education.schoolName);
          copyLocalizedTextValue(education.degree);
          copyLocalizedTextValue(education.fieldOfStudy);
          copyLocalizedTextValue(education.location);
          education.highlights = copyLocalizedLineValues(education.highlights);
        });
      },
      { syncDraftFields: true },
    );
    setErrorMessage(null);
    setFeedbackMessage('已将教育经历中的中文内容复制到英文翻译工作区。');
  }

  function clearEducationTranslations() {
    updateResumeDraft(
      (draft) => {
        draft.education.forEach((education) => {
          clearLocalizedTextValue(education.schoolName);
          clearLocalizedTextValue(education.degree);
          clearLocalizedTextValue(education.fieldOfStudy);
          clearLocalizedTextValue(education.location);
          education.highlights = clearLocalizedLineValues(education.highlights);
        });
      },
      { syncDraftFields: true },
    );
    setErrorMessage(null);
    setFeedbackMessage('已清空教育经历中的英文翻译字段。');
  }

  function copyExperienceTranslations() {
    updateResumeDraft(
      (draft) => {
        draft.experiences.forEach((experience) => {
          copyLocalizedTextValue(experience.companyName);
          copyLocalizedTextValue(experience.role);
          copyLocalizedTextValue(experience.employmentType);
          copyLocalizedTextValue(experience.location);
          copyLocalizedTextValue(experience.summary);
          experience.highlights = copyLocalizedLineValues(experience.highlights);
        });
      },
      { syncDraftFields: true },
    );
    setErrorMessage(null);
    setFeedbackMessage('已将工作经历中的中文内容复制到英文翻译工作区。');
  }

  function clearExperienceTranslations() {
    updateResumeDraft(
      (draft) => {
        draft.experiences.forEach((experience) => {
          clearLocalizedTextValue(experience.companyName);
          clearLocalizedTextValue(experience.role);
          clearLocalizedTextValue(experience.employmentType);
          clearLocalizedTextValue(experience.location);
          clearLocalizedTextValue(experience.summary);
          experience.highlights = clearLocalizedLineValues(experience.highlights);
        });
      },
      { syncDraftFields: true },
    );
    setErrorMessage(null);
    setFeedbackMessage('已清空工作经历中的英文翻译字段。');
  }

  function copyProjectTranslations() {
    updateResumeDraft(
      (draft) => {
        draft.projects.forEach((project) => {
          copyLocalizedTextValue(project.name);
          copyLocalizedTextValue(project.role);
          copyLocalizedTextValue(project.summary);
          project.highlights = copyLocalizedLineValues(project.highlights);
          project.links.forEach((link) => {
            copyLocalizedTextValue(link.label);
          });
        });
      },
      { syncDraftFields: true },
    );
    setErrorMessage(null);
    setFeedbackMessage('已将项目经历中的中文内容复制到英文翻译工作区。');
  }

  function clearProjectTranslations() {
    updateResumeDraft(
      (draft) => {
        draft.projects.forEach((project) => {
          clearLocalizedTextValue(project.name);
          clearLocalizedTextValue(project.role);
          clearLocalizedTextValue(project.summary);
          project.highlights = clearLocalizedLineValues(project.highlights);
          project.links.forEach((link) => {
            clearLocalizedTextValue(link.label);
          });
        });
      },
      { syncDraftFields: true },
    );
    setErrorMessage(null);
    setFeedbackMessage('已清空项目经历中的英文翻译字段。');
  }

  function copySkillTranslations() {
    updateResumeDraft((draft) => {
      draft.skills.forEach((skill) => {
        copyLocalizedTextValue(skill.name);
      });
    });
    setErrorMessage(null);
    setFeedbackMessage('已将技能组名称复制到英文翻译工作区。');
  }

  function clearSkillTranslations() {
    updateResumeDraft((draft) => {
      draft.skills.forEach((skill) => {
        clearLocalizedTextValue(skill.name);
      });
    });
    setErrorMessage(null);
    setFeedbackMessage('已清空技能组中的英文翻译字段。');
  }

  function copyHighlightTranslations() {
    updateResumeDraft((draft) => {
      draft.highlights.forEach((highlight) => {
        copyLocalizedTextValue(highlight.title);
        copyLocalizedTextValue(highlight.description);
      });
    });
    setErrorMessage(null);
    setFeedbackMessage('已将亮点中的中文内容复制到英文翻译工作区。');
  }

  function clearHighlightTranslations() {
    updateResumeDraft((draft) => {
      draft.highlights.forEach((highlight) => {
        clearLocalizedTextValue(highlight.title);
        clearLocalizedTextValue(highlight.description);
      });
    });
    setErrorMessage(null);
    setFeedbackMessage('已清空亮点中的英文翻译字段。');
  }

  function renderTranslationActions(
    scopeTitle: string,
    handlers: {
      onCopy: () => void;
      onClear: () => void;
    },
  ) {
    if (!isTranslationMode) {
      return null;
    }

    return (
      <div className="flex flex-wrap justify-end gap-2">
        <Button
          aria-label={`${scopeTitle} 复制中文到英文`}
          onClick={handlers.onCopy}
          size="sm"
          type="button"
          variant="outline"
        >
          复制中文到英文
        </Button>
        <Button
          aria-label={`${scopeTitle} 清空英文`}
          onClick={handlers.onClear}
          size="sm"
          type="button"
          variant="ghost"
        >
          清空英文
        </Button>
        <Button
          aria-label={`${scopeTitle} AI 翻译入口预留`}
          onClick={() => showTranslationPlaceholder(scopeTitle)}
          size="sm"
          type="button"
          variant="ghost"
        >
          AI 翻译入口预留
        </Button>
      </div>
    );
  }

  function updateProfileLocalizedField(
    field: keyof Pick<ResumeProfile, 'fullName' | 'headline' | 'summary' | 'location'>,
    locale: 'zh' | 'en',
    value: string,
  ) {
    updateResumeDraft((draft) => {
      draft.profile[field][locale] = value;
    });
  }

  function updateProfilePlainField(
    field: keyof Pick<ResumeProfile, 'email' | 'phone' | 'website'>,
    value: string,
  ) {
    updateResumeDraft((draft) => {
      draft.profile[field] = value;
    });
  }

  function updateProfileHeroField(
    field: keyof Pick<ResumeProfileHero, 'frontImageUrl' | 'backImageUrl' | 'linkUrl'>,
    value: string,
  ) {
    updateResumeDraft((draft) => {
      draft.profile.hero = ensureHeroSlogans(draft.profile.hero ?? createEmptyProfileHero());
      draft.profile.hero[field] = value;
    });
  }

  function updateProfileHeroSlogans(locale: 'zh' | 'en', value: string) {
    setDraftFieldValues((current) => ({
      ...current,
      [buildDraftFieldKey('profile', 'hero', 'slogans', locale)]: value,
    }));

    updateResumeDraft((draft) => {
      draft.profile.hero = ensureHeroSlogans(draft.profile.hero ?? createEmptyProfileHero());
      draft.profile.hero.slogans = mergeLocalizedLines(
        draft.profile.hero.slogans,
        locale,
        value,
      ).slice(0, 2);

      if (draft.profile.hero.slogans.length < 2) {
        draft.profile.hero = ensureHeroSlogans(draft.profile.hero);
      }
    });
  }

  function updateProfileLinkField(
    index: number,
    field: 'label' | 'url' | 'icon',
    value: string,
    locale?: 'zh' | 'en',
  ) {
    updateResumeDraft((draft) => {
      if (field === 'url') {
        draft.profile.links[index].url = value;
        return;
      }

      if (field === 'icon') {
        draft.profile.links[index].icon = value.trim() ? value : undefined;
        return;
      }

      draft.profile.links[index].label[locale ?? 'zh'] = value;
    });
  }

  function updateProfileInterestField(
    index: number,
    field: 'label' | 'icon',
    value: string,
    locale?: 'zh' | 'en',
  ) {
    updateResumeDraft((draft) => {
      if (field === 'icon') {
        draft.profile.interests[index].icon = value.trim() ? value : undefined;
        return;
      }

      draft.profile.interests[index].label[locale ?? 'zh'] = value;
    });
  }

  function addProfileLink() {
    updateResumeDraft((draft) => {
      draft.profile.links.push(createEmptyProfileLink());
    });
    updateSortableCollection('profileLinks', (currentIds) => [
      ...currentIds,
      nextSortableId('profileLinks'),
    ]);
  }

  function addProfileInterest() {
    updateResumeDraft((draft) => {
      draft.profile.interests.push(createEmptyProfileInterest());
    });
    updateSortableCollection('profileInterests', (currentIds) => [
      ...currentIds,
      nextSortableId('profileInterests'),
    ]);
  }

  function removeProfileLink(index: number) {
    updateResumeDraft((draft) => {
      draft.profile.links.splice(index, 1);
    });
    updateSortableCollection('profileLinks', (currentIds) =>
      currentIds.filter((_, currentIndex) => currentIndex !== index),
    );
  }

  function removeProfileInterest(index: number) {
    updateResumeDraft((draft) => {
      draft.profile.interests.splice(index, 1);
    });
    updateSortableCollection('profileInterests', (currentIds) =>
      currentIds.filter((_, currentIndex) => currentIndex !== index),
    );
  }

  function updateEducationLocalizedField(
    index: number,
    field: keyof Pick<
      ResumeEducationItem,
      'schoolName' | 'degree' | 'fieldOfStudy' | 'location'
    >,
    locale: 'zh' | 'en',
    value: string,
  ) {
    updateResumeDraft((draft) => {
      draft.education[index][field][locale] = value;
    });
  }

  function updateEducationPlainField(
    index: number,
    field: keyof Pick<ResumeEducationItem, 'startDate' | 'endDate'>,
    value: string,
  ) {
    updateResumeDraft((draft) => {
      draft.education[index][field] = value;
    });
  }

  function updateEducationHighlights(
    index: number,
    locale: 'zh' | 'en',
    value: string,
  ) {
    setDraftFieldValues((current) => ({
      ...current,
      [buildDraftFieldKey('education', index, 'highlights', locale)]: value,
    }));

    updateResumeDraft((draft) => {
      draft.education[index].highlights = mergeLocalizedLines(
        draft.education[index].highlights,
        locale,
        value,
      );
    });
  }

  function addEducation() {
    updateResumeDraft(
      (draft) => {
        draft.education.push(createEmptyEducation());
      },
      { syncDraftFields: true },
    );
    updateSortableCollection('education', (currentIds) => [
      ...currentIds,
      nextSortableId('education'),
    ]);
  }

  function removeEducation(index: number) {
    updateResumeDraft(
      (draft) => {
        draft.education.splice(index, 1);
      },
      { syncDraftFields: true },
    );
    updateSortableCollection('education', (currentIds) =>
      currentIds.filter((_, currentIndex) => currentIndex !== index),
    );
  }

  function updateExperienceLocalizedField(
    index: number,
    field: keyof Pick<
      ResumeExperienceItem,
      'companyName' | 'role' | 'employmentType' | 'location' | 'summary'
    >,
    locale: 'zh' | 'en',
    value: string,
  ) {
    updateResumeDraft((draft) => {
      draft.experiences[index][field][locale] = value;
    });
  }

  function updateExperiencePlainField(
    index: number,
    field: keyof Pick<ResumeExperienceItem, 'startDate' | 'endDate'>,
    value: string,
  ) {
    updateResumeDraft((draft) => {
      draft.experiences[index][field] = value;
    });
  }

  function updateExperienceHighlights(
    index: number,
    locale: 'zh' | 'en',
    value: string,
  ) {
    setDraftFieldValues((current) => ({
      ...current,
      [buildDraftFieldKey('experience', index, 'highlights', locale)]: value,
    }));

    updateResumeDraft((draft) => {
      draft.experiences[index].highlights = mergeLocalizedLines(
        draft.experiences[index].highlights,
        locale,
        value,
      );
    });
  }

  function updateExperienceTechnologies(index: number, value: string) {
    setDraftFieldValues((current) => ({
      ...current,
      [buildDraftFieldKey('experience', index, 'technologies')]: value,
    }));

    updateResumeDraft((draft) => {
      draft.experiences[index].technologies = parseCommaSeparatedValues(value);
    });
  }

  function addExperience() {
    updateResumeDraft((draft) => {
      draft.experiences.push(createEmptyExperience());
    }, { syncDraftFields: true });
    updateSortableCollection('experiences', (currentIds) => [
      ...currentIds,
      nextSortableId('experiences'),
    ]);
  }

  function removeExperience(index: number) {
    updateResumeDraft((draft) => {
      draft.experiences.splice(index, 1);
    }, { syncDraftFields: true });
    updateSortableCollection('experiences', (currentIds) =>
      currentIds.filter((_, currentIndex) => currentIndex !== index),
    );
  }

  function updateProjectLocalizedField(
    index: number,
    field: keyof Pick<ResumeProjectItem, 'name' | 'role' | 'summary'>,
    locale: 'zh' | 'en',
    value: string,
  ) {
    updateResumeDraft((draft) => {
      draft.projects[index][field][locale] = value;
    });
  }

  function updateProjectPlainField(
    index: number,
    field: keyof Pick<ResumeProjectItem, 'startDate' | 'endDate'>,
    value: string,
  ) {
    updateResumeDraft((draft) => {
      draft.projects[index][field] = value;
    });
  }

  function updateProjectHighlights(index: number, locale: 'zh' | 'en', value: string) {
    setDraftFieldValues((current) => ({
      ...current,
      [buildDraftFieldKey('project', index, 'highlights', locale)]: value,
    }));

    updateResumeDraft((draft) => {
      draft.projects[index].highlights = mergeLocalizedLines(
        draft.projects[index].highlights,
        locale,
        value,
      );
    });
  }

  function updateProjectTechnologies(index: number, value: string) {
    setDraftFieldValues((current) => ({
      ...current,
      [buildDraftFieldKey('project', index, 'technologies')]: value,
    }));

    updateResumeDraft((draft) => {
      draft.projects[index].technologies = parseCommaSeparatedValues(value);
    });
  }

  function updateProjectLinkField(
    projectIndex: number,
    linkIndex: number,
    field: 'label' | 'url',
    value: string,
    locale?: 'zh' | 'en',
  ) {
    updateResumeDraft((draft) => {
      if (field === 'url') {
        draft.projects[projectIndex].links[linkIndex].url = value;
        return;
      }

      draft.projects[projectIndex].links[linkIndex].label[locale ?? 'zh'] = value;
    });
  }

  function addProjectLink(projectIndex: number) {
    updateResumeDraft((draft) => {
      draft.projects[projectIndex].links.push(createEmptyProfileLink());
    });
  }

  function removeProjectLink(projectIndex: number, linkIndex: number) {
    updateResumeDraft((draft) => {
      draft.projects[projectIndex].links.splice(linkIndex, 1);
    });
  }

  function addProject() {
    updateResumeDraft((draft) => {
      draft.projects.push(createEmptyProject());
    }, { syncDraftFields: true });
    updateSortableCollection('projects', (currentIds) => [
      ...currentIds,
      nextSortableId('projects'),
    ]);
  }

  function removeProject(index: number) {
    updateResumeDraft((draft) => {
      draft.projects.splice(index, 1);
    }, { syncDraftFields: true });
    updateSortableCollection('projects', (currentIds) =>
      currentIds.filter((_, currentIndex) => currentIndex !== index),
    );
  }

  function updateSkillLocalizedField(
    index: number,
    locale: 'zh' | 'en',
    value: string,
  ) {
    updateResumeDraft((draft) => {
      draft.skills[index].name[locale] = value;
    });
  }

  function updateSkillKeywords(index: number, value: string) {
    setDraftFieldValues((current) => ({
      ...current,
      [buildDraftFieldKey('skill', index, 'keywords')]: value,
    }));

    updateResumeDraft((draft) => {
      draft.skills[index].keywords = parseLineSeparatedValues(value);
    });
  }

  function addSkillGroup() {
    updateResumeDraft(
      (draft) => {
        draft.skills.push(createEmptySkillGroup());
      },
      { syncDraftFields: true },
    );
    updateSortableCollection('skills', (currentIds) => [
      ...currentIds,
      nextSortableId('skills'),
    ]);
  }

  function removeSkillGroup(index: number) {
    updateResumeDraft(
      (draft) => {
        draft.skills.splice(index, 1);
      },
      { syncDraftFields: true },
    );
    updateSortableCollection('skills', (currentIds) =>
      currentIds.filter((_, currentIndex) => currentIndex !== index),
    );
  }

  function updateHighlightLocalizedField(
    index: number,
    field: keyof Pick<ResumeHighlightItem, 'title' | 'description'>,
    locale: 'zh' | 'en',
    value: string,
  ) {
    updateResumeDraft((draft) => {
      draft.highlights[index][field][locale] = value;
    });
  }

  function addHighlight() {
    updateResumeDraft((draft) => {
      draft.highlights.push(createEmptyHighlight());
    });
    updateSortableCollection('highlights', (currentIds) => [
      ...currentIds,
      nextSortableId('highlights'),
    ]);
  }

  function removeHighlight(index: number) {
    updateResumeDraft((draft) => {
      draft.highlights.splice(index, 1);
    });
    updateSortableCollection('highlights', (currentIds) =>
      currentIds.filter((_, currentIndex) => currentIndex !== index),
    );
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!draftSnapshot || !resumeDraft) {
      return;
    }

    setPendingSave(true);
    setErrorMessage(null);
    setFeedbackMessage(null);

    try {
      const nextSnapshot = await saveDraft({
        apiBaseUrl,
        accessToken,
        resume: cloneResume(resumeDraft),
      });

      setDraftSnapshot(nextSnapshot);
      setResumeDraft(cloneResume(nextSnapshot.resume));
      setDraftFieldValues(buildDraftFieldValues(nextSnapshot.resume));
      replaceSortableCollections(nextSnapshot.resume);
      setFeedbackMessage('草稿已保存。公开站内容不会自动变化，仍需手动发布。');
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : '草稿保存失败，请稍后重试',
      );
    } finally {
      setPendingSave(false);
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
    );
  }

  return (
    <Card className="border border-zinc-200/70 dark:border-zinc-800">
      <CardHeader className="flex flex-col items-start gap-2">
        <p className="eyebrow">草稿编辑</p>
        <CardTitle>完整标准简历模块编辑</CardTitle>
        <CardDescription>
          当前后台已按标准简历模型接通基础信息、教育、工作、项目、技能与亮点编辑，并改成“中文主编辑 + 英文翻译工作区”的维护方式，保存后仍需手动发布。
        </CardDescription>
      </CardHeader>
      <CardContent className="stack">
        {status === 'loading' ? <p className="muted">正在加载草稿...</p> : null}

        {status === 'error' && errorMessage ? (
          <p className="error-text">{errorMessage}</p>
        ) : null}

        {status === 'ready' && resumeDraft && draftSnapshot ? (
          <form className="stack" onSubmit={(event) => void handleSubmit(event)}>
            <div className="flex flex-col gap-3 rounded-[24px] border border-zinc-200/70 bg-zinc-50/90 px-5 py-4 dark:border-zinc-800 dark:bg-zinc-900/60 md:flex-row md:items-center md:justify-between">
              <div className="space-y-1">
                <strong className="block text-sm text-zinc-950 dark:text-white">
                  草稿态与发布态分离
                </strong>
                <span className="text-sm text-zinc-500 dark:text-zinc-400">
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

            <div className="flex flex-col gap-4 rounded-[24px] border border-zinc-200/70 bg-white/90 px-5 py-4 dark:border-zinc-800 dark:bg-zinc-950/70 md:flex-row md:items-center md:justify-between">
              <div className="space-y-1">
                <strong className="block text-sm text-zinc-950 dark:text-white">
                  {isTranslationMode ? '英文翻译工作区' : '中文主编辑'}
                </strong>
                <p className="text-sm leading-6 text-zinc-500 dark:text-zinc-400">
                  {isTranslationMode
                    ? '这里集中维护所有英文字段。条目增删、时间、技术栈、链接地址等结构性信息仍回到中文主编辑处理。'
                    : '中文主编辑负责维护主文案与结构字段。英文字段改到独立翻译工作区，避免继续双列直填。'}
                </p>
              </div>
              <div
                aria-label="编辑模式切换"
                className="inline-flex w-full rounded-full border border-zinc-200/80 bg-zinc-50 p-1 dark:border-zinc-800 dark:bg-zinc-900/70 md:w-auto"
                role="tablist"
              >
                <Button
                  aria-selected={editorLocaleMode === 'zh'}
                  className="flex-1 md:flex-none"
                  onClick={() => setEditorLocaleMode('zh')}
                  size="sm"
                  type="button"
                  variant={editorLocaleMode === 'zh' ? 'primary' : 'ghost'}
                >
                  中文主编辑
                </Button>
                <Button
                  aria-selected={editorLocaleMode === 'en'}
                  className="flex-1 md:flex-none"
                  onClick={() => setEditorLocaleMode('en')}
                  size="sm"
                  type="button"
                  variant={editorLocaleMode === 'en' ? 'primary' : 'ghost'}
                >
                  英文翻译工作区
                </Button>
              </div>
            </div>

            <EditorSection
              action={renderTranslationActions('基础信息', {
                onCopy: copyProfileTranslations,
                onClear: clearProfileTranslations,
              })}
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
              title="基础信息"
            >
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
                  onDragEnd={(event) => handleCollectionDragEnd('profileLinks', event)}
                  sensors={sensors}
                >
                  <SortableContext
                    items={sortableCollections.profileLinks}
                    strategy={rectSortingStrategy}
                  >
                    <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
                      {resumeDraft.profile.links.map((link, index) => (
                        <SortableItemShell
                          className="min-w-0"
                          disabled={isTranslationMode}
                          dragHandleLabel={`拖拽排序个人链接 ${index + 1}`}
                          id={sortableCollections.profileLinks[index] ?? `profile-link-${index}`}
                          key={sortableCollections.profileLinks[index] ?? `profile-link-${index}`}
                        >
                          {({ dragHandle, isDragging }) => (
                            <div
                              className={[
                                'card stack min-h-full min-w-0 gap-3 rounded-[22px] p-4 transition-shadow',
                                isDragging
                                  ? 'border-blue-300 shadow-[0_18px_38px_rgba(37,99,235,0.18)] dark:border-blue-400/40'
                                  : '',
                              ].join(' ')}
                            >
                              <div className="flex min-w-0 items-start justify-between gap-3">
                                <div className="min-w-0 space-y-1">
                                  <h5 className="text-sm font-semibold text-zinc-950 dark:text-white">
                                    个人链接 {index + 1}
                                  </h5>
                                  <p className="muted truncate">{link.url || link.label.zh || '未命名链接'}</p>
                                </div>
                                {buildEntryActions({
                                  deleteAction: !isTranslationMode ? (
                                    <IconActionButton
                                      className="mt-0.5"
                                      icon={<TrashIcon />}
                                      label={`删除个人链接 ${index + 1}`}
                                      onClick={() => removeProfileLink(index)}
                                      tone="danger"
                                      variant="ghost"
                                    />
                                  ) : null,
                                  dragHandle,
                                })}
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
                  onDragEnd={(event) => handleCollectionDragEnd('profileInterests', event)}
                  sensors={sensors}
                >
                  <SortableContext
                    items={sortableCollections.profileInterests}
                    strategy={rectSortingStrategy}
                  >
                    <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
                      {resumeDraft.profile.interests.map((interest, index) => (
                        <SortableItemShell
                          className="min-w-0"
                          disabled={isTranslationMode}
                          dragHandleLabel={`拖拽排序兴趣方向 ${index + 1}`}
                          id={sortableCollections.profileInterests[index] ?? `profile-interest-${index}`}
                          key={sortableCollections.profileInterests[index] ?? `profile-interest-${index}`}
                        >
                          {({ dragHandle, isDragging }) => (
                            <div
                              className={[
                                'card stack min-h-full min-w-0 gap-3 rounded-[22px] p-4 transition-shadow',
                                isDragging
                                  ? 'border-blue-300 shadow-[0_18px_38px_rgba(37,99,235,0.18)] dark:border-blue-400/40'
                                  : '',
                              ].join(' ')}
                            >
                              <div className="flex min-w-0 items-start justify-between gap-3">
                                <div className="min-w-0 space-y-1">
                                  <h5 className="text-sm font-semibold text-zinc-950 dark:text-white">
                                    兴趣方向 {index + 1}
                                  </h5>
                                  <p className="muted truncate">
                                    {interest.label.zh || interest.label.en || interest.icon || '未命名兴趣'}
                                  </p>
                                </div>
                                {buildEntryActions({
                                  deleteAction: !isTranslationMode ? (
                                    <IconActionButton
                                      className="mt-0.5"
                                      icon={<TrashIcon />}
                                      label={`删除兴趣方向 ${index + 1}`}
                                      onClick={() => removeProfileInterest(index)}
                                      tone="danger"
                                      variant="ghost"
                                    />
                                  ) : null,
                                  dragHandle,
                                })}
                              </div>

                              <LocalizedEditorField
                                label={`兴趣方向 ${index + 1} 名称`}
                                localeMode={editorLocaleMode}
                                onChange={(value) =>
                                  updateProfileInterestField(index, 'label', value, editorLocaleMode)
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
                                      updateProfileInterestField(index, 'icon', event.target.value)
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

            <EditorSection
              action={
                isTranslationMode
                  ? renderTranslationActions('教育经历', {
                      onCopy: copyEducationTranslations,
                      onClear: clearEducationTranslations,
                    })
                  : (
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
              title="教育经历"
            >
              {resumeDraft.education.length === 0 ? (
                <div className="status-box">
                  <strong>当前还没有教育经历</strong>
                  <span>可先新增一段教育经历，再继续补学校、学历和亮点。</span>
                </div>
              ) : null}

              <DndContext
                collisionDetection={closestCenter}
                modifiers={[restrictToVerticalAxis]}
                onDragEnd={(event) => handleCollectionDragEnd('education', event)}
                sensors={sensors}
              >
                <SortableContext
                  items={sortableCollections.education}
                  strategy={verticalListSortingStrategy}
                >
                  <div className="grid gap-4">
                    {resumeDraft.education.map((education, index) => (
                      <SortableItemShell
                        disabled={isTranslationMode}
                        dragHandleLabel={`拖拽排序教育经历 ${index + 1}`}
                        id={sortableCollections.education[index] ?? `education-${index}`}
                        key={sortableCollections.education[index] ?? `education-${index}`}
                      >
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
                              defaultExpanded={resumeDraft.education.length === 1 || index === resumeDraft.education.length - 1}
                              summary={education.schoolName.zh || education.schoolName.en || '未命名教育经历'}
                              title={`教育经历 ${index + 1}`}
                              toggleLabel={`教育经历 ${index + 1} 条目开关`}
                              variant="embedded"
                            >
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
                                          updateEducationPlainField(index, 'startDate', event.target.value)
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
                                          updateEducationPlainField(index, 'endDate', event.target.value)
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
                                  ] ?? formatLocalizedLines(education.highlights, editorLocaleMode)
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

            <EditorSection
              action={
                isTranslationMode
                  ? renderTranslationActions('工作经历', {
                      onCopy: copyExperienceTranslations,
                      onClear: clearExperienceTranslations,
                    })
                  : (
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
              title="工作经历"
            >
              {resumeDraft.experiences.length === 0 ? (
                <div className="status-box">
                  <strong>当前还没有工作经历</strong>
                  <span>可先新增一段经历，再继续补公司、岗位、亮点和技术栈。</span>
                </div>
              ) : null}

              <DndContext
                collisionDetection={closestCenter}
                modifiers={[restrictToVerticalAxis]}
                onDragEnd={(event) => handleCollectionDragEnd('experiences', event)}
                sensors={sensors}
              >
                <SortableContext
                  items={sortableCollections.experiences}
                  strategy={verticalListSortingStrategy}
                >
                  <div className="grid gap-4">
                    {resumeDraft.experiences.map((experience, index) => (
                      <SortableItemShell
                        disabled={isTranslationMode}
                        dragHandleLabel={`拖拽排序工作经历 ${index + 1}`}
                        id={sortableCollections.experiences[index] ?? `experience-${index}`}
                        key={sortableCollections.experiences[index] ?? `experience-${index}`}
                      >
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
                              experience.companyName.zh || experience.companyName.en || '未命名工作经历'
                            }
                            title={`工作经历 ${index + 1}`}
                            toggleLabel={`工作经历 ${index + 1} 条目开关`}
                            variant="embedded"
                          >
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
                                        updateExperiencePlainField(index, 'startDate', event.target.value)
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
                                        updateExperiencePlainField(index, 'endDate', event.target.value)
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

            <EditorSection
              action={
                isTranslationMode
                  ? renderTranslationActions('项目经历', {
                      onCopy: copyProjectTranslations,
                      onClear: clearProjectTranslations,
                    })
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
                onDragEnd={(event) => handleCollectionDragEnd('projects', event)}
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

            <EditorSection
              action={
                isTranslationMode
                  ? renderTranslationActions('技能组', {
                      onCopy: copySkillTranslations,
                      onClear: clearSkillTranslations,
                    })
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
                onDragEnd={(event) => handleCollectionDragEnd('skills', event)}
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

            <EditorSection
              action={
                isTranslationMode
                  ? renderTranslationActions('亮点', {
                      onCopy: copyHighlightTranslations,
                      onClear: clearHighlightTranslations,
                    })
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
                onDragEnd={(event) => handleCollectionDragEnd('highlights', event)}
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

            {errorMessage ? <p className="error-text">{errorMessage}</p> : null}
            {feedbackMessage ? (
              <div className="dashboard-inline-note">{feedbackMessage}</div>
            ) : null}

            <Button
              fullWidth
              isDisabled={pendingSave}
              size="md"
              type="submit"
              variant="primary"
            >
              {pendingSave ? '保存中...' : '保存当前草稿'}
            </Button>
          </form>
        ) : null}
      </CardContent>
    </Card>
  );
}
