# M15：AI / RAG 能力深化里程碑与 Issue 规划（草案）

## 里程碑目标

在不引入重型基础设施的前提下，继续把 `my-resume` 当前 AI / RAG 能力做得更稳、更清晰、更适合教学与后续 Agent 化扩展。

本里程碑聚焦三件事：

- 让 RAG 知识源及时跟上最新简历内容
- 让 AI Provider 的 chat / embedding 能力边界更清楚
- 让 RAG API 与索引状态更容易观察、判断和接棒

## 当前边界

### 本里程碑做什么

- 同步最新简历内容到当前 RAG 语义块
- 拆分 chat model 与 embedding model 配置
- 补强 RAG 状态接口与索引运行时信息
- 为后续 stale 检测与调试视图预留字段

### 本里程碑不做什么

- 不引入向量数据库
- 不接本地 embedding 模型
- 不做复杂重排序链路
- 不做知识库后台管理系统
- 不做异步任务中心与 AI 历史系统

## 实际 issue 序号

根据当前 GitHub 实际创建结果，`M15` 对应 issue 为：

- `#161`
- `#162`
- `#163`
- `#164`

> 注：原本草案里预估从 `#160` 起排，但 GitHub 实际下一号直接跳到了 `#161`，因此后续统一以线上真实编号为准。

## Issue 拆解

### issue-161：最新简历内容同步到 RAG 知识源

- 背景：`public/web_fuyinsheng_10y.md` 已更新，但当前 RAG 主源仍需继续同步最新表述与高价值信号。
- 目标：把最新简历中的关键信息沉淀为结构化语义块，供当前 RAG 搜索与问答直接使用。
- 非目标：不改 Provider，不改 embedding 配置，不改前端页面。
- 验收：
  - 新增亮点可被 `search` 命中
  - `ask` 能基于最新内容回答
  - chunk 结构保持稳定且可解释

### issue-162：AI Provider 拆分 chat / embedding 模型配置

- 背景：当前 `generateText` 与 `embedTexts` 共享同一个 `model` 概念，后续 provider 迁移会有隐性耦合。
- 目标：为运行时配置补齐 `chatModel / embeddingModel`，并保持旧配置兼容。
- 非目标：不接新 provider，不改 RAG 算法，不引入向量数据库。
- 验收：
  - 文本生成使用 chat model
  - 向量化使用 embedding model
  - 旧环境变量不改也能继续运行

### issue-163：RAG API 状态与索引运行时信息补强

- 背景：当前 RAG 能工作，但状态信息还不够适合调试、教学和接棒。
- 目标：让 `status / rebuild` 能返回更清晰的 provider 与索引摘要。
- 非目标：不做新的后台页面，不扩展成知识库管理系统。
- 验收：
  - 可直接看到当前 provider / model 摘要
  - 可看到索引生成时间、resume / knowledge chunk 数量
  - 为后续 stale 判断预留空间

### issue-164：RAG 索引过期判断与源变更感知

- 背景：当前源文件变更后，系统还不能直接判断索引是否已经过期。
- 目标：增加源内容 hash 或等价机制，让 `status` 能感知索引是否需要重建。
- 非目标：不做自动重建，不做任务调度，不做 UI 管理页。
- 验收：
  - 源变更后可判断索引 stale
  - `status` 能明确返回当前状态

## 推荐实施顺序

1. `issue-161` 最新内容同步
2. `issue-162` chat / embedding 拆分
3. `issue-163` API 状态补强
4. `issue-164` stale 判断

## 一句话总结

`M15` 不追求把 AI / RAG 做重，而是继续把这条线收成：

- 内容最新
- 配置清楚
- 状态可见
- 过程可接
