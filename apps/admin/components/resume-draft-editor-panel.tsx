'use client';

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
} from '@heroui/react';
import { useEffect, useMemo, useState, type ReactNode } from 'react';

import { fetchDraftResume, updateDraftResume } from '../lib/resume-draft-api';
import type {
  LocalizedText,
  ResumeDraftSnapshot,
  ResumeEducationItem,
  ResumeExperienceItem,
  ResumeHighlightItem,
  ResumeProfile,
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

function parseCommaSeparatedValues(value: string): string[] {
  return value
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean);
}

function formatCommaSeparatedValues(values: string[]): string {
  return values.join(', ');
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

  return nextValues.map((value, index) => ({
    zh: locale === 'zh' ? value : currentValues[index]?.zh ?? '',
    en: locale === 'en' ? value : currentValues[index]?.en ?? '',
  }));
}

function buildDraftFieldKey(
  scope: 'experience' | 'project' | 'education' | 'skill' | 'profile',
  index: number | 'interests',
  field: 'highlights' | 'technologies' | 'keywords' | 'interests',
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
      formatCommaSeparatedValues(skill.keywords);
  });

  nextValues[buildDraftFieldKey('profile', 'interests', 'interests', 'zh')] =
    formatLocalizedLines(resume.profile.interests, 'zh');
  nextValues[buildDraftFieldKey('profile', 'interests', 'interests', 'en')] =
    formatLocalizedLines(resume.profile.interests, 'en');

  return nextValues;
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
}

