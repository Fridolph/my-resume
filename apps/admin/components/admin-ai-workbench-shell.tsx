'use client';

import {
  DisplayPill,
  DisplaySectionIntro,
  DisplayStatCard,
  DisplaySurfaceCard,
} from '@my-resume/ui/display';
import Link from 'next/link';
import { useEffect, useState } from 'react';

import {
  fetchCurrentUser,
} from '../lib/auth-api';
import { fetchAiWorkbenchRuntime } from '../lib/ai-workbench-api';
import { AiWorkbenchRuntimeSummary } from '../lib/ai-workbench-types';
import { AuthUserView } from '../lib/auth-types';
import { DEFAULT_API_BASE_URL } from '../lib/env';
import {
  clearAccessToken,
  readAccessToken,
} from '../lib/session-storage';
import { ThemeModeToggle } from './theme-mode-toggle';
import { AiFileExtractionPanel } from './ai-file-extraction-panel';

const scenarioCards = {
  'jd-match': {
    title: 'JD 匹配分析',
    description: '后续用于粘贴 JD 或解析后的文本，生成匹配度与补强建议。',
  },
  'resume-review': {
    title: '简历优化建议',
    description: '后续用于基于当前标准简历内容，输出更聚焦的优化方向。',
  },
  'offer-compare': {
    title: 'Offer 对比建议',
    description: '后续用于对比多个 offer 的岗位信息、成长空间与取舍理由。',
  },
} as const;

export function AdminAiWorkbenchShell() {
  const [status, setStatus] = useState<'loading' | 'ready' | 'unauthorized'>(
    'loading',
  );
  const [currentUser, setCurrentUser] = useState<AuthUserView | null>(null);
  const [runtimeSummary, setRuntimeSummary] =
    useState<AiWorkbenchRuntimeSummary | null>(null);

  useEffect(() => {
    const accessToken = readAccessToken();

    if (!accessToken) {
      setStatus('unauthorized');
      return;
    }

    Promise.all([
      fetchCurrentUser({
        apiBaseUrl: DEFAULT_API_BASE_URL,
        accessToken,
      }),
      fetchAiWorkbenchRuntime({
        apiBaseUrl: DEFAULT_API_BASE_URL,
        accessToken,
      }),
    ])
      .then(([user, runtime]) => {
        setCurrentUser(user);
        setRuntimeSummary(runtime);
        setStatus('ready');
      })
      .catch(() => {
        clearAccessToken();
        setCurrentUser(null);
        setRuntimeSummary(null);
        setStatus('unauthorized');
      });
  }, []);

  if (status === 'loading') {
    return (
      <main className="page-shell single-card">
        <DisplaySurfaceCard className="card">正在加载 AI 工作台...</DisplaySurfaceCard>
      </main>
    );
  }

  if (status === 'unauthorized' || !currentUser || !runtimeSummary) {
    return (
      <main className="page-shell single-card">
        <DisplaySurfaceCard className="card stack">
          <DisplaySectionIntro
            description="AI 工作台属于受保护页面，需要先获取 JWT。"
            eyebrow="未登录"
            title="请先登录后台"
            titleAs="h1"
          />
          <Link className="link-button" href="/">
            返回登录页
          </Link>
        </DisplaySurfaceCard>
      </main>
    );
  }

  const isAdmin = Boolean(currentUser.capabilities.canTriggerAiAnalysis);
  const roleMessage = isAdmin
    ? '当前账号可继续接入上传、真实分析和结果阅读。'
    : 'viewer 当前只允许查看缓存结果与预设体验，不能上传文件或触发真实分析。';

  return (
    <main className="dashboard-shell ai-workbench-shell">
      <DisplaySurfaceCard className="card dashboard-hero">
        <div className="page-header">
          <DisplaySectionIntro
            className="page-header-copy"
            description="这一页先把 AI 能力入口、Provider 状态、分析场景和角色边界集中讲清楚，为后续上传、提取和真实分析闭环打底。"
            eyebrow="受保护页面"
            title="AI 工作台"
            titleAs="h1"
          />
          <div className="dashboard-hero-actions">
            <ThemeModeToggle />
            <Link className="secondary-link-button" href="/dashboard">
              返回控制台
            </Link>
          </div>
        </div>

        <div className="dashboard-badge-row">
          <DisplayPill className="dashboard-badge">
            当前账号：{currentUser.username}
          </DisplayPill>
          <DisplayPill className="dashboard-badge">
            当前角色：{currentUser.role}
          </DisplayPill>
          <DisplayPill className="dashboard-badge">
            当前 Provider：{runtimeSummary.provider}
          </DisplayPill>
          <DisplayPill className="dashboard-badge">
            当前模型：{runtimeSummary.model}
          </DisplayPill>
          <DisplayPill className="dashboard-badge">
            运行模式：{runtimeSummary.mode}
          </DisplayPill>
        </div>

        <div className="dashboard-inline-note">{roleMessage}</div>
      </DisplaySurfaceCard>

      <section className="dashboard-main-grid ai-workbench-grid">
        <div className="dashboard-column stack">
          <AiFileExtractionPanel
            accessToken={readAccessToken() ?? ''}
            apiBaseUrl={DEFAULT_API_BASE_URL}
            canUpload={isAdmin}
          />

          <DisplaySurfaceCard className="card stack">
            <DisplaySectionIntro
              description="当前先把 AI 能力按场景讲清楚，不急着把上传、分析和结果阅读一次性全部做完。"
              eyebrow="场景规划"
              title="支持的分析场景"
            />
            <div className="scenario-grid">
              {runtimeSummary.supportedScenarios.map((scenario) => (
                <DisplaySurfaceCard
                  as="article"
                  className="scenario-card"
                  key={scenario}
                >
                  <DisplaySectionIntro
                    compact
                    description={scenarioCards[scenario].description}
                    eyebrow="M10 入口"
                    title={scenarioCards[scenario].title}
                    titleAs="h2"
                  />
                </DisplaySurfaceCard>
              ))}
            </div>
          </DisplaySurfaceCard>
        </div>

        <aside className="dashboard-column stack">
          <DisplaySurfaceCard className="card stack">
            <DisplaySectionIntro
              description="先把当前运行时状态和角色限制写清楚，避免 AI 工作台后续越做越散。"
              eyebrow="运行时摘要"
              title="Provider 与边界"
            />

            <div className="info-grid">
              <DisplayStatCard label="Provider" value={runtimeSummary.provider} />
              <DisplayStatCard label="Model" value={runtimeSummary.model} />
              <DisplayStatCard label="Mode" value={runtimeSummary.mode} />
              <DisplayStatCard
                label="分析场景"
                value={String(runtimeSummary.supportedScenarios.length)}
              />
            </div>

            <ul className="muted-list">
              <li>业务逻辑继续统一由 `apps/server` 承载，不写 Next Route Handlers 业务接口。</li>
              <li>本轮先打通“上传 -&gt; 提取 -&gt; 预览”闭环，真实分析与附件沉淀继续后置。</li>
              <li>
                后续 issue 会按“上传提取 {'->'} 真实分析 {'->'} viewer 边界”继续推进。
              </li>
            </ul>
          </DisplaySurfaceCard>
        </aside>
      </section>
    </main>
  );
}
