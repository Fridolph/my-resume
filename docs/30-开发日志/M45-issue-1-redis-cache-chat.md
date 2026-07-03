# M45 Issue 1: Redis 缓存基建 + AI Chat 问答缓存

## 背景

当前项目完全依赖 SQLite，无缓存层。公开站 AI Chat 限制 20 轮/天，轮次计数存在 SQLite。相同问题重复调用 LLM 浪费 Token。

## 目标

- 引入 Redis 缓存层
- AI Chat 问答缓存：相同问题 1 小时内复用（不重复调用 LLM）
- 公开站访问频率限制从 SQLite → Redis

## 非目标

- 不做全站缓存（页面/API）
- 不替换 SQLite 会话存储
- 不做分布式 Redis（单实例即可）

## 改动范围

```
apps/server/package.json        + ioredis 依赖（如 M44 已加则跳过）
apps/server/src/common/
  └── cache/
      ├── cache.module.ts        新增：Redis 模块（连接 + 全局注册）
      └── cache.service.ts       新增：get/set/delete + TTL 支持
apps/server/src/modules/ai/chat/
  ├── ai-chat.service.ts         修改：createAssistantReply 前查缓存
  └── ai-chat-graph.service.ts   修改：答案缓存写入
.env.example                     + REDIS_URL
```

## 缓存策略

```ts
// key = sha256(question + locale)
// TTL = 3600s（1 小时）
// 只缓存 RAG 生成的回答，不缓存 greeting/guide 等预置话术

const cacheKey = `chat:answer:${sha256(question + locale)}`
const cached = await redis.get(cacheKey)
if (cached) return JSON.parse(cached)

const answer = await generateAnswer(...)
await redis.set(cacheKey, JSON.stringify(answer), 'EX', 3600)
```

## 验收标准

- [ ] 相同问题第二次提问 → 不调用 LLM → 直接返回缓存
- [ ] 1 小时后缓存过期 → 重新生成
- [ ] 公开站 20 轮限制正常（从 Redis 计数）
- [ ] Redis 不可用时不影响功能（降级到无缓存）

## 测试计划

- 单元测试：mock Redis → 验证缓存命中/未命中
- 手工测试：两次问相同问题，观察 LLM 调用次数（日志中 provider 调用数不变）

---