function EditorEntry({
  title,
  summary,
  toggleLabel,
  defaultExpanded = true,
  action,
  children,
}: EditorEntryProps) {
  return (
    <Disclosure.Root
      className="overflow-hidden rounded-[24px] border border-zinc-200/70 bg-white dark:border-zinc-800 dark:bg-zinc-950/80"
      defaultExpanded={defaultExpanded}
    >
      <div className="flex flex-col gap-3 px-4 py-4 md:flex-row md:items-start md:justify-between md:px-5">
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
            <span className="inline-flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full border border-zinc-200 bg-zinc-50 text-zinc-500 dark:border-zinc-800 dark:bg-zinc-900/70 dark:text-zinc-300">
              <Disclosure.Indicator>
                <DisclosureChevron />
              </Disclosure.Indicator>
            </span>
          </Disclosure.Trigger>
        </Disclosure.Heading>
        {action ? <div className="shrink-0">{action}</div> : null}
      </div>
      <Disclosure.Content>
        <Disclosure.Body className="stack border-t border-zinc-200/70 px-4 py-4 dark:border-zinc-800 md:px-5">
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
  const [pendingSave, setPendingSave] = useState(false);
  const [feedbackMessage, setFeedbackMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

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

  function updateProfileLinkField(
    index: number,
    field: 'label' | 'url',
    value: string,
    locale?: 'zh' | 'en',
  ) {
    updateResumeDraft((draft) => {
      if (field === 'url') {
        draft.profile.links[index].url = value;
        return;
      }

      draft.profile.links[index].label[locale ?? 'zh'] = value;
    });
  }

  function updateProfileInterests(locale: 'zh' | 'en', value: string) {
    setDraftFieldValues((current) => ({
      ...current,
      [buildDraftFieldKey('profile', 'interests', 'interests', locale)]: value,
    }));

    updateResumeDraft((draft) => {
      draft.profile.interests = mergeLocalizedLines(
        draft.profile.interests,
        locale,
        value,
      );
    });
  }

  function addProfileLink() {
    updateResumeDraft((draft) => {
      draft.profile.links.push(createEmptyProfileLink());
    });
  }

  function removeProfileLink(index: number) {
    updateResumeDraft((draft) => {
      draft.profile.links.splice(index, 1);
    });
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
  }

  function removeEducation(index: number) {
    updateResumeDraft(
      (draft) => {
        draft.education.splice(index, 1);
      },
      { syncDraftFields: true },
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
  }

  function removeExperience(index: number) {
    updateResumeDraft((draft) => {
      draft.experiences.splice(index, 1);
    }, { syncDraftFields: true });
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
  }

  function removeProject(index: number) {
    updateResumeDraft((draft) => {
      draft.projects.splice(index, 1);
    }, { syncDraftFields: true });
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
      draft.skills[index].keywords = parseCommaSeparatedValues(value);
    });
  }

  function addSkillGroup() {
    updateResumeDraft(
      (draft) => {
        draft.skills.push(createEmptySkillGroup());
      },
      { syncDraftFields: true },
    );
  }

  function removeSkillGroup(index: number) {
    updateResumeDraft(
      (draft) => {
        draft.skills.splice(index, 1);
      },
      { syncDraftFields: true },
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
  }

  function removeHighlight(index: number) {
    updateResumeDraft((draft) => {
      draft.highlights.splice(index, 1);
    });
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
          当前后台已按标准简历模型接通基础信息、教育、工作、项目、技能与亮点编辑，保存后仍需手动发布。
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

            <EditorSection
              count={4 + resumeDraft.profile.links.length + resumeDraft.profile.interests.length}
              description="先保留原有 profile 编辑，继续作为标准简历的稳定基础层。"
              title="基础信息"
            >
              <div className="grid gap-4 md:grid-cols-2">
                <label className="field">
                  <span>中文姓名</span>
                  <Input
                    fullWidth
                    onChange={(event) =>
                      updateProfileLocalizedField('fullName', 'zh', event.target.value)
                    }
                    value={resumeDraft.profile.fullName.zh}
                    variant="secondary"
                  />
                </label>
                <label className="field">
                  <span>英文姓名</span>
                  <Input
                    fullWidth
                    onChange={(event) =>
                      updateProfileLocalizedField('fullName', 'en', event.target.value)
                    }
                    value={resumeDraft.profile.fullName.en}
                    variant="secondary"
                  />
                </label>

                <label className="field">
                  <span>中文标题</span>
                  <Input
                    fullWidth
                    onChange={(event) =>
                      updateProfileLocalizedField('headline', 'zh', event.target.value)
                    }
                    value={resumeDraft.profile.headline.zh}
                    variant="secondary"
                  />
                </label>
                <label className="field">
                  <span>英文标题</span>
                  <Input
                    fullWidth
                    onChange={(event) =>
                      updateProfileLocalizedField('headline', 'en', event.target.value)
                    }
                    value={resumeDraft.profile.headline.en}
                    variant="secondary"
                  />
                </label>

                <label className="field">
                  <span>中文所在地</span>
                  <Input
                    fullWidth
                    onChange={(event) =>
                      updateProfileLocalizedField('location', 'zh', event.target.value)
                    }
                    value={resumeDraft.profile.location.zh}
                    variant="secondary"
                  />
                </label>
                <label className="field">
                  <span>英文所在地</span>
                  <Input
                    fullWidth
                    onChange={(event) =>
                      updateProfileLocalizedField('location', 'en', event.target.value)
                    }
                    value={resumeDraft.profile.location.en}
                    variant="secondary"
                  />
                </label>

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
              </div>

              <label className="field">
                <span>个人网站</span>
                <Input
                  fullWidth
                  onChange={(event) => updateProfilePlainField('website', event.target.value)}
                  value={resumeDraft.profile.website}
                  variant="secondary"
                />
              </label>

              <div className="stack">
                <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                  <div className="space-y-1">
                    <h4 className="text-sm font-semibold text-zinc-950 dark:text-white">
                      个人链接
                    </h4>
                    <p className="muted">用于公开侧栏展示 GitHub、博客等对外入口。</p>
                  </div>
                  <Button onClick={addProfileLink} size="sm" type="button" variant="outline">
                    新增个人链接
                  </Button>
                </div>

                {resumeDraft.profile.links.length === 0 ? (
                  <div className="status-box">
                    <strong>当前还没有个人链接</strong>
                    <span>可继续补 GitHub、博客或其他公开主页入口。</span>
                  </div>
                ) : null}

                {resumeDraft.profile.links.map((link, index) => (
                  <div className="card stack" key={`profile-link-${index}`}>
                    <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                      <div className="space-y-1">
                        <h5 className="text-sm font-semibold text-zinc-950 dark:text-white">
                          个人链接 {index + 1}
                        </h5>
                        <p className="muted">{link.url || link.label.zh || '未命名链接'}</p>
                      </div>
                      <Button
                        onClick={() => removeProfileLink(index)}
                        size="sm"
                        type="button"
                        variant="ghost"
                      >
                        删除本条
                      </Button>
                    </div>

                    <div className="grid gap-4 md:grid-cols-2">
                      <label className="field">
                        <span>{`个人链接 ${index + 1} 中文标签`}</span>
                        <Input
                          fullWidth
                          onChange={(event) =>
                            updateProfileLinkField(index, 'label', event.target.value, 'zh')
                          }
                          value={link.label.zh}
                          variant="secondary"
                        />
                      </label>
                      <label className="field">
                        <span>{`个人链接 ${index + 1} 英文标签`}</span>
                        <Input
                          fullWidth
                          onChange={(event) =>
                            updateProfileLinkField(index, 'label', event.target.value, 'en')
                          }
                          value={link.label.en}
                          variant="secondary"
                        />
                      </label>
                    </div>

                    <label className="field">
                      <span>{`个人链接 ${index + 1} 链接地址`}</span>
                      <Input
                        fullWidth
                        onChange={(event) =>
                          updateProfileLinkField(index, 'url', event.target.value)
                        }
                        value={link.url}
                        variant="secondary"
                      />
                    </label>
                  </div>
                ))}
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <label className="field">
                  <span>中文简介</span>
                  <TextArea
                    fullWidth
                    onChange={(event) =>
                      updateProfileLocalizedField('summary', 'zh', event.target.value)
                    }
                    rows={5}
                    value={resumeDraft.profile.summary.zh}
                    variant="secondary"
                  />
                </label>
                <label className="field">
                  <span>英文简介</span>
                  <TextArea
                    fullWidth
                    onChange={(event) =>
                      updateProfileLocalizedField('summary', 'en', event.target.value)
                    }
                    rows={5}
                    value={resumeDraft.profile.summary.en}
                    variant="secondary"
                  />
                </label>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <label className="field">
                  <span>中文兴趣方向（每行一条）</span>
                  <TextArea
                    fullWidth
                    onChange={(event) => updateProfileInterests('zh', event.target.value)}
                    rows={4}
                    value={
                      draftFieldValues[
                        buildDraftFieldKey('profile', 'interests', 'interests', 'zh')
                      ] ?? formatLocalizedLines(resumeDraft.profile.interests, 'zh')
                    }
                    variant="secondary"
                  />
                </label>
                <label className="field">
                  <span>英文兴趣方向（每行一条）</span>
                  <TextArea
                    fullWidth
                    onChange={(event) => updateProfileInterests('en', event.target.value)}
                    rows={4}
                    value={
                      draftFieldValues[
                        buildDraftFieldKey('profile', 'interests', 'interests', 'en')
                      ] ?? formatLocalizedLines(resumeDraft.profile.interests, 'en')
                    }
                    variant="secondary"
                  />
                </label>
              </div>
            </EditorSection>

            <EditorSection
              action={
                <Button onClick={addEducation} size="sm" type="button" variant="outline">
                  新增教育经历
                </Button>
              }
              count={resumeDraft.education.length}
              description="补齐学校、学历、专业、时间、地点与教育亮点的双语维护。"
              title="教育经历"
            >
              {resumeDraft.education.length === 0 ? (
                <div className="status-box">
                  <strong>当前还没有教育经历</strong>
                  <span>可先新增一段教育经历，再继续补学校、学历和亮点。</span>
                </div>
              ) : null}

              {resumeDraft.education.map((education, index) => (
                <EditorEntry
                  action={
                    <Button
                      onClick={() => removeEducation(index)}
                      size="sm"
                      type="button"
                      variant="ghost"
                    >
                      删除本段
                    </Button>
                  }
                  defaultExpanded={resumeDraft.education.length === 1 || index === resumeDraft.education.length - 1}
                  key={`education-${index}`}
                  summary={education.schoolName.zh || education.schoolName.en || '未命名教育经历'}
                  title={`教育经历 ${index + 1}`}
                  toggleLabel={`教育经历 ${index + 1} 条目开关`}
                >
                  <div className="grid gap-4 md:grid-cols-2">
                    <label className="field">
                      <span>{`教育经历 ${index + 1} 中文学校`}</span>
                      <Input
                        fullWidth
                        onChange={(event) =>
                          updateEducationLocalizedField(
                            index,
                            'schoolName',
                            'zh',
                            event.target.value,
                          )
                        }
                        value={education.schoolName.zh}
                        variant="secondary"
                      />
                    </label>
                    <label className="field">
                      <span>{`教育经历 ${index + 1} 英文学校`}</span>
                      <Input
                        fullWidth
                        onChange={(event) =>
                          updateEducationLocalizedField(
                            index,
                            'schoolName',
                            'en',
                            event.target.value,
                          )
                        }
                        value={education.schoolName.en}
                        variant="secondary"
                      />
                    </label>

                    <label className="field">
                      <span>{`教育经历 ${index + 1} 中文学位`}</span>
                      <Input
                        fullWidth
                        onChange={(event) =>
                          updateEducationLocalizedField(
                            index,
                            'degree',
                            'zh',
                            event.target.value,
                          )
                        }
                        value={education.degree.zh}
                        variant="secondary"
                      />
                    </label>
                    <label className="field">
                      <span>{`教育经历 ${index + 1} 英文学位`}</span>
                      <Input
                        fullWidth
                        onChange={(event) =>
                          updateEducationLocalizedField(
                            index,
                            'degree',
                            'en',
                            event.target.value,
                          )
                        }
                        value={education.degree.en}
                        variant="secondary"
                      />
                    </label>

                    <label className="field">
                      <span>{`教育经历 ${index + 1} 中文专业`}</span>
                      <Input
                        fullWidth
                        onChange={(event) =>
                          updateEducationLocalizedField(
                            index,
                            'fieldOfStudy',
                            'zh',
                            event.target.value,
                          )
                        }
                        value={education.fieldOfStudy.zh}
                        variant="secondary"
                      />
                    </label>
                    <label className="field">
                      <span>{`教育经历 ${index + 1} 英文专业`}</span>
                      <Input
                        fullWidth
                        onChange={(event) =>
                          updateEducationLocalizedField(
                            index,
                            'fieldOfStudy',
                            'en',
                            event.target.value,
                          )
                        }
                        value={education.fieldOfStudy.en}
                        variant="secondary"
                      />
                    </label>

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

                    <label className="field">
                      <span>{`教育经历 ${index + 1} 中文地点`}</span>
                      <Input
                        fullWidth
                        onChange={(event) =>
                          updateEducationLocalizedField(
                            index,
                            'location',
                            'zh',
                            event.target.value,
                          )
                        }
                        value={education.location.zh}
                        variant="secondary"
                      />
                    </label>
                    <label className="field">
                      <span>{`教育经历 ${index + 1} 英文地点`}</span>
                      <Input
                        fullWidth
                        onChange={(event) =>
                          updateEducationLocalizedField(
                            index,
                            'location',
                            'en',
                            event.target.value,
                          )
                        }
                        value={education.location.en}
                        variant="secondary"
                      />
                    </label>
                  </div>

                  <div className="grid gap-4 md:grid-cols-2">
                    <label className="field">
                      <span>{`教育经历 ${index + 1} 中文亮点（每行一条）`}</span>
                      <TextArea
                        fullWidth
                        onChange={(event) =>
                          updateEducationHighlights(index, 'zh', event.target.value)
                        }
                        rows={4}
                        value={
                          draftFieldValues[
                            buildDraftFieldKey('education', index, 'highlights', 'zh')
                          ] ?? formatLocalizedLines(education.highlights, 'zh')
                        }
                        variant="secondary"
                      />
                    </label>
                    <label className="field">
                      <span>{`教育经历 ${index + 1} 英文亮点（每行一条）`}</span>
                      <TextArea
                        fullWidth
                        onChange={(event) =>
                          updateEducationHighlights(index, 'en', event.target.value)
                        }
                        rows={4}
                        value={
                          draftFieldValues[
                            buildDraftFieldKey('education', index, 'highlights', 'en')
                          ] ?? formatLocalizedLines(education.highlights, 'en')
                        }
                        variant="secondary"
                      />
                    </label>
                  </div>
                </EditorEntry>
              ))}
            </EditorSection>

            <EditorSection
              action={
                <Button onClick={addExperience} size="sm" type="button" variant="outline">
                  新增工作经历
                </Button>
              }
              count={resumeDraft.experiences.length}
              description="优先开放公司、岗位、时间、摘要、亮点和技术栈，满足岗位定向调整的主需求。"
              title="工作经历"
            >
              {resumeDraft.experiences.length === 0 ? (
                <div className="status-box">
                  <strong>当前还没有工作经历</strong>
                  <span>可先新增一段经历，再继续补公司、岗位、亮点和技术栈。</span>
                </div>
              ) : null}

              {resumeDraft.experiences.map((experience, index) => (
                <EditorEntry
                  action={
                    <Button
                      onClick={() => removeExperience(index)}
                      size="sm"
                      type="button"
                      variant="ghost"
                    >
                      删除本段
                    </Button>
                  }
                  defaultExpanded={
                    resumeDraft.experiences.length === 1 ||
                    index === resumeDraft.experiences.length - 1
                  }
                  key={`experience-${index}`}
                  summary={
                    experience.companyName.zh || experience.companyName.en || '未命名工作经历'
                  }
                  title={`工作经历 ${index + 1}`}
                  toggleLabel={`工作经历 ${index + 1} 条目开关`}
                >
                  <div className="grid gap-4 md:grid-cols-2">
                    <label className="field">
                      <span>{`工作经历 ${index + 1} 中文公司`}</span>
                      <Input
                        fullWidth
                        onChange={(event) =>
                          updateExperienceLocalizedField(
                            index,
                            'companyName',
                            'zh',
                            event.target.value,
                          )
                        }
                        value={experience.companyName.zh}
                        variant="secondary"
                      />
                    </label>
                    <label className="field">
                      <span>{`工作经历 ${index + 1} 英文公司`}</span>
                      <Input
                        fullWidth
                        onChange={(event) =>
                          updateExperienceLocalizedField(
                            index,
                            'companyName',
                            'en',
                            event.target.value,
                          )
                        }
                        value={experience.companyName.en}
                        variant="secondary"
                      />
                    </label>

                    <label className="field">
                      <span>{`工作经历 ${index + 1} 中文岗位`}</span>
                      <Input
                        fullWidth
                        onChange={(event) =>
                          updateExperienceLocalizedField(index, 'role', 'zh', event.target.value)
                        }
                        value={experience.role.zh}
                        variant="secondary"
                      />
                    </label>
                    <label className="field">
                      <span>{`工作经历 ${index + 1} 英文岗位`}</span>
                      <Input
                        fullWidth
                        onChange={(event) =>
                          updateExperienceLocalizedField(index, 'role', 'en', event.target.value)
                        }
                        value={experience.role.en}
                        variant="secondary"
                      />
                    </label>

                    <label className="field">
                      <span>{`工作经历 ${index + 1} 中文类型`}</span>
                      <Input
                        fullWidth
                        onChange={(event) =>
                          updateExperienceLocalizedField(
                            index,
                            'employmentType',
                            'zh',
                            event.target.value,
                          )
                        }
                        value={experience.employmentType.zh}
                        variant="secondary"
                      />
                    </label>
                    <label className="field">
                      <span>{`工作经历 ${index + 1} 英文类型`}</span>
                      <Input
                        fullWidth
                        onChange={(event) =>
                          updateExperienceLocalizedField(
                            index,
                            'employmentType',
                            'en',
                            event.target.value,
                          )
                        }
                        value={experience.employmentType.en}
                        variant="secondary"
                      />
                    </label>

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

                    <label className="field">
                      <span>{`工作经历 ${index + 1} 中文地点`}</span>
                      <Input
                        fullWidth
                        onChange={(event) =>
                          updateExperienceLocalizedField(
                            index,
                            'location',
                            'zh',
                            event.target.value,
                          )
                        }
                        value={experience.location.zh}
                        variant="secondary"
                      />
                    </label>
                    <label className="field">
                      <span>{`工作经历 ${index + 1} 英文地点`}</span>
                      <Input
                        fullWidth
                        onChange={(event) =>
                          updateExperienceLocalizedField(
                            index,
                            'location',
                            'en',
                            event.target.value,
                          )
                        }
                        value={experience.location.en}
                        variant="secondary"
                      />
                    </label>
                  </div>

                  <div className="grid gap-4 md:grid-cols-2">
                    <label className="field">
                      <span>{`工作经历 ${index + 1} 中文摘要`}</span>
                      <TextArea
                        fullWidth
                        onChange={(event) =>
                          updateExperienceLocalizedField(
                            index,
                            'summary',
                            'zh',
                            event.target.value,
                          )
                        }
                        rows={4}
                        value={experience.summary.zh}
                        variant="secondary"
                      />
                    </label>
                    <label className="field">
                      <span>{`工作经历 ${index + 1} 英文摘要`}</span>
                      <TextArea
                        fullWidth
                        onChange={(event) =>
                          updateExperienceLocalizedField(
                            index,
                            'summary',
                            'en',
                            event.target.value,
                          )
                        }
                        rows={4}
                        value={experience.summary.en}
                        variant="secondary"
                      />
                    </label>
                  </div>

                  <div className="grid gap-4 md:grid-cols-2">
                    <label className="field">
                      <span>{`工作经历 ${index + 1} 中文亮点（每行一条）`}</span>
                      <TextArea
                        fullWidth
                        onChange={(event) =>
                          updateExperienceHighlights(index, 'zh', event.target.value)
                        }
                        rows={5}
                        value={
                          draftFieldValues[
                            buildDraftFieldKey('experience', index, 'highlights', 'zh')
                          ] ?? formatLocalizedLines(experience.highlights, 'zh')
                        }
                        variant="secondary"
                      />
                    </label>
                    <label className="field">
                      <span>{`工作经历 ${index + 1} 英文亮点（每行一条）`}</span>
                      <TextArea
                        fullWidth
                        onChange={(event) =>
                          updateExperienceHighlights(index, 'en', event.target.value)
                        }
                        rows={5}
                        value={
                          draftFieldValues[
                            buildDraftFieldKey('experience', index, 'highlights', 'en')
                          ] ?? formatLocalizedLines(experience.highlights, 'en')
                        }
                        variant="secondary"
                      />
                    </label>
                  </div>

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
                </EditorEntry>
              ))}
            </EditorSection>

            <EditorSection
              action={
                <Button onClick={addProject} size="sm" type="button" variant="outline">
                  新增项目经历
                </Button>
              }
              count={resumeDraft.projects.length}
              description="当前已接通项目名称、角色、时间、摘要、亮点、技术栈与项目链接，保持与公开展示结构一致。"
              title="项目经历"
            >
              {resumeDraft.projects.length === 0 ? (
                <div className="status-box">
                  <strong>当前还没有项目经历</strong>
                  <span>可先新增一个项目，再补摘要、亮点和技术栈。</span>
                </div>
              ) : null}

              {resumeDraft.projects.map((project, index) => (
                <EditorEntry
                  action={
                    <Button
                      onClick={() => removeProject(index)}
                      size="sm"
                      type="button"
                      variant="ghost"
                    >
                      删除本段
                    </Button>
                  }
                  defaultExpanded={
                    resumeDraft.projects.length === 1 ||
                    index === resumeDraft.projects.length - 1
                  }
                  key={`project-${index}`}
                  summary={project.name.zh || project.name.en || '未命名项目'}
                  title={`项目经历 ${index + 1}`}
                  toggleLabel={`项目经历 ${index + 1} 条目开关`}
                >
                  <div className="grid gap-4 md:grid-cols-2">
                    <label className="field">
                      <span>{`项目经历 ${index + 1} 中文名称`}</span>
                      <Input
                        fullWidth
                        onChange={(event) =>
                          updateProjectLocalizedField(index, 'name', 'zh', event.target.value)
                        }
                        value={project.name.zh}
                        variant="secondary"
                      />
                    </label>
                    <label className="field">
                      <span>{`项目经历 ${index + 1} 英文名称`}</span>
                      <Input
                        fullWidth
                        onChange={(event) =>
                          updateProjectLocalizedField(index, 'name', 'en', event.target.value)
                        }
                        value={project.name.en}
                        variant="secondary"
                      />
                    </label>

                    <label className="field">
                      <span>{`项目经历 ${index + 1} 中文角色`}</span>
                      <Input
                        fullWidth
                        onChange={(event) =>
                          updateProjectLocalizedField(index, 'role', 'zh', event.target.value)
                        }
                        value={project.role.zh}
                        variant="secondary"
                      />
                    </label>
                    <label className="field">
                      <span>{`项目经历 ${index + 1} 英文角色`}</span>
                      <Input
                        fullWidth
                        onChange={(event) =>
                          updateProjectLocalizedField(index, 'role', 'en', event.target.value)
                        }
                        value={project.role.en}
                        variant="secondary"
                      />
                    </label>

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
                  </div>

                  <div className="grid gap-4 md:grid-cols-2">
                    <label className="field">
                      <span>{`项目经历 ${index + 1} 中文摘要`}</span>
                      <TextArea
                        fullWidth
                        onChange={(event) =>
                          updateProjectLocalizedField(index, 'summary', 'zh', event.target.value)
                        }
                        rows={4}
                        value={project.summary.zh}
                        variant="secondary"
                      />
                    </label>
                    <label className="field">
                      <span>{`项目经历 ${index + 1} 英文摘要`}</span>
                      <TextArea
                        fullWidth
                        onChange={(event) =>
                          updateProjectLocalizedField(index, 'summary', 'en', event.target.value)
                        }
                        rows={4}
                        value={project.summary.en}
                        variant="secondary"
                      />
                    </label>
                  </div>

                  <div className="grid gap-4 md:grid-cols-2">
                    <label className="field">
                      <span>{`项目经历 ${index + 1} 中文亮点（每行一条）`}</span>
                      <TextArea
                        fullWidth
                        onChange={(event) =>
                          updateProjectHighlights(index, 'zh', event.target.value)
                        }
                        rows={5}
                        value={
                          draftFieldValues[
                            buildDraftFieldKey('project', index, 'highlights', 'zh')
                          ] ?? formatLocalizedLines(project.highlights, 'zh')
                        }
                        variant="secondary"
                      />
                    </label>
                    <label className="field">
                      <span>{`项目经历 ${index + 1} 英文亮点（每行一条）`}</span>
                      <TextArea
                        fullWidth
                        onChange={(event) =>
                          updateProjectHighlights(index, 'en', event.target.value)
                        }
                        rows={5}
                        value={
                          draftFieldValues[
                            buildDraftFieldKey('project', index, 'highlights', 'en')
                          ] ?? formatLocalizedLines(project.highlights, 'en')
                        }
                        variant="secondary"
                      />
                    </label>
                  </div>

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

                  <div className="stack">
                    <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                      <div className="space-y-1">
                        <h5 className="text-sm font-semibold text-zinc-950 dark:text-white">
                          项目链接
                        </h5>
                        <p className="muted">
                          可补充项目地址、演示入口或仓库链接，公开页和导出内容会复用这些字段。
                        </p>
                      </div>
                      <Button
                        onClick={() => addProjectLink(index)}
                        size="sm"
                        type="button"
                        variant="outline"
                      >
                        新增项目链接
                      </Button>
                    </div>

                    {project.links.length === 0 ? (
                      <div className="status-box">
                        <strong>当前还没有项目链接</strong>
                        <span>可按项目补充 demo、仓库或案例文章入口。</span>
                      </div>
                    ) : null}

                    {project.links.map((link, linkIndex) => (
                      <div className="card stack" key={`project-${index}-link-${linkIndex}`}>
                        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                          <div className="space-y-1">
                            <h6 className="text-sm font-semibold text-zinc-950 dark:text-white">
                              {`项目链接 ${linkIndex + 1}`}
                            </h6>
                            <p className="muted">{link.url || link.label.zh || '未命名链接'}</p>
                          </div>
                          <Button
                            onClick={() => removeProjectLink(index, linkIndex)}
                            size="sm"
                            type="button"
                            variant="ghost"
                          >
                            删除本条
                          </Button>
                        </div>

                        <div className="grid gap-4 md:grid-cols-2">
                          <label className="field">
                            <span>{`项目经历 ${index + 1} 链接 ${linkIndex + 1} 中文标签`}</span>
                            <Input
                              fullWidth
                              onChange={(event) =>
                                updateProjectLinkField(
                                  index,
                                  linkIndex,
                                  'label',
                                  event.target.value,
                                  'zh',
                                )
                              }
                              value={link.label.zh}
                              variant="secondary"
                            />
                          </label>
                          <label className="field">
                            <span>{`项目经历 ${index + 1} 链接 ${linkIndex + 1} 英文标签`}</span>
                            <Input
                              fullWidth
                              onChange={(event) =>
                                updateProjectLinkField(
                                  index,
                                  linkIndex,
                                  'label',
                                  event.target.value,
                                  'en',
                                )
                              }
                              value={link.label.en}
                              variant="secondary"
                            />
                          </label>
                        </div>

                        <label className="field">
                          <span>{`项目经历 ${index + 1} 链接 ${linkIndex + 1} 地址`}</span>
                          <Input
                            fullWidth
                            onChange={(event) =>
                              updateProjectLinkField(index, linkIndex, 'url', event.target.value)
                            }
                            value={link.url}
                            variant="secondary"
                          />
                        </label>
                      </div>
                    ))}
                  </div>
                </EditorEntry>
              ))}
            </EditorSection>

            <EditorSection
              action={
                <Button onClick={addSkillGroup} size="sm" type="button" variant="outline">
                  新增技能组
                </Button>
              }
              count={resumeDraft.skills.length}
              description="按技能组维护关键词，公开页会按组展示能力结构。"
              title="技能组"
            >
              {resumeDraft.skills.length === 0 ? (
                <div className="status-box">
                  <strong>当前还没有技能组</strong>
                  <span>可按技术方向逐组补充关键词，保持结构清晰。</span>
                </div>
              ) : null}

              {resumeDraft.skills.map((skill, index) => (
                <EditorEntry
                  action={
                    <Button
                      onClick={() => removeSkillGroup(index)}
                      size="sm"
                      type="button"
                      variant="ghost"
                    >
                      删除本组
                    </Button>
                  }
                  defaultExpanded={
                    resumeDraft.skills.length === 1 ||
                    index === resumeDraft.skills.length - 1
                  }
                  key={`skill-${index}`}
                  summary={skill.name.zh || skill.name.en || '未命名技能组'}
                  title={`技能组 ${index + 1}`}
                  toggleLabel={`技能组 ${index + 1} 条目开关`}
                >
                  <div className="grid gap-4 md:grid-cols-2">
                    <label className="field">
                      <span>{`技能组 ${index + 1} 中文名称`}</span>
                      <Input
                        fullWidth
                        onChange={(event) =>
                          updateSkillLocalizedField(index, 'zh', event.target.value)
                        }
                        value={skill.name.zh}
                        variant="secondary"
                      />
                    </label>
                    <label className="field">
                      <span>{`技能组 ${index + 1} 英文名称`}</span>
                      <Input
                        fullWidth
                        onChange={(event) =>
                          updateSkillLocalizedField(index, 'en', event.target.value)
                        }
                        value={skill.name.en}
                        variant="secondary"
                      />
                    </label>
                  </div>

                  <label className="field">
                    <span>{`技能组 ${index + 1} 关键词（逗号分隔）`}</span>
                    <Input
                      fullWidth
                      onChange={(event) => updateSkillKeywords(index, event.target.value)}
                      value={
                        draftFieldValues[buildDraftFieldKey('skill', index, 'keywords')] ??
                        formatCommaSeparatedValues(skill.keywords)
                      }
                      variant="secondary"
                    />
                  </label>
                </EditorEntry>
              ))}
            </EditorSection>

            <EditorSection
              action={
                <Button onClick={addHighlight} size="sm" type="button" variant="outline">
                  新增亮点
                </Button>
              }
              count={resumeDraft.highlights.length}
              description="维护个人优势、开源、团队协作等补充亮点，丰富公开页结尾信息。"
              title="亮点"
            >
              {resumeDraft.highlights.length === 0 ? (
                <div className="status-box">
                  <strong>当前还没有亮点</strong>
                  <span>可补充开源、技术写作、团队建设等补充优势。</span>
                </div>
              ) : null}

              {resumeDraft.highlights.map((highlight, index) => (
                <EditorEntry
                  action={
                    <Button
                      onClick={() => removeHighlight(index)}
                      size="sm"
                      type="button"
                      variant="ghost"
                    >
                      删除本条
                    </Button>
                  }
                  defaultExpanded={
                    resumeDraft.highlights.length === 1 ||
                    index === resumeDraft.highlights.length - 1
                  }
                  key={`highlight-${index}`}
                  summary={highlight.title.zh || highlight.title.en || '未命名亮点'}
                  title={`亮点 ${index + 1}`}
                  toggleLabel={`亮点 ${index + 1} 条目开关`}
                >
                  <div className="grid gap-4 md:grid-cols-2">
                    <label className="field">
                      <span>{`亮点 ${index + 1} 中文标题`}</span>
                      <Input
                        fullWidth
                        onChange={(event) =>
                          updateHighlightLocalizedField(
                            index,
                            'title',
                            'zh',
                            event.target.value,
                          )
                        }
                        value={highlight.title.zh}
                        variant="secondary"
                      />
                    </label>
                    <label className="field">
                      <span>{`亮点 ${index + 1} 英文标题`}</span>
                      <Input
                        fullWidth
                        onChange={(event) =>
                          updateHighlightLocalizedField(
                            index,
                            'title',
                            'en',
                            event.target.value,
                          )
                        }
                        value={highlight.title.en}
                        variant="secondary"
                      />
                    </label>
                  </div>

                  <div className="grid gap-4 md:grid-cols-2">
                    <label className="field">
                      <span>{`亮点 ${index + 1} 中文描述`}</span>
                      <TextArea
                        fullWidth
                        onChange={(event) =>
                          updateHighlightLocalizedField(
                            index,
                            'description',
                            'zh',
                            event.target.value,
                          )
                        }
                        rows={4}
                        value={highlight.description.zh}
                        variant="secondary"
                      />
                    </label>
                    <label className="field">
                      <span>{`亮点 ${index + 1} 英文描述`}</span>
                      <TextArea
                        fullWidth
                        onChange={(event) =>
                          updateHighlightLocalizedField(
                            index,
                            'description',
                            'en',
                            event.target.value,
                          )
                        }
                        rows={4}
                        value={highlight.description.en}
                        variant="secondary"
                      />
                    </label>
                  </div>
                </EditorEntry>
              ))}
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
