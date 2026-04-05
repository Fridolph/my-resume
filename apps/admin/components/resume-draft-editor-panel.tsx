'use client';

import {
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Input,
  TextArea,
} from '@heroui/react';
import { useEffect, useMemo, useState } from 'react';

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
        <CardTitle>简历草稿关键模块编辑</CardTitle>
        <CardDescription>
          当前继续扩展为标准简历模型编辑，按教育、经历、项目、技能与亮点分组维护，保存后仍需手动发布。
        </CardDescription>
      </CardHeader>
      <CardContent className="stack">
        {status === 'loading' ? <p className="muted">正在加载草稿...</p> : null}

        {status === 'error' && errorMessage ? (
          <p className="error-text">{errorMessage}</p>
        ) : null}

        {status === 'ready' && resumeDraft && draftSnapshot ? (
          <form className="stack" onSubmit={(event) => void handleSubmit(event)}>
            <div className="status-box">
              <strong>草稿态与发布态分离</strong>
              <span>保存只会更新后台草稿，公开站仍读取最近一次手动发布的版本。</span>
              {lastUpdatedLabel ? <span>最近保存：{lastUpdatedLabel}</span> : null}
            </div>

            <section className="stack">
              <div className="space-y-1">
                <h3 className="text-base font-semibold text-zinc-950 dark:text-white">
                  基础信息
                </h3>
                <p className="muted">先保留原有 profile 编辑，继续作为标准简历的稳定基础层。</p>
              </div>

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
            </section>

            <section className="stack">
              <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                <div className="space-y-1">
                  <h3 className="text-base font-semibold text-zinc-950 dark:text-white">
                    教育经历
                  </h3>
                  <p className="muted">补齐学校、学历、专业、时间、地点与教育亮点的双语维护。</p>
                </div>
                <Button onClick={addEducation} size="sm" type="button" variant="outline">
                  新增教育经历
                </Button>
              </div>

              {resumeDraft.education.length === 0 ? (
                <div className="status-box">
                  <strong>当前还没有教育经历</strong>
                  <span>可先新增一段教育经历，再继续补学校、学历和亮点。</span>
                </div>
              ) : null}

              {resumeDraft.education.map((education, index) => (
                <div className="card stack" key={`education-${index}`}>
                  <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                    <div className="space-y-1">
                      <h4 className="text-sm font-semibold text-zinc-950 dark:text-white">
                        教育经历 {index + 1}
                      </h4>
                      <p className="muted">
                        {education.schoolName.zh || education.schoolName.en || '未命名教育经历'}
                      </p>
                    </div>
                    <Button
                      onClick={() => removeEducation(index)}
                      size="sm"
                      type="button"
                      variant="ghost"
                    >
                      删除本段
                    </Button>
                  </div>

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
                </div>
              ))}
            </section>

            <section className="stack">
              <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                <div className="space-y-1">
                  <h3 className="text-base font-semibold text-zinc-950 dark:text-white">
                    工作经历
                  </h3>
                  <p className="muted">
                    优先开放公司、岗位、时间、摘要、亮点和技术栈，满足岗位定向调整的主需求。
                  </p>
                </div>
                <Button onClick={addExperience} size="sm" type="button" variant="outline">
                  新增工作经历
                </Button>
              </div>

              {resumeDraft.experiences.length === 0 ? (
                <div className="status-box">
                  <strong>当前还没有工作经历</strong>
                  <span>可先新增一段经历，再继续补公司、岗位、亮点和技术栈。</span>
                </div>
              ) : null}

              {resumeDraft.experiences.map((experience, index) => (
                <div className="card stack" key={`experience-${index}`}>
                  <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                    <div className="space-y-1">
                      <h4 className="text-sm font-semibold text-zinc-950 dark:text-white">
                        工作经历 {index + 1}
                      </h4>
                      <p className="muted">
                        {experience.companyName.zh || experience.companyName.en || '未命名工作经历'}
                      </p>
                    </div>
                    <Button
                      onClick={() => removeExperience(index)}
                      size="sm"
                      type="button"
                      variant="ghost"
                    >
                      删除本段
                    </Button>
                  </div>

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
                </div>
              ))}
            </section>

            <section className="stack">
              <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                <div className="space-y-1">
                  <h3 className="text-base font-semibold text-zinc-950 dark:text-white">
                    项目经历
                  </h3>
                  <p className="muted">
                    先开放项目名称、角色、时间、摘要、亮点和技术栈，满足公开版最核心的信息组织。
                  </p>
                </div>
                <Button onClick={addProject} size="sm" type="button" variant="outline">
                  新增项目经历
                </Button>
              </div>

              {resumeDraft.projects.length === 0 ? (
                <div className="status-box">
                  <strong>当前还没有项目经历</strong>
                  <span>可先新增一个项目，再补摘要、亮点和技术栈。</span>
                </div>
              ) : null}

              {resumeDraft.projects.map((project, index) => (
                <div className="card stack" key={`project-${index}`}>
                  <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                    <div className="space-y-1">
                      <h4 className="text-sm font-semibold text-zinc-950 dark:text-white">
                        项目经历 {index + 1}
                      </h4>
                      <p className="muted">
                        {project.name.zh || project.name.en || '未命名项目'}
                      </p>
                    </div>
                    <Button
                      onClick={() => removeProject(index)}
                      size="sm"
                      type="button"
                      variant="ghost"
                    >
                      删除本段
                    </Button>
                  </div>

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
                </div>
              ))}
            </section>

            <section className="stack">
              <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                <div className="space-y-1">
                  <h3 className="text-base font-semibold text-zinc-950 dark:text-white">
                    技能组
                  </h3>
                  <p className="muted">按技能组维护关键词，公开页会按组展示能力结构。</p>
                </div>
                <Button onClick={addSkillGroup} size="sm" type="button" variant="outline">
                  新增技能组
                </Button>
              </div>

              {resumeDraft.skills.length === 0 ? (
                <div className="status-box">
                  <strong>当前还没有技能组</strong>
                  <span>可按技术方向逐组补充关键词，保持结构清晰。</span>
                </div>
              ) : null}

              {resumeDraft.skills.map((skill, index) => (
                <div className="card stack" key={`skill-${index}`}>
                  <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                    <div className="space-y-1">
                      <h4 className="text-sm font-semibold text-zinc-950 dark:text-white">
                        技能组 {index + 1}
                      </h4>
                      <p className="muted">{skill.name.zh || skill.name.en || '未命名技能组'}</p>
                    </div>
                    <Button
                      onClick={() => removeSkillGroup(index)}
                      size="sm"
                      type="button"
                      variant="ghost"
                    >
                      删除本组
                    </Button>
                  </div>

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
                </div>
              ))}
            </section>

            <section className="stack">
              <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                <div className="space-y-1">
                  <h3 className="text-base font-semibold text-zinc-950 dark:text-white">
                    亮点
                  </h3>
                  <p className="muted">维护个人优势、开源、团队协作等补充亮点，丰富公开页结尾信息。</p>
                </div>
                <Button onClick={addHighlight} size="sm" type="button" variant="outline">
                  新增亮点
                </Button>
              </div>

              {resumeDraft.highlights.length === 0 ? (
                <div className="status-box">
                  <strong>当前还没有亮点</strong>
                  <span>可补充开源、技术写作、团队建设等补充优势。</span>
                </div>
              ) : null}

              {resumeDraft.highlights.map((highlight, index) => (
                <div className="card stack" key={`highlight-${index}`}>
                  <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                    <div className="space-y-1">
                      <h4 className="text-sm font-semibold text-zinc-950 dark:text-white">
                        亮点 {index + 1}
                      </h4>
                      <p className="muted">
                        {highlight.title.zh || highlight.title.en || '未命名亮点'}
                      </p>
                    </div>
                    <Button
                      onClick={() => removeHighlight(index)}
                      size="sm"
                      type="button"
                      variant="ghost"
                    >
                      删除本条
                    </Button>
                  </div>

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
                </div>
              ))}
            </section>

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
