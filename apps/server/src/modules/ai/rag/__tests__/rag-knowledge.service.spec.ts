import { describe, expect, it } from 'vitest';

import { RagKnowledgeService } from '../rag-knowledge.service';

const markdown = `---
title: 「JS全栈 AI Agent 学习」RAG篇①：先翻书，再答题——RAG 是什么？
date: 2026-03-23
---

> 系列导语

RAG 就是先去知识库里翻相关内容，再把找到的内容交给 AI 回答。

## 一、RAG 是什么？

RAG = Retrieval-Augmented Generation，检索增强生成。

## 二、为什么需要 RAG？

RAG 可以降低幻觉，并让答案带上来源。
`;

describe('RagKnowledgeService', () => {
  it('should build stable knowledge chunks from markdown articles', () => {
    const service = new RagKnowledgeService();
    const chunks = service.buildArticleChunksFromMarkdown(
      markdown,
      '/tmp/blog/rag-1.md',
    );

    expect(chunks.map((item) => item.id)).toEqual([
      'knowledge-rag-1-1',
      'knowledge-rag-1-2',
      'knowledge-rag-1-3',
    ]);
    expect(chunks[0]).toMatchObject({
      section: 'knowledge',
      sourceType: 'knowledge',
      sourcePath: '/tmp/blog/rag-1.md',
    });
    expect(chunks[1]?.title).toContain('RAG 是什么');
    expect(chunks[2]?.content).toContain('降低幻觉');
  });
});
