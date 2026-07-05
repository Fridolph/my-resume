# AI Chat 对话压缩 & 展示优化 — Issue 草案

> 关联模块：`apps/server/src/modules/ai/chat/` + 前端展示
> 状态：📋 待开发

---

## issue-01 对话窗口按 20 轮压缩 + 仅展示最近 2 轮

### 背景

当前 `createAssistantReply()` 每 20 轮生成一次总结（visitorFocus + aiClosing），但：
- 总结只关注**用户意图**，没有压缩对话内容
- 前端展示**全部历史消息**，对话越长越占内存、越难浏览
- 压缩后的 summary 没有"持久保留"的机制

### 目标

```
turn 1-19:  展示 最近 2 轮 Q&A（4 条消息，无 summary）
turn 20:    触发压缩 → 展示 1 条 summary + 最近 2 轮 Q&A（共 5 条）
turn 21-39: 展示 1 条 summary（保留） + 最近 2 轮 Q&A（共 5 条）
turn 40:    再次压缩 → 更新 summary + 最近 2 轮 Q&A（共 5 条）
...
```

### 非目标

- 不改变轮次计数逻辑（`turnCount` 正常递增）
- 不删除 DB 中的历史消息（全部保留，仅前端不展示）
- 不改变 `maxTurns` 配额判断（仍基于实际 turnCount）

---

### 子任务拆解

#### 1.1 后端：总结 prompt 重构

**现状**：
```
visitorFocus: "候选人关心xxx"
aiClosing: "已介绍xxx"
→ summary = visitorFocus + "\n\n" + aiClosing
```

**目标**：
```
压缩最近 20 轮的 Q&A 为一条结构化总结，包含：
- 用户关心的核心话题（保留 visitorFocus 语义）
- AI 已经提供的核心信息（保留 aiClosing 语义）
- 关键实体/技术栈/公司名（从 Q&A 中提取）
→ 作为一条 role: 'system' 消息持久保存
```

**改动点**：
- `buildAiChatSummaryPrompt()` — 调整 system prompt 模板
- `AI_CHAT_SUMMARY_SCHEMA` — 可能需要增加 `keyEntities` 字段
- `generateConversationSummary()` — 已支持，仅调整 prompt/schema

#### 1.2 后端：summary 消息打标

**现状**：summary 消息的 `answerBlocksJson` 含 `{ type: 'summary', ... }`

**目标**：增加标记字段，让前端识别"此消息不可被 trim 掉"：
```typescript
answerBlocksJson: [{
  type: 'summary',
  stage: 'turn-20',
  sticky: true,        // ← 新增：标记为持久保留
  title: '第 20 轮总结',
  summary: '...',
  keywords: [...],
}]
```

#### 1.3 后端：消息裁剪（trimmed messages）

**方案**：`buildSessionSnapshot()` 返回消息列表时由后端按规则裁剪，前端无感。

```typescript
// 裁剪规则：sticky summary（1条）+ 最近 2 轮 Q&A（4条：2 user + 2 assistant）= 共 5 条
const MAX_RECENT_ROUNDS = 2
const stickyMessages = allMessages.filter(m => isStickySummary(m))
const nonSticky = allMessages.filter(m => !isStickySummary(m))
const recentMessages = nonSticky.slice(-MAX_RECENT_ROUNDS * 2)
return [...stickyMessages, ...recentMessages]
```

**效果**：
- turn 20 前：5 条以内正常展示，无需裁剪
- turn 20 后：1 summary + 4 条最近 Q&A = 5 条消息
- 轮次计数和数据完整保留，仅前端可见范围受限

#### 1.4 前端：聊天窗口适配

- 渲染时区分"sticky summary 卡片"和"普通消息"
- sticky 卡片使用特殊视觉样式（如浅色背景、折叠按钮）
- 不再无限制渲染全部历史消息

---

### 改动范围

| 层 | 文件 | 改动 |
|----|------|------|
| server | `prompts/ai-chat-summary.prompt.ts` | prompt 模板调整 |
| server | `ai-chat.service.ts` `generateConversationSummary()` | summary 结构增加 sticky 标记 |
| server | `ai-chat.service.ts` `createAssistantReply()` | 每 20 轮触发压缩时更新逻辑 |
| server | `ai-chat.service.ts` `buildSessionSnapshot()` | 返回消息时按规则裁剪 |
| server | `ai-chat.types.ts` | 可能需要增加 `sticky` 字段 |
| web | 聊天组件 | 支持 sticky summary 卡片 + 最近 N 条展示 |

---

### 验收标准

- [ ] 第 20 轮：生成 summary + 展示窗口显示 summary 卡片 + 最近 2 轮 Q&A（共 5 条）
- [ ] 第 21-39 轮：summary 保留在顶部，下方只展示最近 2 轮 Q&A
- [ ] 第 40 轮：summary 更新，展示逻辑同上
- [ ] 刷新页面 / 重新进入会话：展示逻辑一致
- [ ] summary 卡片有视觉区分（样式、图标等）
- [ ] DB 中全部历史消息完整保留
- [ ] `maxTurns` 配额判断不受影响
