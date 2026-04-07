import { cleanup, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import { RoleActionPanel } from '../role-action-panel';

const viewerUser = {
  id: 'viewer-demo-user',
  username: 'viewer',
  role: 'viewer' as const,
  isActive: true,
  capabilities: {
    canPublishResume: false,
    canTriggerAiAnalysis: false,
  },
};

const adminUser = {
  id: 'admin-demo-user',
  username: 'admin',
  role: 'admin' as const,
  isActive: true,
  capabilities: {
    canPublishResume: true,
    canTriggerAiAnalysis: true,
  },
};

describe('RoleActionPanel', () => {
  it('should show viewer read-only notice and disable sensitive actions', () => {
    render(
      <RoleActionPanel
        currentUser={viewerUser}
        onPublish={vi.fn()}
        onTriggerAi={vi.fn()}
        pendingAction={null}
        feedbackMessage={null}
      />,
    );

    expect(screen.getByText('当前账号为 viewer，只能查看，不能修改或触发真实操作。')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '发布简历（管理员）' })).toBeDisabled();
    expect(screen.getByRole('button', { name: '触发 AI 分析（管理员）' })).toBeDisabled();
  });

  it('should enable sensitive actions for admin', async () => {
    const user = userEvent.setup();
    const onPublish = vi.fn().mockResolvedValue(undefined);
    const onTriggerAi = vi.fn().mockResolvedValue(undefined);
    cleanup();

    render(
      <RoleActionPanel
        currentUser={adminUser}
        onPublish={onPublish}
        onTriggerAi={onTriggerAi}
        pendingAction={null}
        feedbackMessage={null}
      />,
    );

    await user.click(screen.getByRole('button', { name: '发布简历（管理员）' }));
    await user.click(screen.getByRole('button', { name: '触发 AI 分析（管理员）' }));

    expect(onPublish).toHaveBeenCalled();
    expect(onTriggerAi).toHaveBeenCalled();
  });
});
