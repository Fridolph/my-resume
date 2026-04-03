import { mkdirSync, mkdtempSync, writeFileSync, rmSync } from 'fs';
import { join } from 'path';
import { tmpdir } from 'os';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { AiService } from '../ai.service';
import { createAiProvider } from '../providers/ai-provider.factory';
import { RagChunkService } from './rag-chunk.service';
import { RagIndexRepository } from './rag-index.repository';
import { RagKnowledgeService } from './rag-knowledge.service';
import { RagService } from './rag.service';

const source = `
profile:
  name: 付寅生
  title: 前端工程师 / 前端负责人
  location: 成都
  experienceYears: 8年
  targetRole: 前端 / 全职
  status: 已离职
  summary: 擅长 Vue3、TypeScript、前端工程化
skills:
  - 熟悉 Vue3、TypeScript、NestJS
education:
  - id: scu
    school: 四川大学锦江学院
    degree: 本科
    major: 通信工程
    period: 2012 - 2016
    location: 四川成都
experiences:
  - id: wskp
    company: 成都网思科平科技有限公司
    role: 前端组长
    period: 2017 - 2024
    summary: 负责 ToB 安全平台的前端架构与交付
    achievements:
      - 主导 EDR 与综合管理后台相关交付
    projects:
      - id: edr
        name: EDR - 终端威胁侦测与响应平台
        summary: 面向企业安全场景的终端威胁侦测平台
        contributions:
          - 通过 WebSocket 与大数据渲染优化终端详情页
projects:
  - id: resume
    name: my-resume 在线简历
    role: 作者 / 维护者
    period: 2024 - 至今
    summary: 在线简历项目
`;

const articleMarkdown = `---
title: 「JS全栈 AI Agent 学习」RAG篇①：先翻书，再答题——RAG 是什么？
date: 2026-03-23
---

RAG 是面向私有知识问答的常见方案。

## 一、RAG 是什么？

RAG = Retrieval-Augmented Generation，检索增强生成。

## 二、为什么需要 RAG？

它的价值在于先检索知识，再生成答案，降低幻觉。
`;

describe('RagService', () => {
  const originalEnv = {
    RAG_RESUME_SOURCE_PATH: process.env.RAG_RESUME_SOURCE_PATH,
    RAG_BLOG_DIRECTORY_PATH: process.env.RAG_BLOG_DIRECTORY_PATH,
    RAG_INDEX_PATH: process.env.RAG_INDEX_PATH,
  };

  let tempDirectory: string;

  beforeEach(() => {
    tempDirectory = mkdtempSync(join(tmpdir(), 'resume-rag-'));
    const sourcePath = join(tempDirectory, 'resume.zh.yaml');
    const blogDirectoryPath = join(tempDirectory, 'blog');
    const indexPath = join(tempDirectory, 'resume-index.json');

    writeFileSync(sourcePath, source);
    mkdirSync(blogDirectoryPath, { recursive: true });
    writeFileSync(join(blogDirectoryPath, 'rag-1.md'), articleMarkdown);
    process.env.RAG_RESUME_SOURCE_PATH = sourcePath;
    process.env.RAG_BLOG_DIRECTORY_PATH = blogDirectoryPath;
    process.env.RAG_INDEX_PATH = indexPath;
  });

  afterEach(() => {
    process.env.RAG_RESUME_SOURCE_PATH = originalEnv.RAG_RESUME_SOURCE_PATH;
    process.env.RAG_BLOG_DIRECTORY_PATH = originalEnv.RAG_BLOG_DIRECTORY_PATH;
    process.env.RAG_INDEX_PATH = originalEnv.RAG_INDEX_PATH;
    rmSync(tempDirectory, { recursive: true, force: true });
  });

  it('should rebuild local rag index and search the most relevant resume chunk', async () => {
    const aiService = new AiService(
      createAiProvider(
        {
          provider: 'mock',
          mode: 'mock',
          model: 'mock-resume-advisor',
        },
        vi.fn<typeof fetch>(),
      ),
    );
    const service = new RagService(
      aiService,
      new RagChunkService(),
      new RagKnowledgeService(),
      new RagIndexRepository(),
    );

    const status = await service.rebuildIndex();
    const matches = await service.search('他做过 EDR 安全平台吗', 3);

    expect(status.indexed).toBe(true);
    expect(status.chunkCount).toBeGreaterThan(0);
    expect(status.knowledgeChunkCount).toBeGreaterThan(0);
    expect(
      matches.some(
        (item) => item.title.includes('EDR') || item.content.includes('EDR'),
      ),
    ).toBe(true);
    expect(matches[0].score).toBeGreaterThan(0);
  });

  it('should answer questions from retrieved resume context', async () => {
    const aiService = new AiService(
      createAiProvider(
        {
          provider: 'mock',
          mode: 'mock',
          model: 'mock-resume-advisor',
        },
        vi.fn<typeof fetch>(),
      ),
    );
    const service = new RagService(
      aiService,
      new RagChunkService(),
      new RagKnowledgeService(),
      new RagIndexRepository(),
    );

    const result = await service.ask(
      '他在成都网思科平科技有限公司是否担任过前端组长？',
      3,
      'zh',
    );

    expect(result.answer).toContain('prompt=');
    expect(result.matches.length).toBeGreaterThan(0);
    expect(
      result.matches.some(
        (item) =>
          item.content.includes('前端组长') ||
          item.content.includes('成都网思科平科技有限公司'),
      ),
    ).toBe(true);
  });

  it('should index blog knowledge alongside the resume source', async () => {
    const aiService = new AiService(
      createAiProvider(
        {
          provider: 'mock',
          mode: 'mock',
          model: 'mock-resume-advisor',
        },
        vi.fn<typeof fetch>(),
      ),
    );
    const service = new RagService(
      aiService,
      new RagChunkService(),
      new RagKnowledgeService(),
      new RagIndexRepository(),
    );

    await service.rebuildIndex();
    const matches = await service.search('RAG 是什么', 2);

    expect(matches[0]?.section).toBe('knowledge');
    expect(matches[0]?.title).toContain('RAG篇①');
    expect(matches[0]?.content).toContain('检索增强生成');
  });
});
