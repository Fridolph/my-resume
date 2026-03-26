'use client';

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
    <section className="card stack">
      <div>
        <p className="eyebrow">角色动作</p>
        <h2>动作中心</h2>
        <p className="muted">
          当前阶段用最小演示动作验证“viewer 只读、admin 可写”。
        </p>
      </div>

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
        <button
          disabled={isViewer || pendingAction !== null}
          onClick={() => void onPublish()}
          type="button"
        >
          {pendingAction === 'publish' ? '发布中...' : '发布简历（管理员）'}
        </button>
        <button
          disabled={isViewer || pendingAction !== null}
          onClick={() => void onTriggerAi()}
          type="button"
        >
          {pendingAction === 'ai-analysis'
            ? '触发中...'
            : '触发 AI 分析（管理员）'}
        </button>
      </div>

      {feedbackMessage ? <p className="muted">{feedbackMessage}</p> : null}
    </section>
  );
}
