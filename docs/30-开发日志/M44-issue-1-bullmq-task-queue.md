# M44 Issue 1: BullMQ 任务队列基建

## 背景

目前以下操作是同步阻塞的 HTTP 请求，用户体验差：
- RAG 索引重建（`POST /api/ai/rag/index/rebuild`）— 大文件耗时数秒
- user_docs 文档摄入（`POST /api/ai/rag/custom`）— 文本切片 + 向量化耗时
- PDF DOCX 解析（`file-extraction`）— 大文档更长

用户发起请求后页面卡住等待，没有进度反馈。

## 目标

引入 BullMQ + Redis 作为异步任务队列，将上述耗时操作改为"提交任务 → 轮询状态"模式。

## 非目标

- 不替换现有同步 API（保持兼容，新增异步端点）
- 不做分布式队列
- 不引入 RabbitMQ/Kafka

## 改动范围

```
apps/server/package.json        + bullmq, ioredis 依赖
apps/server/src/modules/ai/
  ├── queue/
  │   ├── queue.module.ts        新增：BullMQ 模块注册
  │   ├── rag-index.queue.ts     新增：RAG 索引重建任务
  │   └── user-docs.queue.ts     新增：文档摄入任务
  └── rag/
      └── rag.controller.ts      修改：新增异步端点 + 任务状态查询
docker-compose.yml               + redis 服务
.env.example                     + REDIS_URL
```

## 任务流

```
POST /api/ai/rag/index/rebuild/async
  → 创建 BullMQ job
  → 返回 { jobId, status: 'queued' }

GET /api/ai/rag/jobs/:jobId
  → 返回 { status: 'waiting'|'active'|'completed'|'failed', progress }
```

## 验收标准

- [ ] `docker compose up -d` 起 Redis + 应用
- [ ] 异步重建 RAG 索引，前端可轮询进度
- [ ] 同步端点不受影响（保留兼容）
- [ ] typecheck + 测试通过

## 测试计划

- 集成测试：提交 job → 验证 Redis 中有记录 → 等待完成 → 确认结果
- 手工测试：Admin 端触发异步重建，观察进度反馈

---
