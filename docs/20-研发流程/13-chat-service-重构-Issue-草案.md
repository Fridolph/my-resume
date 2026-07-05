# ai-chat.service 重构 — Issue 草案

> 关联模块：`apps/server/src/modules/ai/chat/`
> 状态：✅ 已完成（共 4 个子任务）

---

## issue-01 抽离 AiChatQuotaService（准入 & 配额）

- **背景**：`ai-chat.service.ts` 超过千行，准入校验和日配额刷新逻辑分散在 inline 代码和 private 方法中
- **目标**：将配额相关职责抽为独立 service
- **改动**：
  - 新建 `ai-chat-quota.service.ts`：`getBundleOrThrow` / `refreshDailyQuota` / `assertUseKeyMatch` / `assertUseKeyActive` / `assertSessionOpen` / `validateAndRefresh`
  - 导出 `AiChatSessionBundle` 类型
  - `ai-chat.service.ts` 中 6 个调用点全部迁移
  - 移除重复的 `buildLocalDateKey`（统一从 utils 导入）
- **验收**：nest build + typecheck 通过

---

## issue-02 全量 TSDoc + 步注释

- **背景**：`ai-chat.service.ts` 中方法缺乏文档注释
- **目标**：所有公开/私有方法添加 TSDoc，核心方法添加步注释
- **改动**：
  - 15 个公开方法 TSDoc（含 `createAssistantReply` 12 步职责全景）
  - 8 个私有方法 TSDoc
  - `createAssistantReply` 核心逻辑 13 步步注释
  - `generateConversationSummary` 5 步步注释
  - `generateAnswer` 流程在 TSDoc 中列举（8 步）
- **验收**：注释完整，代码可读性提升

---

## issue-03 抽离 ai-chat.utils.ts（纯函数）

- **背景**：service 中混有大量纯工具函数，不宜放在 service 中
- **目标**：~11 个通用工具和卡片分类函数抽到独立 utils 文件
- **改动**：
  - 新建 `ai-chat.utils.ts`：
    - 通用工具：`readLocalizedText` / `normalizeOptionalText` / `formatPeriod` / `buildLocalDateKey` / `buildUseKeyValue` / `chooseStructuredMethod` / `chunkAnswerText`
    - 卡片分类：`normalizeUserDocCardCategory` / `normalizeArticleCardCategory` / `resolveCustomCardSummary` / `buildCustomCardMedia`
  - 新增类型枚举到 `ai-chat.types.ts`：`ContentCategory` / `ArticleCardCategory`
  - `ai-chat-quota.service.ts` 从 utils 导入 `buildLocalDateKey`（消除重复定义）
  - service 中保留的函数（`classifyQuestion` / answer builders / `mapLead` / `mapUseKey`）全部补 TSDoc
- **验收**：nest build 通过，函数职责清晰

---

## issue-04 DB 映射函数迁移到 repository

- **背景**：`mapLead` / `mapUseKey` 是 DB row → DTO 的纯映射，天然属于 repository 层
- **目标**：移到 `ai-chat.repository.ts`
- **改动**：
  - `mapLead` / `mapUseKey` 从 service → repository（class 外部 `export function`）
  - service 改为 `import { mapLead, mapUseKey } from './ai-chat.repository'`
- **验收**：构建通过，service 瘦身 ~60 行

---

## issue-05 classifyQuestion 消极文字阈值调整

- **背景**：`classifyQuestion` 中消极文字匹配上限为 15 字符，容易误触发
- **目标**：缩小到 9 字符
- **改动**：`trimmed.length <= 15` → `<= 9`（仅消极模式，招呼类保持 15）
