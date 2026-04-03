'use client';

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Chip,
} from '@heroui/react';

import { ResumeDraftEditorPanel } from './resume-draft-editor-panel';
import { DEFAULT_API_BASE_URL } from '../lib/env';
import { useAdminSession } from '../lib/admin-session';

const moduleRoadmap = [
  {
    key: 'profile',
    title: '基础信息',
    description: '已接通双语 profile 编辑、保存与草稿刷新，是当前唯一可直接操作的模块。',
    status: '已实现',
  },
  {
    key: 'education',
    title: '教育经历',
    description: '后续会补进独立列表编辑与排序，目前先只在数据模型中保留结构。',
    status: '规划中',
  },
  {
    key: 'experiences',
    title: '工作经历',
    description: '会与项目经历共用部分列表编辑模式，本轮先不扩到复杂表单。',
    status: '规划中',
  },
  {
    key: 'projects',
    title: '项目经历',
    description: '后续会结合 AI 建议回写能力一起扩展，当前先作为结构保留。',
    status: '规划中',
  },
  {
    key: 'skills',
    title: '技能与亮点',
    description: '会继续拆成技能组与亮点条目，保持和导出模型一致。',
    status: '规划中',
  },
] as const;

export function AdminResumeShell() {
  const { accessToken, currentUser, status } = useAdminSession();

  if (status !== 'ready' || !currentUser || !accessToken) {
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
                编辑模式：{currentUser.capabilities.canEditResume ? '可写' : '只读'}
              </Chip>
            </div>
            <div className="space-y-2">
              <CardTitle className="text-3xl font-semibold tracking-tight">
                简历编辑
              </CardTitle>
              <CardDescription className="max-w-2xl leading-7">
                这一页只负责简历草稿维护。内容保存后不会自动影响公开站，仍然需要到发布页手动发布，方便教学上清楚区分“编辑态”和“公开态”。
              </CardDescription>
            </div>
          </CardHeader>
          <CardContent className="stack">
            {currentUser.capabilities.canEditResume ? (
              <div className="status-box">
                当前阶段只开放 profile 模块真实编辑，其他模块先保留入口与结构说明。
              </div>
            ) : (
              <div className="readonly-box">
                viewer 进入本页时保持只读提示，不开放草稿保存。
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="border border-zinc-200/70 dark:border-zinc-800">
          <CardHeader className="flex flex-col items-start gap-2">
            <p className="eyebrow">模块规划</p>
            <CardTitle>内容分组入口</CardTitle>
            <CardDescription>
              v1 先把分组结构立住，让后续教育、经历、项目、技能扩展时不会把页面结构越做越乱。
            </CardDescription>
          </CardHeader>
          <CardContent className="stack">
            {moduleRoadmap.map((module) => (
              <div className="status-box" key={module.key}>
                <div className="flex items-center gap-2">
                  <strong>{module.title}</strong>
                  <Chip size="sm">
                    {module.status}
                  </Chip>
                </div>
                <span>{module.description}</span>
              </div>
            ))}
          </CardContent>
        </Card>
      </section>

      <ResumeDraftEditorPanel
        accessToken={accessToken}
        apiBaseUrl={DEFAULT_API_BASE_URL}
        canEdit={Boolean(currentUser.capabilities.canEditResume)}
      />
    </div>
  );
}
