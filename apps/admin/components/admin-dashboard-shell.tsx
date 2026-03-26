'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';

import {
  fetchCurrentUser,
  postProtectedAction,
  publishResume,
} from '../lib/auth-api';
import { AuthUserView } from '../lib/auth-types';
import { DEFAULT_API_BASE_URL } from '../lib/env';
import {
  clearAccessToken,
  readAccessToken,
} from '../lib/session-storage';
import { ExportEntryPanel } from './export-entry-panel';
import { ResumeDraftEditorPanel } from './resume-draft-editor-panel';
import { RoleActionPanel } from './role-action-panel';
import { ThemeModeToggle } from './theme-mode-toggle';

export function AdminDashboardShell() {
  const [status, setStatus] = useState<'loading' | 'ready' | 'unauthorized'>(
    'loading',
  );
  const [currentUser, setCurrentUser] = useState<AuthUserView | null>(null);
  const [pendingAction, setPendingAction] = useState<
    'publish' | 'ai-analysis' | null
  >(null);
  const [feedbackMessage, setFeedbackMessage] = useState<string | null>(null);

  useEffect(() => {
    const accessToken = readAccessToken();

    if (!accessToken) {
      setStatus('unauthorized');
      return;
    }

    fetchCurrentUser({
      apiBaseUrl: DEFAULT_API_BASE_URL,
      accessToken,
    })
      .then((user) => {
        setCurrentUser(user);
        setStatus('ready');
      })
      .catch(() => {
        clearAccessToken();
        setCurrentUser(null);
        setStatus('unauthorized');
      });
  }, []);

  if (status === 'loading') {
    return <main className="page-shell single-card">正在加载后台壳...</main>;
  }

  if (status === 'unauthorized' || !currentUser) {
    return (
      <main className="page-shell single-card">
        <section className="card stack">
          <div>
            <p className="eyebrow">未登录</p>
            <h1>请先登录后台</h1>
            <p className="muted">当前页面是最小受保护壳，需要先获取 JWT。</p>
          </div>
          <Link className="link-button" href="/">
            返回登录页
          </Link>
        </section>
      </main>
    );
  }

  async function handlePublish() {
    const accessToken = readAccessToken();

    if (!accessToken) {
      setStatus('unauthorized');
      return;
    }

    setPendingAction('publish');
    setFeedbackMessage(null);

    try {
      const result = await publishResume({
        apiBaseUrl: DEFAULT_API_BASE_URL,
        accessToken,
      });

      setFeedbackMessage(
        `简历已发布：${result.resume.meta.slug}，请刷新公开站查看最新内容。`,
      );
    } catch (error) {
      setFeedbackMessage(
        error instanceof Error ? error.message : '操作失败，请稍后重试',
      );
    } finally {
      setPendingAction(null);
    }
  }

  async function handleAiAction() {
    const accessToken = readAccessToken();

    if (!accessToken) {
      setStatus('unauthorized');
      return;
    }

    setPendingAction('ai-analysis');
    setFeedbackMessage(null);

    try {
      const result = await postProtectedAction({
        apiBaseUrl: DEFAULT_API_BASE_URL,
        accessToken,
        pathname: '/auth/demo/ai-analysis',
      });

      setFeedbackMessage(result.message);
    } catch (error) {
      setFeedbackMessage(
        error instanceof Error ? error.message : '操作失败，请稍后重试',
      );
    } finally {
      setPendingAction(null);
    }
  }

  return (
    <main className="page-shell single-card">
      <section className="card stack">
        <div className="page-header">
          <div className="page-header-copy">
            <p className="eyebrow">受保护页面</p>
            <h1>后台最小控制台壳</h1>
            <p className="muted">
              当前已接入最小草稿编辑闭环，继续保持“草稿保存”和“公开发布”分离。
            </p>
          </div>
          <ThemeModeToggle />
        </div>

        <div className="info-grid">
          <div className="info-item">
            <span>用户名</span>
            <strong>{currentUser.username}</strong>
          </div>
          <div className="info-item">
            <span>角色</span>
            <strong>{currentUser.role}</strong>
          </div>
          <div className="info-item">
            <span>可编辑简历</span>
            <strong>{String(currentUser.capabilities.canEditResume)}</strong>
          </div>
          <div className="info-item">
            <span>可触发 AI</span>
            <strong>
              {String(currentUser.capabilities.canTriggerAiAnalysis)}
            </strong>
          </div>
        </div>

        <ResumeDraftEditorPanel
          accessToken={readAccessToken() ?? ''}
          apiBaseUrl={DEFAULT_API_BASE_URL}
          canEdit={Boolean(currentUser.capabilities.canEditResume)}
        />

        <RoleActionPanel
          currentUser={currentUser}
          feedbackMessage={feedbackMessage}
          onPublish={handlePublish}
          onTriggerAi={handleAiAction}
          pendingAction={pendingAction}
        />

        <ExportEntryPanel
          apiBaseUrl={DEFAULT_API_BASE_URL}
          locale="zh"
          role={currentUser.role}
        />

        <button
          onClick={() => {
            clearAccessToken();
            window.location.href = '/';
          }}
          type="button"
        >
          退出当前登录
        </button>
      </section>
    </main>
  );
}
