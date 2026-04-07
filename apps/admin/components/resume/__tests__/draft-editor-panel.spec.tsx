'use client';

import { cleanup, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import type { ResumeDraftSnapshot } from '../../../lib/resume-types';
import { reorderResumeCollection } from '../draft-editor-helpers';
import { ResumeDraftEditorPanel } from '../draft-editor-panel';

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
      hero: {
        frontImageUrl: '/img/avatar.jpg',
        backImageUrl: '/img/avatar2.jpg',
        linkUrl: 'https://github.com/Fridolph/my-resume',
        slogans: [
          {
            zh: '热爱Coding，生命不息，折腾不止',
            en: 'Driven by coding, always building, always iterating',
          },
          {
            zh: '羽毛球爱好者，快乐挥拍，球场飞翔',
            en: 'Badminton lover, happy swings, full-court energy',
          },
        ],
      },
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
    expect(screen.queryByDisplayValue('Full-Stack Engineer')).not.toBeInTheDocument();
    expect(loadDraft).toHaveBeenCalled();
  });

  it('should support collapsing and expanding editor modules', async () => {
    cleanup();
    const user = userEvent.setup();
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

    expect(await screen.findByDisplayValue('付寅生')).toBeInTheDocument();

    const profileSectionTrigger = screen.getByRole('button', {
      name: '基础信息 模块开关',
    });

    expect(profileSectionTrigger).toHaveAttribute('aria-expanded', 'true');

    await user.click(profileSectionTrigger);

    await waitFor(() => {
      expect(profileSectionTrigger).toHaveAttribute('aria-expanded', 'false');
    });

    await user.click(profileSectionTrigger);

    await waitFor(() => {
      expect(profileSectionTrigger).toHaveAttribute('aria-expanded', 'true');
    });

    expect(screen.getByLabelText('姓名')).toBeInTheDocument();
  });

  it('should switch between chinese main editing and english translation workspace', async () => {
    cleanup();
    const user = userEvent.setup();
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

    expect(await screen.findByLabelText('姓名')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: '英文翻译工作区' }));

    expect(
      await screen.findByLabelText(/姓名/, { selector: 'input' }),
    ).toBeInTheDocument();
    expect(screen.getByText('主文案参考：付寅生')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: '中文主编辑' }));

    expect(await screen.findByLabelText('姓名')).toBeInTheDocument();
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

      await user.clear(screen.getByLabelText('标题'));
      await user.type(screen.getByLabelText('标题'), '资深全栈工程师');
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
    'should support english translation actions and save english payload from translation workspace',
    async () => {
      cleanup();
      const user = userEvent.setup();
      const loadDraft = vi.fn().mockResolvedValue(draftSnapshot);
      const saveDraft = vi.fn().mockImplementation(async ({ resume }) => ({
        ...draftSnapshot,
        updatedAt: '2026-03-25T10:10:00.000Z',
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

      await screen.findByLabelText('姓名');

      await user.click(screen.getByRole('button', { name: '英文翻译工作区' }));
      await user.click(
        screen.getByRole('button', { name: '基础信息 复制中文到英文' }),
      );

      expect(
        await screen.findByLabelText(/姓名/, { selector: 'input' }),
      ).toHaveValue('付寅生');

      await user.click(
        screen.getByRole('button', { name: '基础信息 清空英文' }),
      );
      expect(screen.getByLabelText(/姓名/, { selector: 'input' })).toHaveValue('');

      await user.type(
        screen.getByLabelText(/标题/, { selector: 'input' }),
        'Senior Full-Stack Engineer',
      );
      await user.type(
        screen.getByLabelText(/姓名/, { selector: 'input' }),
        'Yinsheng Fu',
      );
      await user.click(screen.getByRole('button', { name: '保存当前草稿' }));

      await waitFor(() => {
        expect(saveDraft).toHaveBeenCalledTimes(1);
      });

      const submittedResume = saveDraft.mock.calls[0]?.[0]?.resume;

      expect(submittedResume.profile.fullName).toEqual({
        zh: '付寅生',
        en: 'Yinsheng Fu',
      });
      expect(submittedResume.profile.headline).toEqual({
        zh: '全栈开发工程师',
        en: 'Senior Full-Stack Engineer',
      });
    },
    10000,
  );

  it(
    'should render drag handles and reorder education entries with helper logic',
    async () => {
      cleanup();
      const sortableDraftSnapshot = {
        ...draftSnapshot,
        resume: {
          ...draftSnapshot.resume,
          education: [
            {
              schoolName: { zh: '第一大学', en: 'First University' },
              degree: { zh: '本科', en: 'Bachelor' },
              fieldOfStudy: { zh: '计算机科学', en: 'Computer Science' },
              startDate: '2015-09',
              endDate: '2019-06',
              location: { zh: '上海', en: 'Shanghai' },
              highlights: [],
            },
            {
              schoolName: { zh: '第二大学', en: 'Second University' },
              degree: { zh: '硕士', en: 'Master' },
              fieldOfStudy: { zh: '软件工程', en: 'Software Engineering' },
              startDate: '2019-09',
              endDate: '2022-06',
              location: { zh: '杭州', en: 'Hangzhou' },
              highlights: [],
            },
          ],
        },
      };
      const loadDraft = vi.fn().mockResolvedValue(sortableDraftSnapshot);

      render(
        <ResumeDraftEditorPanel
          accessToken="demo-token"
          apiBaseUrl="http://localhost:5577"
          canEdit
          loadDraft={loadDraft}
          saveDraft={vi.fn()}
        />,
      );

      await screen.findByDisplayValue('付寅生');

      expect(
        screen.getByRole('button', { name: '拖拽排序教育经历 1' }),
      ).toBeInTheDocument();
      expect(
        screen.getByRole('button', { name: '拖拽排序教育经历 2' }),
      ).toBeInTheDocument();

      const reorderedResume = reorderResumeCollection(
        sortableDraftSnapshot.resume,
        'education',
        0,
        1,
      );

      expect(reorderedResume.education[0]?.schoolName.zh).toBe('第二大学');
      expect(reorderedResume.education[1]?.schoolName.zh).toBe('第一大学');
    },
    10000,
  );

  it('should save hero image urls, link url, and bilingual slogans in profile payload', async () => {
    cleanup();
    const user = userEvent.setup();
    const loadDraft = vi.fn().mockResolvedValue(draftSnapshot);
    const saveDraft = vi.fn().mockImplementation(async ({ resume }) => ({
      ...draftSnapshot,
      updatedAt: '2026-03-25T10:15:00.000Z',
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

    await screen.findByLabelText('姓名');

    await user.clear(screen.getByLabelText('头像正面图片地址'));
    await user.type(
      screen.getByLabelText('头像正面图片地址'),
      'https://cdn.example.com/avatar-front.png',
    );
    await user.clear(screen.getByLabelText('头像背面图片地址'));
    await user.type(
      screen.getByLabelText('头像背面图片地址'),
      'https://cdn.example.com/avatar-back.png',
    );
    await user.clear(screen.getByLabelText('头像点击跳转地址'));
    await user.type(
      screen.getByLabelText('头像点击跳转地址'),
      'https://github.com/Fridolph',
    );
    await user.clear(screen.getByLabelText('主视觉 slogan（每行一条，最多两行）'));
    await user.type(
      screen.getByLabelText('主视觉 slogan（每行一条，最多两行）'),
      `保持输出，持续进化
写代码，也写体系`,
    );

    await user.click(screen.getByRole('button', { name: '英文翻译工作区' }));
    await user.clear(
      screen.getByLabelText(/主视觉 slogan/, {
        selector: 'textarea',
      }),
    );
    await user.type(
      screen.getByLabelText(/主视觉 slogan/, {
        selector: 'textarea',
      }),
      `Keep shipping and evolving
Build systems, not just pages`,
    );
    await user.click(screen.getByRole('button', { name: '保存当前草稿' }));

    await waitFor(() => {
      expect(saveDraft).toHaveBeenCalledTimes(1);
    });

    const submittedResume = saveDraft.mock.calls[0]?.[0]?.resume;

    expect(submittedResume.profile.hero).toEqual({
      frontImageUrl: 'https://cdn.example.com/avatar-front.png',
      backImageUrl: 'https://cdn.example.com/avatar-back.png',
      linkUrl: 'https://github.com/Fridolph',
      slogans: [
        {
          zh: '保持输出，持续进化',
          en: 'Keep shipping and evolving',
        },
        {
          zh: '写代码，也写体系',
          en: 'Build systems, not just pages',
        },
      ],
    });
  });

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
              coreFunctions: {
                zh: '覆盖结算管理与任务执行流程。',
                en: 'Covers settlement management and task execution flows.',
              },
              highlights: [
                {
                  zh: '落地 monorepo 结构',
                  en: 'Introduced a monorepo structure',
                },
              ],
              technologies: ['Vue 3', 'pnpm'],
              links: [
                {
                  label: {
                    zh: '项目仓库',
                    en: 'Repository',
                  },
                  url: 'https://github.com/Fridolph/cloud-pharma',
                },
              ],
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

      await user.clear(screen.getByLabelText('工作经历 1 公司'));
      await user.type(
        screen.getByLabelText('工作经历 1 公司'),
        '成都一蟹科技（升级版）',
      );
      await user.clear(screen.getByLabelText('工作经历 1 技术栈（逗号分隔）'));
      await user.type(
        screen.getByLabelText('工作经历 1 技术栈（逗号分隔）'),
        'React, Next.js, NestJS',
      );
      await user.clear(screen.getByLabelText('项目经历 1 名称'));
      await user.type(screen.getByLabelText('项目经历 1 名称'), '云药客 SaaS 平台');
      await user.clear(screen.getByLabelText('项目经历 1 项目核心功能'));
      await user.type(
        screen.getByLabelText('项目经历 1 项目核心功能'),
        '覆盖结算、活动配置与多组织协作流程。',
      );
      await user.clear(screen.getByLabelText('项目经历 1 亮点、难点与解决方案（每行一条）'));
      await user.type(
        screen.getByLabelText('项目经历 1 亮点、难点与解决方案（每行一条）'),
        `落地 monorepo 结构
建立共享组件基线`,
      );
      await user.clear(screen.getByLabelText('项目经历 1 链接 1 标签'));
      await user.type(screen.getByLabelText('项目经历 1 链接 1 标签'), '在线演示');
      await user.clear(screen.getByLabelText('项目经历 1 链接 1 地址'));
      await user.type(
        screen.getByLabelText('项目经历 1 链接 1 地址'),
        'https://demo.example.com/cloud-pharma',
      );
      await user.click(
        screen.getByRole('button', { name: '为项目经历 1 添加项目链接' }),
      );
      await user.type(screen.getByLabelText('项目经历 1 链接 2 标签'), '案例文章');
      await user.type(
        screen.getByLabelText('项目经历 1 链接 2 地址'),
        'https://blog.example.com/cloud-pharma',
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
          en: 'Introduced a monorepo structure',
        },
        {
          zh: '建立共享组件基线',
          en: '',
        },
      ]);
      expect(submittedResume.projects[0]?.coreFunctions.zh).toBe(
        '覆盖结算、活动配置与多组织协作流程。',
      );
      expect(submittedResume.projects[0]?.links).toEqual([
        {
          label: {
            zh: '在线演示',
            en: 'Repository',
          },
          url: 'https://demo.example.com/cloud-pharma',
        },
        {
          label: {
            zh: '案例文章',
            en: '',
          },
          url: 'https://blog.example.com/cloud-pharma',
        },
      ]);
    },
    10000,
  );

  it(
    'should add and save education skills highlights profile links and interests',
    async () => {
      cleanup();
      const user = userEvent.setup();
      const loadDraft = vi.fn().mockResolvedValue(draftSnapshot);
      const saveDraft = vi.fn().mockImplementation(async ({ resume }) => ({
        ...draftSnapshot,
        updatedAt: '2026-03-25T10:30:00.000Z',
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

      await user.click(screen.getByRole('button', { name: '添加教育经历' }));
      await user.type(screen.getByLabelText('教育经历 1 学校'), '四川大学锦江学院');
      await user.type(
        screen.getByLabelText('教育经历 1 亮点（每行一条）'),
        '通信工程本科',
      );
      expect(
        screen.getByRole('button', { name: '删除教育经历 1' }),
      ).toBeInTheDocument();

      await user.click(screen.getByRole('button', { name: '添加技能组' }));
      await user.type(screen.getByLabelText('技能组 1 名称'), '前端工程化');
      await user.type(
        screen.getByLabelText('技能组 1 关键词（每行一条）'),
        `TypeScript
React
Next.js`,
      );
      expect(
        screen.getByRole('button', { name: '删除技能组 1' }),
      ).toBeInTheDocument();

      await user.click(screen.getByRole('button', { name: '添加亮点' }));
      await user.type(screen.getByLabelText('亮点 1 标题'), '技术写作');
      await user.type(screen.getByLabelText('亮点 1 描述'), '持续输出教程与博客');
      expect(screen.getByRole('button', { name: '删除亮点 1' })).toBeInTheDocument();

      await user.click(screen.getByRole('button', { name: '添加个人链接' }));
      await user.type(screen.getByLabelText('个人链接 1 标签'), 'GitHub');
      await user.type(
        screen.getByLabelText('个人链接 1 地址'),
        'https://github.com/Fridolph',
      );
      await user.type(
        screen.getByLabelText('个人链接 1 Iconify 图标'),
        'ri:github-fill',
      );
      await user.click(screen.getByRole('button', { name: '添加兴趣方向' }));
      await user.type(screen.getByLabelText('兴趣方向 1 名称'), '羽毛球');
      await user.type(
        screen.getByLabelText('兴趣方向 1 Iconify 图标'),
        'ri:dribbble-line',
      );
      await user.click(screen.getByRole('button', { name: '英文翻译工作区' }));
      await user.type(
        screen.getByLabelText(/兴趣方向 1 名称/, { selector: 'input' }),
        'Badminton',
      );

      await user.click(screen.getByRole('button', { name: '保存当前草稿' }));

      await waitFor(() => {
        expect(saveDraft).toHaveBeenCalledTimes(1);
      });

      const submittedResume = saveDraft.mock.calls[0]?.[0]?.resume;

      expect(submittedResume.education[0]?.schoolName.zh).toBe('四川大学锦江学院');
      expect(submittedResume.education[0]?.highlights).toEqual([
        {
          zh: '通信工程本科',
          en: '',
        },
      ]);
      expect(submittedResume.skills[0]?.name.zh).toBe('前端工程化');
      expect(submittedResume.skills[0]?.keywords).toEqual([
        'TypeScript',
        'React',
        'Next.js',
      ]);
      expect(submittedResume.highlights[0]?.title.zh).toBe('技术写作');
      expect(submittedResume.highlights[0]?.description.zh).toBe(
        '持续输出教程与博客',
      );
      expect(submittedResume.profile.links[0]?.label.zh).toBe('GitHub');
      expect(submittedResume.profile.links[0]?.url).toBe(
        'https://github.com/Fridolph',
      );
      expect(submittedResume.profile.links[0]?.icon).toBe('ri:github-fill');
      expect(submittedResume.profile.interests).toEqual([
        {
          label: {
            zh: '羽毛球',
            en: 'Badminton',
          },
          icon: 'ri:dribbble-line',
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
