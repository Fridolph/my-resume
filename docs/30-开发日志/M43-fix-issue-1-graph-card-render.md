# M43-fix Issue 1: buildCustomBlocksFromCitations 增加 graph sourceType 卡片渲染

## 背景

M42 已将 GraphSearchService 接入 retrieve 节点，图检索结果（sourceType='graph'）已合并到 citations 中。但 `buildCustomBlocksFromCitations` 只处理 `user_docs`/`knowledge`，graph 结果被跳过——用户看不到图检索的产出。

## 目标

让图检索结果在前端对话窗中以卡片形式可见。

## 非目标

- 不重构 MemoryGraphStore
- 不改图检索的评分逻辑
- 不做关系图谱可视化（可后续）

## 改动范围

```
apps/server/src/modules/ai/chat/ai-chat-graph.service.ts
  └─ buildCustomBlocksFromCitations：增加 sourceType === 'graph' 分支
  └─ 图结果 → text 类型 block（简洁文本展示）

apps/server/src/modules/ai/chat/ai-chat.types.ts
  └─ 现有 text block 类型已支持，无需改动
```

## 验收标准

- [ ] 问"我的技术栈涉及哪些？" → 图检索返回 relationship 信息 → 对话窗展示
- [ ] 图结果卡片不过度侵占 UI（限制展示条数 ≤3，简洁样式）
- [ ] typecheck 通过，测试不受影响

## 测试计划

- 单元测试：buildCustomBlocksFromCitations 新增分支覆盖
- 手工测试：启用 GRAPH_STORE_BACKEND=memory，问关系型问题，观察对话窗

---
