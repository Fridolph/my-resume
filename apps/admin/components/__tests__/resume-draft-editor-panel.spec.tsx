'use client';

import { cleanup, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import type { ResumeDraftSnapshot } from '../../lib/resume-types';
import { ResumeDraftEditorPanel } from '../resume-draft-editor-panel';

const draftSnapshot: ResumeDraftSnapshot = {
  status: 'draft' as const,
  updatedAt: '2026-03-25T09:20:00.000Z',
  resume: {
    meta: {
      slug: 'standard-resume' as const,
      version: 1 as const,
      defaultLocale: 'zh' as const,
      locales: ['zh', 'en'],
    },
    profile: {
      fullName: {
        zh: '付寅生',
        en: 'Yinsheng Fu',
      },
      headline: {
        zh: '全栈开发工程师',
        en: 'Full-Stack Engineer',
      },
      summary: {
        zh: '草稿摘要',
        en: 'Draft summary',
      },
      location: {
        zh: '上海',
        en: 'Shanghai',
      },
      email: 'demo@example.com',
      phone: '+86 13800000000',
      website: 'https://example.com',
      links: [],
      interests: [],
    },
    education: [],
    experiences: [],
    projects: [],
    skills: [],
    highlights: [],
  },
};

describe('ResumeDraftEditorPanel', () => {
  it('should load and render current draft profile fields for admin', async () => {
    const loadDraft = vi.fn().mockResolvedValue(draftSnapshot);

    render(
      <ResumeDraftEditorPanel
        accessToken="demo-token"
        apiBaseUrl="http://localhost:5577"
        canEdit
        loadDraft={loadDraft}
        saveDraft={vi.fn()}
      />,
    );

    expect(screen.getByText('正在加载草稿...')).toBeInTheDocument();

    expect(await screen.findByDisplayValue('付寅生')).toBeInTheDocument();
    expect(screen.getByDisplayValue('Full-Stack Engineer')).toBeInTheDocument();
    expect(loadDraft).toHaveBeenCalled();
  });

  it(
    'should save edited draft profile without auto publishing',
    async () => {
      cleanup();
      const user = userEvent.setup();
      const loadDraft = vi.fn().mockResolvedValue(draftSnapshot);
      const saveDraft = vi.fn().mockImplementation(async ({ resume }) => ({
        ...draftSnapshot,
        updatedAt: '2026-03-25T10:00:00.000Z',
        resume,
      }));

      render(
        <ResumeDraftEditorPanel
          accessToken="demo-token"
          apiBaseUrl="http://localhost:5577"
          canEdit
          loadDraft={loadDraft}
          saveDraft={saveDraft}
        />,
      );

      await screen.findByDisplayValue('付寅生');

      await user.clear(screen.getByLabelText('中文标题'));
      await user.type(screen.getByLabelText('中文标题'), '资深全栈工程师');
      await user.click(screen.getByRole('button', { name: '保存当前草稿' }));

      await waitFor(() => {
        expect(saveDraft).toHaveBeenCalledWith({
          accessToken: 'demo-token',
          apiBaseUrl: 'http://localhost:5577',
          resume: expect.objectContaining({
            profile: expect.objectContaining({
              headline: {
                zh: '资深全栈工程师',
                en: 'Full-Stack Engineer',
              },
            }),
          }),
        });
      });

      expect(
        await screen.findByText('草稿已保存。公开站内容不会自动变化，仍需手动发布。'),
      ).toBeInTheDocument();
    },
    10000,
  );

  it('should show read-only message when current role cannot edit draft', () => {
    render(
      <ResumeDraftEditorPanel
        accessToken="demo-token"
        apiBaseUrl="http://localhost:5577"
        canEdit={false}
        loadDraft={vi.fn()}
        saveDraft={vi.fn()}
      />,
    );

    expect(
      screen.getByText('当前账号没有草稿编辑权限，后台仅展示角色与导出入口。'),
    ).toBeInTheDocument();
  });
});
