# M48 Issue 1: user_docs 上传自动标注（contentTypes + tags）

## 背景

Admin 上传 user_docs 时必须手动选择 contentTypes（hobby/tech_blog/work_detail/general 等），且需要手动填写标题和简介。如果忘记选或选错，会影响 RAG 检索精度。

## 目标

上传 user_docs 后，LLM 自动推断 contentType/tags/summary，作为手动输入的补充/替代。

## 非目标

- 不使用 rerank 模型（那是检索后排序用的）
- 不改变已有文档的自动回填（只对新上传文档生效）
- 不替换手动选择（自动推断作为默认值，用户可修改）

## 改动范围

```
apps/server/src/modules/ai/rag/
  └── user-docs-ingestion.service.ts   修改：提取后调用 LLM 标注
  └── prompts/
      └── auto-label.prompt.ts         新增：自动标注 Prompt
apps/admin/.../user-doc-ingestion-panel.tsx 修改：上传后展示 AI 推断结果
```

## LLM 标注 Schema

```ts
// 输入：文档标题 + 前 500 字
// 输出：
{
  contentType: 'tech_blog' | 'hobby' | 'work_detail' | 'general',
  tags: string[],          // ≤5 个关键词
  suggestedTitle: string,  // AI 建议标题
  summary: string,         // 1-2 句简介
}
```

## 验收标准

- [ ] 上传一篇技术文章 → contentType 自动选 tech_blog → tags 有相关技术关键词
- [ ] 上传一篇兴趣爱好 → contentType 自动选 hobby
- [ ] Admin 可覆盖 AI 推断结果
- [ ] typecheck + 测试通过

## 测试计划

- 准备 3 种类型文章样本 → 验证自动标注准确率 ≥ 80%
- 手工测试：上传文档 → 观察预填字段

---
