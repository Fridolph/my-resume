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

import {
  fetchDraftResume,
  updateDraftResume,
} from '../lib/resume-draft-api';
import { ResumeDraftSnapshot, ResumeProfile, StandardResume } from '../lib/resume-types';

interface ResumeDraftEditorPanelProps {
  apiBaseUrl: string;
  accessToken: string;
  canEdit: boolean;
  loadDraft?: typeof fetchDraftResume;
  saveDraft?: typeof updateDraftResume;
}

type DraftEditorStatus = 'idle' | 'loading' | 'ready' | 'error';

function cloneResume(resume: StandardResume): StandardResume {
  return JSON.parse(JSON.stringify(resume)) as StandardResume;
}

function cloneProfile(profile: ResumeProfile): ResumeProfile {
  return JSON.parse(JSON.stringify(profile)) as ResumeProfile;
}

function formatIsoDateTime(iso: string): string {
  return new Date(iso).toLocaleString('zh-CN', {
    hour12: false,
  });
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
  const [profileDraft, setProfileDraft] = useState<ResumeProfile | null>(null);
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
        setProfileDraft(cloneProfile(snapshot.resume.profile));
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

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!draftSnapshot || !profileDraft) {
      return;
    }

    setPendingSave(true);
    setErrorMessage(null);
    setFeedbackMessage(null);

    try {
      const nextResume = cloneResume(draftSnapshot.resume);
      nextResume.profile = cloneProfile(profileDraft);

      const nextSnapshot = await saveDraft({
        apiBaseUrl,
        accessToken,
        resume: nextResume,
      });

      setDraftSnapshot(nextSnapshot);
      setProfileDraft(cloneProfile(nextSnapshot.resume.profile));
      setFeedbackMessage('草稿已保存。公开站内容不会自动变化，仍需手动发布。');
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : '草稿保存失败，请稍后重试',
      );
    } finally {
      setPendingSave(false);
    }
  }

  function updateLocalizedField(
    field: keyof Pick<
      ResumeProfile,
      'fullName' | 'headline' | 'summary' | 'location'
    >,
    locale: 'zh' | 'en',
    value: string,
  ) {
    setProfileDraft((current) => {
      if (!current) {
        return current;
      }

      return {
        ...current,
        [field]: {
          ...current[field],
          [locale]: value,
        },
      };
    });
  }

  function updatePlainField(
    field: keyof Pick<ResumeProfile, 'email' | 'phone' | 'website'>,
    value: string,
  ) {
    setProfileDraft((current) => {
      if (!current) {
        return current;
      }

      return {
        ...current,
        [field]: value,
      };
    });
  }

  return (
    <Card className="border border-zinc-200/70 dark:border-zinc-800">
      <CardHeader className="flex flex-col items-start gap-2">
        <p className="eyebrow">草稿编辑</p>
        <CardTitle>最小 profile 编辑面板</CardTitle>
        <CardDescription>
          当前先接通个人信息模块的读取与保存，其余模块继续沿用草稿中的原始内容。
        </CardDescription>
      </CardHeader>
      <CardContent className="stack">
        {status === 'loading' ? <p className="muted">正在加载草稿...</p> : null}

        {status === 'error' && errorMessage ? (
          <p className="error-text">{errorMessage}</p>
        ) : null}

        {status === 'ready' && profileDraft && draftSnapshot ? (
          <form className="stack" onSubmit={(event) => void handleSubmit(event)}>
            <div className="status-box">
              <strong>草稿态与发布态分离</strong>
              <span>保存只会更新后台草稿，公开站仍读取最近一次手动发布的版本。</span>
              {lastUpdatedLabel ? <span>最近保存：{lastUpdatedLabel}</span> : null}
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <label className="field">
                <span>中文姓名</span>
                <Input
                  fullWidth
                  onChange={(event) =>
                    updateLocalizedField('fullName', 'zh', event.target.value)
                  }
                  value={profileDraft.fullName.zh}
                  variant="secondary"
                />
              </label>
              <label className="field">
                <span>英文姓名</span>
                <Input
                  fullWidth
                  onChange={(event) =>
                    updateLocalizedField('fullName', 'en', event.target.value)
                  }
                  value={profileDraft.fullName.en}
                  variant="secondary"
                />
              </label>

              <label className="field">
                <span>中文标题</span>
                <Input
                  fullWidth
                  onChange={(event) =>
                    updateLocalizedField('headline', 'zh', event.target.value)
                  }
                  value={profileDraft.headline.zh}
                  variant="secondary"
                />
              </label>
              <label className="field">
                <span>英文标题</span>
                <Input
                  fullWidth
                  onChange={(event) =>
                    updateLocalizedField('headline', 'en', event.target.value)
                  }
                  value={profileDraft.headline.en}
                  variant="secondary"
                />
              </label>

              <label className="field">
                <span>中文所在地</span>
                <Input
                  fullWidth
                  onChange={(event) =>
                    updateLocalizedField('location', 'zh', event.target.value)
                  }
                  value={profileDraft.location.zh}
                  variant="secondary"
                />
              </label>
              <label className="field">
                <span>英文所在地</span>
                <Input
                  fullWidth
                  onChange={(event) =>
                    updateLocalizedField('location', 'en', event.target.value)
                  }
                  value={profileDraft.location.en}
                  variant="secondary"
                />
              </label>

              <label className="field">
                <span>邮箱</span>
                <Input
                  fullWidth
                  onChange={(event) => updatePlainField('email', event.target.value)}
                  value={profileDraft.email}
                  variant="secondary"
                />
              </label>
              <label className="field">
                <span>电话</span>
                <Input
                  fullWidth
                  onChange={(event) => updatePlainField('phone', event.target.value)}
                  value={profileDraft.phone}
                  variant="secondary"
                />
              </label>
            </div>

            <label className="field">
              <span>个人网站</span>
              <Input
                fullWidth
                onChange={(event) => updatePlainField('website', event.target.value)}
                value={profileDraft.website}
                variant="secondary"
              />
            </label>

            <div className="grid gap-4 md:grid-cols-2">
              <label className="field">
                <span>中文简介</span>
                <TextArea
                  fullWidth
                  onChange={(event) =>
                    updateLocalizedField('summary', 'zh', event.target.value)
                  }
                  rows={5}
                  value={profileDraft.summary.zh}
                  variant="secondary"
                />
              </label>
              <label className="field">
                <span>英文简介</span>
                <TextArea
                  fullWidth
                  onChange={(event) =>
                    updateLocalizedField('summary', 'en', event.target.value)
                  }
                  rows={5}
                  value={profileDraft.summary.en}
                  variant="secondary"
                />
              </label>
            </div>

            {errorMessage ? (
              <p className="error-text">{errorMessage}</p>
            ) : null}
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
