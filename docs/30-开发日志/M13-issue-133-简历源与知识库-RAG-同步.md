# M13 / issue-133 开发日志：简历源与知识库 RAG 同步

- Issue：`#133`
- 里程碑：`M13 RAG 最小知识库链路`
- 分支：`fys-dev/feat-m12-issue-133-and-m13-issue-134-followup`
- 日期：`2026-04-03`

## 背景

仓库里原有的 RAG 简历源仍然是旧版 8 年履历，而你这次补充了两类新的可公开知识源：

- `public/web_fuyinsheng_10y.md`
- `blog/` 目录下的三篇 RAG 文章

如果继续保持现状，会出现两个明显问题：

- 公开简历默认内容与 RAG 简历源不一致
- RAG 只能回答“履历信息”，不能回答已经公开发布的 RAG 文章内容

所以这轮的目标不是继续扩 AI 能力边界，而是先把“知识源基线”校准好。

## 本次目标

- 将默认标准简历示例更新到最新 10 年版内容
- 更新 `apps/server/data/rag/resume.zh.yaml`
- 让 `blog/` 目录真实进入 RAG 索引，而不是只保留文章标题
- 保持当前实现仍然是轻量、教程友好的本地 JSON 索引方案

## 非目标

- 不引入向量数据库
- 不做知识库后台管理界面
- 不做博客全文 CMS 化
- 不做多语言 RAG
- 不在这一轮扩展前端展示 UI

## TDD / 测试设计

### 1. 先锁文章知识源切块

新增：

- `apps/server/src/modules/ai/rag/rag-knowledge.service.spec.ts`

验证：

- Markdown frontmatter 可被读取
- 文章会按 `##` 语义段落切块
- 生成的 chunk 带有稳定的 `knowledge-*` id 与来源路径

### 2. 再锁聚合索引行为

更新：

- `apps/server/src/modules/ai/rag/rag.service.spec.ts`
- `apps/server/test/ai-rag.e2e-spec.ts`

验证：

- 重建索引时会同时读入简历 YAML 与 `blog/` 目录
- `status` 能看到 `knowledgeChunkCount`
- 查询 `RAG 是什么` 时能命中文章知识块

### 3. 最后锁最新简历示例基线

更新：

- `apps/server/src/modules/resume/domain/standard-resume.spec.ts`
- `apps/server/src/modules/resume/resume-markdown-export.service.spec.ts`
- `apps/server/test/ai-report-role-access.e2e-spec.ts`

验证：

- 默认示例简历更新到 10 年版本
- Markdown 导出与依赖该示例的 E2E 断言一起切到新基线

## 实际改动

### 1. 新增文章知识源切块服务

新增：

- `apps/server/src/modules/ai/rag/rag-knowledge.service.ts`
- `apps/server/src/modules/ai/rag/rag-knowledge.service.spec.ts`

做法：

- 读取 `blog/*.md`
- 解析 frontmatter 中的 `title / date`
- 按 `##` 标题切成语义块
- 为每个知识块附带 `sourceType=knowledge` 与 `sourcePath`

这里刻意没有把整篇文章一次性塞进向量索引，而是先按语义段切块。这样对教学更友好，也更符合后续继续演进的方向。

### 2. RAG 聚合索引从“单份简历”升级为“简历 + 文章知识库”

更新：

- `apps/server/src/modules/ai/rag/rag.types.ts`
- `apps/server/src/modules/ai/rag/rag-paths.ts`
- `apps/server/src/modules/ai/rag/rag-chunk.service.ts`
- `apps/server/src/modules/ai/rag/rag.service.ts`
- `apps/server/src/modules/ai/ai.module.ts`

当前行为：

- 简历 YAML 仍然是主知识源
- `blog/` 目录作为公开文章知识源一并进入索引
- `status` 能看到 `resumeChunkCount / knowledgeChunkCount`
- `ask` 上下文里会附带 `source=resume|knowledge`

### 3. 同步默认标准简历内容到最新版本

更新：

- `apps/server/src/modules/resume/domain/standard-resume.ts`
- `apps/server/data/rag/resume.zh.yaml`

主要同步内容：

- 头衔改为 `JS 全栈 / AI Agent 开发工程师`
- 工作年限更新为 `10 年`
- 新增澳昇能源经历与 `GreenSketch` 项目
- 调整技能、亮点和项目顺序，使其与当前简历基线一致

### 4. 同步依赖旧基线的测试断言

更新：

- `apps/server/src/modules/resume/resume-markdown-export.service.spec.ts`
- `apps/server/test/ai-report-role-access.e2e-spec.ts`

原因不是放宽测试，而是原断言仍然绑着旧版首个项目和旧版头衔，已经不再代表当前内容事实。

## Review 记录

### 是否符合当前目标

符合。

本轮只完成：

- 简历源更新
- 知识库源接入
- RAG 最小聚合索引
- 相关测试与导出基线同步

没有越界去做：

- UI 改版
- 新的 AI 工作台交互
- 向量数据库升级
- 多语言知识库

### 是否存在可继续抽离的能力

有，但本轮先不做：

- 后续可把 Markdown 文章切块规则抽成更通用的 knowledge-source 层
- 后续可为知识源增加 tags、topic、series 等 metadata
- 后续可在 admin 里加最小的索引状态与重建入口

当前先停在“代码可解释、链路可验证”的最小粒度更合适。

## 自测结果

已执行：

- `pnpm --filter @my-resume/server test -- src/modules/ai/rag/rag-knowledge.service.spec.ts src/modules/ai/rag/rag-chunk.service.spec.ts src/modules/ai/rag/rag.service.spec.ts src/modules/resume/domain/standard-resume.spec.ts src/modules/resume/resume-markdown-export.service.spec.ts`
- `pnpm --filter @my-resume/server test:e2e -- test/ai-rag.e2e-spec.ts test/ai-report-role-access.e2e-spec.ts`
- `pnpm --filter @my-resume/server typecheck`
- `pnpm --filter @my-resume/server build`

结果：

- 单测通过
- RAG e2e 通过
- 相关 AI 角色边界 e2e 通过
- 类型检查通过
- 服务端构建通过

## 遇到的问题

### 1. 旧测试仍绑着旧版简历内容

表现：

- Markdown 导出断言仍然检查旧头衔和旧项目
- AI 相关 e2e 仍然假设 `projects[0]` 是旧版 SaaS 项目

处理：

- 将断言同步为当前最新版内容基线
- 保持断言继续检查“真实事实”，而不是删掉验证

### 2. 知识库不能只存文章标题

如果只是把三篇博客标题写进 YAML，RAG 实际上还是答不了文章内容。

处理：

- 直接读取 `blog/*.md`
- 把 frontmatter 与章节内容切成可检索的知识块

## 可继续沉淀为教程的点

- 为什么 RAG v1 先用“远端 embedding + 本地 JSON 索引”
- 为什么文章知识库更适合按语义段切块，而不是整篇入库
- 为什么知识源更新时，要优先先收“内容基线一致性”
- 如何让公开文章与个人简历一起构成最小个人知识库

## 后续待办

- 可继续在 admin 中补最小 RAG 状态面板与重建入口
- 可继续为知识块增加更细的 metadata 与筛选能力
- 可继续把英文简历或英文文章加入知识库
- 当前阶段先停在“内容基线更新 + 知识源接入”即可
