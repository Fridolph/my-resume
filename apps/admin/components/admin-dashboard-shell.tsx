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

  const capabilityCards = [
    {
      label: '内容编辑',
      value: currentUser.capabilities.canEditResume ? '可写' : '只读',
      description: currentUser.capabilities.canEditResume
        ? '可直接维护草稿内容。'
        : '当前仅展示已存在的草稿信息。',
    },
    {
      label: '发布动作',
      value: currentUser.capabilities.canPublishResume ? '可发布' : '受限',
      description: currentUser.capabilities.canPublishResume
        ? '可手动发布最新草稿到公开站。'
        : '当前角色不能触发新的发布动作。',
    },
    {
      label: 'AI 体验',
      value: currentUser.capabilities.canTriggerAiAnalysis ? '真实触发' : '缓存体验',
      description: currentUser.capabilities.canTriggerAiAnalysis
        ? '可触发真实分析接口。'
        : '当前只保留缓存结果和只读体验。',
    },
    {
      label: '业务边界',
      value: '单后端',
      description: '业务逻辑统一继续收敛在 apps/server。',
    },
  ];

  const workflowSteps = [
    {
      title: '编辑草稿',
      description: '后台工作区只维护 draft，避免公开内容在保存时被直接改动。',
    },
    {
      title: '手动发布',
      description: '只有 admin 可执行发布动作，公开站始终读取最近一次发布版本。',
    },
    {
      title: '体验与导出',
      description: 'viewer 只读体验缓存结果与导出入口，admin 可继续推进真实动作。',
    },
  ];

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
    <main className="dashboard-shell">
      <section className="card dashboard-hero">
        <div className="page-header">
          <div className="page-header-copy">
            <p className="eyebrow">受保护页面</p>
            <h1>后台控制台</h1>
            <p className="muted">
              当前阶段先把“草稿编辑、手动发布、角色边界、导出入口”收进一张可解释的后台首页，
              为后续信息架构升级和教学演示打底。
            </p>
          </div>
          <div className="dashboard-hero-actions">
            <ThemeModeToggle />
            <button
              className="secondary-button"
              onClick={() => {
                clearAccessToken();
                window.location.href = '/';
              }}
              type="button"
            >
              退出当前登录
            </button>
          </div>
        </div>

        <div className="dashboard-badge-row">
          <span className="display-pill dashboard-badge">当前账号：{currentUser.username}</span>
          <span className="display-pill dashboard-badge">当前角色：{currentUser.role}</span>
          <span className="display-pill dashboard-badge">公开站只读已发布版本</span>
          <span className="display-pill dashboard-badge">单后端业务入口：apps/server</span>
        </div>

        <div className="dashboard-overview-grid">
          {capabilityCards.map((card) => (
            <div className="info-item dashboard-overview-card" key={card.label}>
              <span>{card.label}</span>
              <strong>{card.value}</strong>
              <p className="muted">{card.description}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="dashboard-main-grid">
        <div className="dashboard-column stack">
          <section className="card stack">
            <div>
              <p className="eyebrow">工作区概览</p>
              <h2>内容工作区</h2>
              <p className="muted">
                当前先聚焦 profile 草稿编辑，保持“先保存草稿，再手动发布”的主线节奏。
              </p>
            </div>
            <div className="dashboard-inline-note">
              这一区域只负责内容维护，不直接承载公开站语义和 AI 业务逻辑。
            </div>
          </section>

          <ResumeDraftEditorPanel
            accessToken={readAccessToken() ?? ''}
            apiBaseUrl={DEFAULT_API_BASE_URL}
            canEdit={Boolean(currentUser.capabilities.canEditResume)}
          />
        </div>

        <aside className="dashboard-column stack">
          <section className="card stack">
            <div>
              <p className="eyebrow">会话信息</p>
              <h2>会话与边界</h2>
              <p className="muted">
                当前后台只做单管理员 / viewer 教学型权限边界，不扩展到复杂多角色后台。
              </p>
            </div>

            <div className="info-grid">
              <div className="info-item">
                <span>当前账号</span>
                <strong>{currentUser.username}</strong>
              </div>
              <div className="info-item">
                <span>角色身份</span>
                <strong>{currentUser.role}</strong>
              </div>
            </div>

            <p className="muted">
              {currentUser.role === 'viewer'
                ? 'viewer 当前只能体验缓存结果与只读链路，不能触发真实敏感操作。'
                : 'admin 当前可继续维护草稿、发布公开内容，并触发真实 AI 演示动作。'}
            </p>

            <div className="dashboard-inline-note">
              业务规则继续只由 `apps/server` 提供，后台页面只负责组织信息与触发入口。
            </div>
          </section>

          <RoleActionPanel
            currentUser={currentUser}
            feedbackMessage={feedbackMessage}
            onPublish={handlePublish}
            onTriggerAi={handleAiAction}
            pendingAction={pendingAction}
          />

          <section className="card stack">
            <div>
              <p className="eyebrow">发布流提示</p>
              <h2>流程提示</h2>
              <p className="muted">
                把当前后台里最重要的几步写清楚，方便演示、截图和后续教学交接。
              </p>
            </div>

            <ol className="workflow-list">
              {workflowSteps.map((step) => (
                <li className="workflow-item" key={step.title}>
                  <strong>{step.title}</strong>
                  <span className="muted">{step.description}</span>
                </li>
              ))}
            </ol>
          </section>

          <ExportEntryPanel
            apiBaseUrl={DEFAULT_API_BASE_URL}
            locale="zh"
            role={currentUser.role}
          />
        </aside>
      </section>
    </main>
  );
}
