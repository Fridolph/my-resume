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

  it(
    'should save experience and project core fields in the draft payload',
    async () => {
      cleanup();
      const user = userEvent.setup();
      const loadDraft = vi.fn().mockResolvedValue({
        ...draftSnapshot,
        resume: {
          ...draftSnapshot.resume,
          experiences: [
            {
              companyName: {
                zh: '成都一蟹科技有限公司',
                en: 'Chengdu Yixie Technology Co., Ltd.',
              },
              role: {
                zh: '前端主管',
                en: 'Frontend Lead',
              },
              employmentType: {
                zh: '全职',
                en: 'Full-time',
              },
              startDate: '2024-03',
              endDate: '2024-08',
              location: {
                zh: '成都',
                en: 'Chengdu',
              },
              summary: {
                zh: '负责团队协作与前端建设。',
                en: 'Led frontend collaboration and delivery.',
              },
              highlights: [
                {
                  zh: '推动 Code Review 机制落地',
                  en: 'Established the code review workflow',
                },
              ],
              technologies: ['Vue 3', 'TypeScript'],
            },
          ],
          projects: [
            {
              name: {
                zh: '云药客 SaaS 系统',
                en: 'Cloud Pharma SaaS',
              },
              role: {
                zh: '核心前端',
                en: 'Core Frontend Engineer',
              },
              startDate: '2024-03',
              endDate: '2024-08',
              summary: {
                zh: '推进 Vue3 + TS 重构。',
                en: 'Migrated the project to Vue 3 and TypeScript.',
              },
              highlights: [
                {
                  zh: '落地 monorepo 结构',
                  en: 'Introduced a monorepo structure',
                },
              ],
              technologies: ['Vue 3', 'pnpm'],
              links: [],
            },
          ],
        },
      });
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

      await screen.findByDisplayValue('成都一蟹科技有限公司');

      await user.clear(screen.getByLabelText('工作经历 1 中文公司'));
      await user.type(
        screen.getByLabelText('工作经历 1 中文公司'),
        '成都一蟹科技（升级版）',
      );
      await user.clear(screen.getByLabelText('工作经历 1 技术栈（逗号分隔）'));
      await user.type(
        screen.getByLabelText('工作经历 1 技术栈（逗号分隔）'),
        'React, Next.js, NestJS',
      );
      await user.clear(screen.getByLabelText('项目经历 1 中文名称'));
      await user.type(screen.getByLabelText('项目经历 1 中文名称'), '云药客 SaaS 平台');
      await user.clear(screen.getByLabelText('项目经历 1 中文亮点（每行一条）'));
      await user.type(
        screen.getByLabelText('项目经历 1 中文亮点（每行一条）'),
        `落地 monorepo 结构
建立共享组件基线`,
      );
      await user.click(screen.getByRole('button', { name: '保存当前草稿' }));

      await waitFor(() => {
        expect(saveDraft).toHaveBeenCalledTimes(1);
      });

      const submittedResume = saveDraft.mock.calls[0]?.[0]?.resume;

      expect(submittedResume.experiences[0]?.companyName.zh).toBe(
        '成都一蟹科技（升级版）',
      );
      expect(submittedResume.experiences[0]?.technologies).toEqual([
        'React',
        'Next.js',
        'NestJS',
      ]);
      expect(submittedResume.projects[0]?.name.zh).toBe('云药客 SaaS 平台');
      expect(submittedResume.projects[0]?.highlights).toEqual([
        {
          zh: '落地 monorepo 结构',
          en: '',
        },
        {
          zh: '建立共享组件基线',
          en: '',
        },
      ]);
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
