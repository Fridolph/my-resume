'use client';

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Chip,
} from '@heroui/react';
import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';

import type { AiWorkbenchRuntimeSummary } from '../../lib/ai-workbench-types';
import {
  ensureAiRuntimeSummary,
  ensureDraftResumeSummary,
} from '../../lib/admin-resource-store';
import { DEFAULT_API_BASE_URL } from '../../lib/env';
import { readResumeLocaleCookie } from '../../lib/resume-locale';
import type { ResumeDraftSummarySnapshot } from '../../lib/resume-types';
import { useAdminSession } from '../../lib/admin-session';

const workflowListClass = 'm-0 grid list-none gap-3.5 p-0';
const workflowItemClass =
  'grid gap-1.5 rounded-[18px] border border-[color:var(--admin-border)] bg-[var(--admin-surface-muted)] p-4';

type AsyncState = 'idle' | 'loading' | 'ready' | 'error';

const quickEntryCards = [
  {
    href: '/dashboard/resume',
    title: '简历编辑',
    description: '继续维护标准双语简历草稿，保留“先草稿，后发布”的节奏。',
    actionLabel: '进入简历编辑',
  },
  {
    href: '/dashboard/ai',
    title: 'AI 工作台',
    description: '处理上传、分析、缓存报告与草稿回写的核心入口。',
    actionLabel: '进入 AI 工作台',
  },
  {
    href: '/dashboard/publish',
    title: '发布与导出',
    description: '集中查看角色动作边界、发布入口与导出下载。',
    actionLabel: '进入发布与导出',
  },
] as const;

