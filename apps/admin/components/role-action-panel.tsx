'use client';

import {
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@heroui/react';

import { AuthUserView } from '../lib/auth-types';

interface RoleActionPanelProps {
  currentUser: AuthUserView;
  pendingAction: 'publish' | 'ai-analysis' | null;
  feedbackMessage: string | null;
  onPublish: () => Promise<void>;
  onTriggerAi: () => Promise<void>;
}

export function RoleActionPanel({
  currentUser,
  pendingAction,
  feedbackMessage,
  onPublish,
  onTriggerAi,
}: RoleActionPanelProps) {
  const isViewer = currentUser.role === 'viewer';

  return (
    <Card className="border border-zinc-200/70 dark:border-zinc-800">
      <CardHeader className="flex flex-col items-start gap-2">
        <p className="eyebrow">角色动作</p>
        <CardTitle>动作中心</CardTitle>
        <CardDescription>
          当前阶段用最小动作集验证“viewer 只读、admin 可写”的权限边界。
        </CardDescription>
      </CardHeader>
      <CardContent className="stack">
        {isViewer ? (
          <div className="readonly-box">
            当前账号为 viewer，只能查看，不能修改或触发真实操作。
          </div>
        ) : (
          <div className="status-box">
            当前账号为 admin，可执行发布与 AI 分析等敏感动作。
          </div>
        )}

        <div className="action-grid">
          <Button
            className="action-grid-button is-primary"
            fullWidth
            isDisabled={isViewer || pendingAction !== null}
            onClick={() => void onPublish()}
            size="md"
            type="button"
            variant="primary"
          >
            {pendingAction === 'publish' ? '发布中...' : '发布简历（管理员）'}
          </Button>
          <Button
            className="action-grid-button is-secondary"
            fullWidth
            isDisabled={isViewer || pendingAction !== null}
            onClick={() => void onTriggerAi()}
            size="md"
            type="button"
            variant="outline"
          >
            {pendingAction === 'ai-analysis'
              ? '触发中...'
              : '触发 AI 分析（管理员）'}
          </Button>
        </div>

        {feedbackMessage ? (
          <div className="dashboard-inline-note">{feedbackMessage}</div>
        ) : null}
      </CardContent>
    </Card>
  );
}
