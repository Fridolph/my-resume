# M44 Issue 2: RAG 索引重建 + user_docs 摄入异步化

## 背景

在 Issue 1 的 BullMQ 基建上，将实际耗时操作接入队列。

## 目标

- RAG 索引重建走异步队列（支持 WebSocket/SSE 进度推送）
- user_docs 自定义资料入库走异步队列

## 非目标

- 不改变现有同步端点行为
- 不做 PDF 解析异步化（留给 M45）

## 改动范围

```
apps/server/src/modules/ai/
  ├── queue/
  │   ├── rag-index.processor.ts    新增：索引重建 Worker
  │   └── user-docs.processor.ts    新增：文档摄入 Worker
  └── rag/
      ├── rag.controller.ts         修改：新增 POST .../async 端点
      └── user-docs-ingestion.service.ts 修改：支持 SSE 进度回调
```

## 验收标准

- [ ] `POST /api/ai/rag/index/rebuild/async` → 返回 jobId → 前端轮询进度
- [ ] `POST /api/ai/rag/custom/async` → 同上
- [ ] 任务完成后 RAG 索引/文档可用
- [ ] 任务失败时 job status = 'failed' + 错误信息
- [ ] 不影响 `POST .../rebuild` 和 `POST .../custom` 同步端点

## 测试计划

- 集成测试：提交异步任务 → 等待完成 → 验证数据正确
- 压测：同时提交 5 个摄入任务，验证队列串行处理

---