export function AdminDashboardShell() {
  const { accessToken, currentUser, status } = useAdminSession();
  const summaryLocale = readResumeLocaleCookie();
  const [runtimeState, setRuntimeState] = useState<AsyncState>('idle');
  const [runtimeSummary, setRuntimeSummary] =
    useState<AiWorkbenchRuntimeSummary | null>(null);
  const [runtimeMessage, setRuntimeMessage] = useState<string | null>(null);
  const [draftState, setDraftState] = useState<AsyncState>('idle');
  const [draftSnapshot, setDraftSnapshot] = useState<ResumeDraftSummarySnapshot | null>(
    null,
  );
  const [draftMessage, setDraftMessage] = useState<string | null>(null);

  useEffect(() => {
    if (status !== 'ready' || !accessToken) {
      return;
    }

    let cancelled = false;
    setRuntimeState('loading');
    setRuntimeMessage(null);

    ensureAiRuntimeSummary({
      apiBaseUrl: DEFAULT_API_BASE_URL,
      accessToken,
    })
      .then((result) => {
        if (cancelled) {
          return;
        }

        setRuntimeSummary(result);
        setRuntimeState('ready');
      })
      .catch((error) => {
        if (cancelled) {
          return;
        }

        setRuntimeSummary(null);
        setRuntimeState('error');
        setRuntimeMessage(
          error instanceof Error ? error.message : 'AI 运行时摘要读取失败',
        );
      });

    return () => {
      cancelled = true;
    };
  }, [accessToken, status]);

  useEffect(() => {
    if (
      status !== 'ready' ||
      !accessToken ||
      !currentUser?.capabilities.canEditResume
    ) {
      return;
    }

    let cancelled = false;
    setDraftState('loading');
    setDraftMessage(null);

    ensureDraftResumeSummary({
      apiBaseUrl: DEFAULT_API_BASE_URL,
      accessToken,
      locale: summaryLocale,
    })
      .then((result) => {
        if (cancelled) {
          return;
        }

        setDraftSnapshot(result);
        setDraftState('ready');
      })
      .catch((error) => {
        if (cancelled) {
          return;
        }

        setDraftSnapshot(null);
        setDraftState('error');
        setDraftMessage(
          error instanceof Error ? error.message : '草稿摘要读取失败',
        );
      });

    return () => {
      cancelled = true;
    };
  }, [accessToken, currentUser?.capabilities.canEditResume, status, summaryLocale]);

  const capabilityCards = useMemo(() => {
    if (!currentUser) {
      return [];
    }

    return [
      {
        label: '内容编辑',
        value: currentUser.capabilities.canEditResume ? '可写' : '只读',
        description: currentUser.capabilities.canEditResume
          ? '当前账号可维护简历草稿。'
          : '当前账号只能查看既有数据与体验结果。',
      },
      {
        label: '发布动作',
        value: currentUser.capabilities.canPublishResume ? '可发布' : '受限',
        description: currentUser.capabilities.canPublishResume
          ? '可执行正式发布。'
          : 'viewer 不可触发发布。',
      },
      {
        label: 'AI 能力',
        value: currentUser.capabilities.canTriggerAiAnalysis
          ? '真实调用'
          : '缓存体验',
        description: currentUser.capabilities.canTriggerAiAnalysis
          ? '可上传并触发真实分析。'
          : '只保留缓存报告与预设体验。',
      },
      {
        label: '业务后端',
        value: 'NestJS',
        description: '后台 UI 只调用 apps/server，不拆第二套业务后端。',
      },
    ];
  }, [currentUser]);

  if (status !== 'ready' || !currentUser) {
    return null;
  }

  return (
    <div className="stack">
      <section className="grid gap-4 xl:grid-cols-2">
        <Card className="border border-zinc-200/70 dark:border-zinc-800">
          <CardHeader className="flex flex-col items-start gap-3">
            <div className="flex flex-wrap gap-2">
              <Chip size="sm">
                当前账号：{currentUser.username}
              </Chip>
              <Chip size="sm">
                当前角色：{currentUser.role}
              </Chip>
            </div>
            <div className="space-y-2">
              <CardTitle className="text-3xl font-semibold tracking-tight">
                工作区概览
              </CardTitle>
              <CardDescription className="max-w-2xl leading-7">
                这一页负责把后台的角色能力、AI 运行时状态、草稿摘要和主工作区入口收束成一个稳定首页，方便后续继续扩展而不散落。
              </CardDescription>
            </div>
          </CardHeader>
          <CardContent className="stack">
            <div className="dashboard-badge-row">
              <Chip>
                鉴权模式：localStorage token + /auth/me
              </Chip>
              <Chip>
                单后端：apps/server
              </Chip>
              <Chip>
                公开站只读取发布态
              </Chip>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              {capabilityCards.map((card) => (
                <div className="status-box" key={card.label}>
                  <span className="text-sm font-medium text-zinc-500 dark:text-zinc-400">
                    {card.label}
                  </span>
                  <strong className="text-lg">{card.value}</strong>
                  <span className="text-sm text-zinc-500 dark:text-zinc-400">
                    {card.description}
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card className="border border-zinc-200/70 dark:border-zinc-800">
          <CardHeader className="flex flex-col items-start gap-2">
            <p className="eyebrow">会话与边界</p>
            <CardTitle>后台主承诺</CardTitle>
            <CardDescription>
              当前这轮优先把标准后台 IA 与壳层搭稳，保持认证链路和服务端 API 不变。
            </CardDescription>
          </CardHeader>
          <CardContent className="stack">
            {currentUser.role === 'viewer' ? (
              <div className="readonly-box">
                viewer 当前只能体验缓存结果与只读链路，不能触发真实敏感操作。
              </div>
            ) : (
              <div className="status-box">
                admin 当前可继续维护草稿、触发 AI、发布内容并导出结果。
              </div>
            )}

            <ol className={workflowListClass}>
              <li className={workflowItemClass}>
                <strong>先维护草稿</strong>
                <span>简历编辑页优先服务草稿态，不直接影响公开站。</span>
              </li>
              <li className={workflowItemClass}>
                <strong>再验证 AI 与发布</strong>
                <span>AI 工作台和发布页负责动作型入口，不和内容编辑混在一起。</span>
              </li>
              <li className={workflowItemClass}>
                <strong>最后再做展示端升级</strong>
                <span>本轮只升级 admin，不把样式迁移一次扩到整个 monorepo。</span>
              </li>
            </ol>
          </CardContent>
        </Card>
      </section>

      <section className="grid gap-4 xl:grid-cols-2">
        <Card className="border border-zinc-200/70 dark:border-zinc-800">
          <CardHeader className="flex flex-col items-start gap-2">
            <p className="eyebrow">运行时</p>
            <CardTitle>AI Provider 状态</CardTitle>
            <CardDescription>
              在进入 AI 工作台前，先确认当前后端 Provider、模型和运行模式是否正确。
            </CardDescription>
          </CardHeader>
          <CardContent className="stack">
            {runtimeState === 'loading' ? (
              <p className="muted">正在加载 AI 工作台运行时摘要...</p>
            ) : null}
            {runtimeState === 'error' && runtimeMessage ? (
              <p className="error-text">{runtimeMessage}</p>
            ) : null}
            {runtimeSummary ? (
              <div className="grid gap-4 md:grid-cols-2">
                <div className="status-box">
                  <span>Provider</span>
                  <strong>{runtimeSummary.provider}</strong>
                </div>
                <div className="status-box">
                  <span>模型</span>
                  <strong>{runtimeSummary.model}</strong>
                </div>
                <div className="status-box">
                  <span>模式</span>
                  <strong>{runtimeSummary.mode}</strong>
                </div>
                <div className="status-box">
                  <span>支持场景</span>
                  <strong>{runtimeSummary.supportedScenarios.length}</strong>
                </div>
              </div>
            ) : null}
          </CardContent>
        </Card>

        <Card className="border border-zinc-200/70 dark:border-zinc-800">
          <CardHeader className="flex flex-col items-start gap-2">
            <p className="eyebrow">草稿摘要</p>
            <CardTitle>当前内容工作区</CardTitle>
            <CardDescription>
              概览页只展示摘要，不承担具体编辑；真正的表单维护留在独立简历编辑页。
            </CardDescription>
          </CardHeader>
          <CardContent className="stack">
            {!currentUser.capabilities.canEditResume ? (
              <div className="readonly-box">
                当前角色没有草稿读取与编辑权限。
              </div>
            ) : null}
            {draftState === 'loading' ? (
              <p className="muted">正在加载草稿摘要...</p>
            ) : null}
            {draftState === 'error' && draftMessage ? (
              <p className="error-text">{draftMessage}</p>
            ) : null}
            {draftSnapshot ? (
              <div className="status-box">
                <strong>{draftSnapshot.resume.profile.headline}</strong>
                <span>{draftSnapshot.resume.profile.summary}</span>
              </div>
            ) : null}
          </CardContent>
        </Card>
      </section>

      <section className="stack">
        <div className="space-y-2">
          <p className="eyebrow">快捷入口</p>
          <h2 className="m-0 text-2xl font-semibold">内容工作区</h2>
          <p className="muted">
            这里把后台本轮的三个主工作区都收住，方便从概览页快速切换。
          </p>
        </div>
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {quickEntryCards.map((item) => (
            <Card className="border border-zinc-200/70 dark:border-zinc-800" key={item.href}>
              <CardHeader className="flex flex-col items-start gap-2">
                <CardTitle className="text-xl">{item.title}</CardTitle>
                <CardDescription>{item.description}</CardDescription>
              </CardHeader>
              <CardContent>
                <Link className="link-button" href={item.href}>
                  {item.actionLabel}
                </Link>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>
    </div>
  );
}
