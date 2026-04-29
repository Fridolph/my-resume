# M22 / Issue 211 - AI 简历导入识别与草稿回填

## 背景

开源用户首次使用 `my-resume` 时，往往已经有一份自己的 Markdown/TXT 简历。如果只能手动从空表单开始录入，完整体验链路会断在“如何把已有简历迁入系统”这一步。

本次 Issue 的目标是补上第一版可跑通闭环：上传中文简历文件，经 AI 识别为 `StandardResume` 候选草稿，展示模块级 diff，再由用户选择模块写回当前 draft。

## 本次目标

- 支持中文 `md/txt` 简历上传识别。
- 第一版限制文件大小和文本长度，避免无限制输入进入 AI。
- AI 输出必须归一化并通过 `validateStandardResume` 后才允许进入 apply。
- Admin AI 工作台新增“简历导入识别”入口。
- 新增结果看台，按模块展示当前草稿与候选草稿差异。
- 用户确认后按模块一次性写回 draft；发布态仍保持手动发布流程。

## 非目标

- 不支持 PDF/DOCX 第一版识别。
- 不做英文自动识别。
- 不做自动发布。
- 不把导入内容直接写入 RAG 知识库。
- 不做字段级逐项勾选，第一版只做模块级 apply。

## 实际改动

### Server

- 新增 `ResumeImportRecognitionService`。
- 复用 `FileExtractionService`，但在导入识别入口额外限制只允许 `md/txt`。
- 增加边界规则：文件不超过 `1MB`，提取文本长度在 `500~50000` 字符之间。
- mock 模式下提供确定性 Markdown 解析器，用 `public/lifeiyu-mock-zh.md` 风格样例生成候选 `StandardResume`。
- provider 模式下固定要求 JSON 输出，并在服务端做 JSON 提取、归一化和 schema 校验。
- 新增临时结果缓存：`resultId -> candidateResume/detail/draftUpdatedAt`。
- 新增模块级 diff：`added / changed / unchanged / warning`。
- 新增 apply 逻辑：只把选中模块一次性写回当前 draft，并用草稿时间戳防止旧识别结果覆盖新草稿。
- 同一个 `resultId` 成功写回后会标记为已消费，避免 UI 分多次回填时触发草稿时间戳冲突。
- 新增 `AiResumeImportController`：
  - `POST /api/ai/resume-import/recognize`
  - `GET /api/ai/resume-import/jobs/:jobId`
  - `GET /api/ai/resume-import/results/:resultId`
  - `POST /api/ai/resume-import/apply`

### API Client

- 新增简历导入相关类型：模块、diff、统计、结果、apply 输入输出。
- 新增方法：
  - `createRecognizeAiResumeImportMethod`
  - `createFetchAiResumeImportResultMethod`
  - `createApplyAiResumeImportMethod`

### Admin

- AI 工作台新增“简历导入识别”卡片。
- 新增导入结果页：`/dashboard/ai/resume-import/results/:resultId`。
- 看台展示：
  - 识别摘要
  - 模块统计
  - warnings
  - 当前草稿 vs 候选草稿模块 diff
- 支持选择多个模块后一次性写回；成功后当前识别结果不再允许继续回填。
- 写回后提示“公开站仍需手动发布”。

## 设计思路

### 为什么不直接覆盖草稿

AI 识别属于高风险输入：用户上传内容可能格式混乱，AI 也可能漏字段或误解字段。直接覆盖 draft 会让用户失去可控性。

因此第一版采用：

1. 上传文件。
2. 生成候选草稿。
3. 展示模块级 diff。
4. 用户确认模块。
5. 只写回选中模块。

这保持了“AI 辅助，但人确认”的产品边界。

### 为什么导入结果只允许 apply 一次

服务端 apply 会修改草稿 `updatedAt`。如果 UI 允许同一个 `resultId` 分多次写回，第二次 apply 就会面对“识别时草稿”和“当前草稿”不一致的问题。

因此 MVP 明确收敛为：

1. 用户可以勾选多个模块。
2. 点击一次“写回所有已选模块”。
3. 成功后该识别结果标记为已消费。
4. 如果还想继续导入或补模块，需要重新上传识别。

这样契约更清楚，也更适合教程阶段解释。

### 为什么只支持 md/txt

PDF/DOCX 的文本抽取质量和版式噪声更复杂，容易把第一版问题扩大成“文件解析质量问题”。当前先把重点放在结构化识别、schema 校验、diff apply 这条主链路，后续再把 PDF/DOCX 作为独立 Issue 加入。

### 为什么 mock 模式也做解析

测试和开发不能默认调用真实 AI。mock 模式下如果只返回固定示例，就无法验证 `lifeiyu-mock-zh.md` 这类真实输入能否走通。

所以本次 mock 使用轻量 Markdown parser，让样例文件成为稳定回归用例：既不花 AI 成本，也能验证“上传文本 -> StandardResume 候选草稿”的核心模型。

### 为什么用模块级 diff

字段级 diff 很细，但第一版会引入较多 UI 和交互复杂度。模块级 diff 更符合教程型节奏：

- 用户容易理解。
- apply 逻辑更清晰。
- 后续可以自然演进到字段级勾选。

## Review 记录

- 已检查识别入口不会写发布态。
- 已检查导入结果不会进入 RAG 知识库。
- 已检查真实 AI 路径必须通过 JSON 解析与 `validateStandardResume`。
- 已检查 apply 只写回选中模块。
- 已检查 draft 时间戳冲突时会拒绝旧结果回填。
- 已检查同一个导入识别结果只能成功 apply 一次。

## MVP 边界说明

- Job / Result 当前使用内存 `Map` 缓存，TTL 为 30 分钟。
- 服务重启后任务和识别结果会丢失。
- 当前适合单实例开发与 MVP 演示，多实例部署时不共享任务状态。
- 后续生产化可升级为 `ai_resume_import_jobs` 表、轻量队列或外部缓存。
- Prompt 当前仍保留完整 `StandardResume` 示例，token 压缩会作为后续独立优化，不混入本轮体验修复。

## 代码结构治理补充

本次后续治理只调整代码组织和注释，不改变 API 路由、业务行为、发布流程或 RAG 入库链路。

### Server

- `ResumeImportRecognitionService` 保留原公开类名和 DI 注册路径，只承担用例编排。
- 新增 `application/resume-import/types` 管理导入识别业务类型，并为字段补充业务含义注释。
- 新增 `application/resume-import/constants` 管理文件大小、文本长度、TTL、模块列表和 Job step 定义。
- 新增 `application/resume-import/prompts` 管理识别 Prompt；本轮不做 Prompt token 压缩。
- 新增 `application/resume-import/utils` 拆分 mock Markdown parser、AI output repair、diff builder、job helper、JSON 提取、质量 warning 与内存缓存。
- 服务类拆分后控制在 500 行以内，方便后续教学时沿“用例编排 -> 纯函数规则”讲解。
- 继续沿用当前全局 response envelope / exception filter，不新增第二套返回或错误封装。

### Admin / API Client

- 为简历导入相关 API Client 类型和 Admin 展示类型补充字段级注释。
- 将多个上传面板共用的 `formatFileSize` 抽到 `packages/utils`，避免各面板重复维护同一展示规则。
- 简历导入专属 parser / repair / diff 不进入 `packages/utils`，仍留在 AI resume import 子域，避免过早公共化。

## 测试与验证

已执行：

```bash
pnpm --filter @my-resume/server test -- src/modules/ai/__tests__/resume-import-recognition.service.spec.ts src/modules/ai/__tests__/ai-resume-import.controller.spec.ts
pnpm --filter @my-resume/server typecheck
pnpm --filter @my-resume/api-client test -- src/ai.spec.ts
pnpm --filter @my-resume/api-client typecheck
cd apps/admin && pnpm exec vitest run "app/[locale]/dashboard/ai/_ai/__tests__/resume-import-panel.spec.tsx" "app/[locale]/dashboard/ai/_ai/__tests__/resume-import-result-shell.spec.tsx"
cd apps/admin && pnpm exec vitest run "app/[locale]/dashboard/ai/_ai/__tests__/ai-workbench-shell.spec.tsx"
pnpm --filter @my-resume/admin typecheck
```

补充说明：直接运行整套 Admin 测试时，当前仓库仍存在两个与本次改动无关的既有失败/波动：

- `login-form.spec.tsx`：demo admin 密码填充断言为空。
- `user-doc-ingestion-panel.spec.tsx`：`published` 文案多处匹配导致测试查询歧义。

本次未修改这些 unrelated 用例。

## 后续可写教程/博客切入点

- 为什么 AI 导入不能直接覆盖业务草稿。
- 文件上传边界：类型、大小、文本长度和错误提示。
- AI JSON 输出不可信时，服务端如何做提取、归一化、校验和兜底。
- mock provider 如何避免开发阶段误触发真实 AI 成本。
- 从模块级 diff 到字段级 diff 的渐进式设计。

## 后续建议

- 增加真实 AI 手工验证脚本或开发态按钮，用 `lifeiyu-mock-zh.md` 做端到端演示。
- 将 PDF/DOCX 支持拆成独立 Issue。
- 后续引入字段级 diff 时，优先从 `profile` 和 `projects` 两个模块试点。

## 第二轮学习与优化议题

这一轮在主线上继续补了 4 件对 AI 工程很关键的能力：

1. 前端轮询降频，降低无效请求并把本地耗时展示与网络轮询解耦。
2. Job 阶段可观测，每个 step 增加 `summary/details`，失败时带 `traceId` 和诊断细节。
3. AI 输出增加 repair 层，对 `LocalizedText`、数组形状和异常项做最小自动修复。
4. 修复本地计时导致轮询 timeout 被重置的隐藏问题。

这 4 件事说明：MVP 已经不再只是“调用模型拿结果”，而是开始形成真正的 AI 任务流水线。

### 1. `details` 先用字符串数组，为什么成立

当前 `details?: string[]` 的优点是：

- 落地快，前后端契约简单。
- 不需要先设计完整诊断 DSL，就能把关键信息暴露给用户和开发者。
- 对当前 MVP 的“读得懂、能排查”目标已经足够。

它的边界也很明显：

- 前端只能按纯文本渲染，无法区分 `warning / repair / provider / validation`。
- 不利于后续做筛选、折叠、国际化和监控聚合。
- 无法稳定沉淀“错误码”这一层抽象。

### 2. `details` 下一步更优方案

建议下一轮升级为结构化诊断项，而不是继续扩展纯字符串：

```ts
interface ResumeImportJobDiagnostic {
  code:
    | 'provider.request'
    | 'provider.response'
    | 'json.parse'
    | 'schema.repair'
    | 'schema.validation'
    | 'diff.summary'
  level: 'info' | 'warning' | 'error'
  message: string
  hint?: string
  meta?: Record<string, string | number | boolean>
}
```

这样可以带来几个直接收益：

- 前端可按 `level` 高亮不同信息。
- `code` 可作为后续监控、日志聚合和文档映射的稳定锚点。
- `hint` 可放“下一步建议”，更像一个真正可运维的 AI 工作台。
- `meta` 可放 `provider/model/jsonLength/repairCount` 这类机器友好数据。

建议节奏：

1. 保留 `details: string[]` 对外兼容。
2. 新增 `diagnostics` 字段。
3. Admin 先优先渲染 `diagnostics`，无则回退到 `details`。
4. 确认稳定后再逐步让服务端内部统一产出结构化诊断。

### 3. SSE 替代轮询的渐进路线

当前轮询已经能用，但如果未来 AI 导入、AI 优化、RAG 重建都走 Job 体系，SSE 会更合适。

推荐顺序不是“一步到位换掉轮询”，而是渐进：

#### Phase 1：保留轮询，先抽统一 Job 订阅层

- 把 `resume-import-panel.tsx` 的 polling 逻辑提成复用 hook。
- 让“状态更新”和“页面展示”继续解耦。
- 为后续替换传输层打基础。

#### Phase 2：新增 SSE 只读通道

- 新增接口示意：`GET /api/ai/resume-import/jobs/:jobId/events`
- 事件类型：
  - `job.step.updated`
  - `job.completed`
  - `job.failed`
- 前端优先连 SSE，失败时自动回退 polling。

#### Phase 3：统一 AI Job 总线

- 把简历导入、AI 优化、RAG 重建统一成同一类 Job Event Stream。
- 前端形成公共的 JobTimeline/JobSubscription 能力。

SSE 方案的优点：

- 比轮询更省请求。
- 任务阶段变化能更实时地反馈给用户。
- 比 WebSocket 更轻，当前单向推送场景更贴合。

SSE 方案的注意点：

- 需要考虑网关、反向代理、超时和断线重连。
- 多实例部署时，事件源不能只在单进程内存里。
- 前端要保留 polling fallback，避免本地或某些网络环境 SSE 不稳定时彻底不可用。

### 4. 模块级 diff 之后，怎么做细粒度 diff

当前模块级 diff 非常适合 MVP，但它回答的是“这个模块变了没”，还不能很好回答“到底哪几项变了”。

后续可以拆成两层：

#### 第 1 层：模块摘要 diff

- 继续保留 `added / changed / unchanged / warning`
- 作为列表页和总览页入口

#### 第 2 层：字段级 explain diff

建议先试点两个最容易产生价值的模块：

1. `profile`
2. `projects`

字段级 diff 结构可考虑：

```ts
interface ResumeImportFieldDiff {
  path: string
  changeType: 'added' | 'removed' | 'changed'
  currentValue: unknown
  candidateValue: unknown
  summary: string
}
```

试点方式：

- `profile.fullName.zh`
- `profile.headline.zh`
- `projects[0].name.zh`
- `projects[0].summary.zh`

先不要一开始就做全 schema 通用递归 diff，因为：

- 数组匹配策略会立刻变复杂。
- `LocalizedText`、空值、排序变化都需要额外规则。
- 教程阶段不利于解释。

更稳的做法是：

1. 先为 `profile` 写显式字段映射。
2. 再为 `projects` 增加“按名称或索引”的简化策略。
3. 等规则稳定后，再抽象成通用 diff engine。

### 5. Job / Result 从内存缓存演进到 Redis / DB

当前内存 `Map` 的优点：

- 实现极轻，适合单机 MVP。
- 非常利于学习和调试。

但边界也已经很清楚：

- 服务重启即丢失。
- 多实例无法共享。
- 不适合作为长时间可追溯记录。

可以考虑三种升级路径：

#### 方案 A：直接上 Redis

适合目标：

- 先解决“重启丢失”和“多实例共享”
- 仍然保持 Job 是短期态

可以存：

- `resume-import:job:{jobId}`
- `resume-import:result:{resultId}`
- TTL 继续保留 30 分钟或 2 小时

优点：

- 成本低，迁移小
- SSE / 多实例场景更顺
- 后续也能复用给其他 AI Job

缺点：

- 审计与长期追溯仍然弱
- 复杂查询能力有限

#### 方案 B：落数据库表

例如新增：

- `ai_resume_import_jobs`
- `ai_resume_import_results`
- `ai_resume_import_applies`

适合目标：

- 想保留历史
- 想做后台记录页、统计、失败分析
- 想支持用户回看曾经的导入记录

优点：

- 可追溯、可查询、可报表
- 更接近生产系统

缺点：

- 设计与迁移成本更高
- 需要考虑清理策略

#### 方案 C：Redis + DB 双层

这是中期更平衡的形态：

- Redis 存运行态 Job 和短期 Result
- DB 存已完成记录和关键诊断摘要

这样做的好处是：

- 用户等待时读 Redis，快
- 复盘和审计时查 DB，稳

### 6. 当前更推荐的落地顺序

如果后面要正式开优化 Issue，我建议顺序是：

1. `details -> diagnostics` 结构化
2. 抽统一 Job subscription 层
3. 新增 SSE + polling fallback
4. `profile/projects` 试点字段级 diff
5. Redis 托管 Job / Result
6. 视需要再补 DB 历史表

原因很简单：

- 前 3 步优先提升“可观测 + 体验”
- 第 4 步提升“可解释 + 可确认”
- 第 5/6 步再补“多实例 + 持久化”

这样更符合学习项目节奏，也更容易拆成一组小而清晰的 Issue。

## 第三轮实现：SSE 体验与结果看台升级

本轮把上一轮计划中的“实时反馈”从设想推进到实现，但仍保持 MVP 边界：不引入 WebSocket、不落库、不做多实例共享、不写入 RAG。

### 实际改动

- Server 新增 `GET /api/ai/resume-import/jobs/:jobId/events`，通过 `text/event-stream` 推送 `job.snapshot / job.completed / job.failed / job.heartbeat`。
- 内存 `ResumeImportMemoryStore` 增加轻量订阅能力，Job 阶段更新、完成或失败时通知 SSE 订阅者。
- API Client 新增 `streamAiResumeImportJob`，使用 `fetch + ReadableStream` 解析 SSE，保留 Bearer Token header，不使用 `EventSource`。
- Admin 上传面板移除自动轮询，改为 SSE 主路径；`GET jobs/:jobId` 保留为“手动刷新状态”的兜底。
- 任务阶段时间线改为 HeroUI v3 `Accordion`：运行中和失败阶段自动展开，完成阶段默认收起，等待阶段禁用。
- 结果页新增 `moduleContents` 展示数据，展示当前草稿与候选草稿的完整可读条目，不再只显示“n 条”。
- 每个模块支持模块级质量提醒，没有 warning 时不展示。

### Review 记录

- `EventSource` 不能可靠携带 `Authorization` header，因此采用 `fetch` 流式读取。
- `React.Key` 与 React Aria 的 `Key` 类型不完全一致，Accordion 展开 key 收窄为业务字符串，避免 `bigint` 类型污染。
- `moduleDiffs` 继续保留，确保已有结果缓存和测试兼容；新 UI 优先使用 `moduleContents`，无该字段时回退到旧 diff entries。
- Repair warning 在全局 `warnings` 中仍做截断，但模块看台会拿完整 repair messages 做模块级归因，避免 `education[0].schoolName` 这类关键提示丢失。

### 验证结果

- Server 简历导入服务与控制器测试通过。
- API Client SSE 解析与 Bearer Token 测试通过。
- Admin 上传面板与结果页组件测试通过。
- Server / API Client / Admin typecheck 通过。
- `packages/utils` 测试、`pnpm check:tsx-types`、`git diff --check` 通过。

### 后续仍可优化

- SSE 当前仍基于单实例内存订阅；多实例部署需要 Redis Pub/Sub、队列或数据库事件表。
- 当前断流后只提示用户手动刷新，没有自动重连，避免 MVP 中隐藏复杂状态机。
- `details` 仍是字符串数组，后续可升级为结构化 `diagnostics`。
- Prompt token 压缩、字段级 diff 和 Job/Result 持久化仍建议拆独立 Issue。

## 第四轮实现：等待态与结果看台细节优化

本轮聚焦用户等待体验和结果确认体验，不改变识别流程、一次性 apply 契约、发布流程或 RAG 入库链路。

### 实际改动

- `ResumeImportPanel` 增加 SSE heartbeat 可视反馈，运行态展示“实时连接正常，最近心跳 xx 前”。
- running 阶段状态点增加 CSS 动画，展开内容从裸 `running` 改成用户可读的等待说明。
- `ai_generating` 阶段增加 3-5 分钟等待预期说明，降低用户误判页面卡死的概率。
- 结果页移除内部 `Card` 套 `Card` 的重视觉层级，当前草稿 / 候选草稿仍保留左右对比，但内部条目改为轻量分隔线结构。
- meta 信息从大胶囊改成小号轻量 tag，避免邮箱、电话、所在地、时间等字段展示成异常的大圆角块。
- 服务端在 `moduleContents.warnings` 中聚合 repair warning：重复的 `AI 输出已自动修正` 不再逐条铺满页面，而是按模块、字段和数量汇总。
- 顶部全局 `warnings` 将 repair 信息压缩为一句总提示，具体细节由各模块质量提醒承载。

### Review 记录

- warning 聚合放在 Server，Admin 只负责渲染，避免前后端各维护一套压缩规则。
- API wire shape 不新增字段，继续复用 `warnings` / `moduleContents.warnings`，降低兼容成本。
- SSE 仍不做自动重连；断流提示用户手动刷新，避免 MVP 阶段引入复杂状态机。
- 结果页没有改成字段级 diff，本轮只优化可读性和视觉密度。

### 验证结果

- Server 简历导入服务与控制器测试通过。
- Admin 上传面板与结果页组件测试通过。
- Server / Admin typecheck 通过。
- `pnpm check:tsx-types` 与 `git diff --check` 通过。

## 第五轮实现：JSON 鲁棒性与历史记录入库

本轮针对真实 DeepSeek 调用中出现的 JSON 语法瑕疵、历史记录不可回看、耗时展示小数等问题做补强。范围仍然控制在简历导入识别链路内，不改发布流程、不写入 RAG、不新增通用上传中心。

### 实际改动

- Admin 已耗时与心跳距离统一展示整数秒，例如 `83 秒`，不再展示 `83.1 秒`。
- Server 新增简历导入 JSON helper：严格解析失败后，使用同一 provider 做一次“只修 JSON 语法、不改变语义”的修复重试。
- JSON 修复成功时，`json_parsing` 阶段展示“已自动修复后解析”；修复失败时保留原始 parse error、错误位置附近片段和修复失败诊断。
- 复用 `ai_usage_records` 记录 `resume-import` 类型的成功/失败调用，不新增表结构。
- 成功记录保存 result 快照、候选草稿、draftUpdatedAt、模块 diff / content / warnings；失败记录保存 job 阶段、错误、traceId 和耗时。
- `getResult(resultId)` 先读内存缓存，缓存失效后从历史记录快照恢复结果页展示。
- `apply` 支持从持久化快照恢复候选草稿，但仍保留 draftUpdatedAt 冲突校验和一次性 apply 契约。
- Admin 简历导入页新增历史识别记录 Table，成功记录可进入结果看台，失败记录展示错误摘要。
- `resume-import-content` 与 `resume-import-repair` 测试从完整结果相等改为验证结构、关键字段和语义包含，降低测试脆弱性。

### Review 记录

- JSON 修复不引入 LangChain / Zod / 新结构化输出依赖，优先沿用现有 AI provider port，避免为了 MVP 扩大技术面。
- `resume-import` 作为 usage record operation type 与 scenario 存储，但不进入通用分析表单场景。
- 识别历史属于管理员可见审计数据，本轮允许在 `detailJson` 保存候选简历快照，便于结果页回看和必要时回填。
- `ResumeImportRecognitionService` 保持 500 行以内；provider JSON 识别和 usage record 持久化拆到 resume-import 子域工具中。

### 验证结果

- Server 简历导入、JSON helper、usage record、content / repair 测试通过。
- API Client history / resume-import 类型测试通过。
- Admin 上传面板、结果页、历史表和 API wrapper 测试通过。
- Server / API Client / Admin typecheck 通过。
- `pnpm check:tsx-types` 与 `git diff --check` 通过。

## 第六轮修复：历史记录接口重复调用

### 问题现象

进入 Admin 简历导入识别页后，`GET /api/ai/reports/history?limit=20&type=resume-import` 被连续重复请求，浏览器 Network 面板出现大量相同请求，严重时会造成页面卡顿甚至内存溢出。

### 成因定位

- `ResumeImportShell` 使用 `useRequest` 暴露的 `send` 方法手动拉取历史记录。
- 页面 `useEffect` 将 `fetchHistory` 放入依赖数组。
- `fetchHistory()` 成功后会更新 `historyRecords`，触发组件重新渲染。
- 在当前 `useRequest` 使用方式下，`send/fetchHistory` 引用可能随渲染变化，导致 effect 再次执行。
- effect 再次执行后又调用 `fetchHistory()`，形成 `请求 -> setState -> rerender -> effect -> 请求` 的循环。

这类问题不是接口本身的问题，而是“非稳定函数引用 + effect 内触发状态更新 + 缺少请求 key 防重”共同造成的前端请求风暴。

### 修复方式

- 为简历导入历史请求增加 `historyRequestKeyRef`。
- request key 使用 `apiBaseUrl + accessToken + resume-import-history` 构成。
- effect 每次执行时先判断 request key 是否已请求过；已请求则直接返回。
- 这样即使 `fetchHistory` 引用变化、组件因数据更新重渲染，也不会重复触发同一身份下的历史请求。

### 后续规范

- `useEffect` 内调用 `useRequest().send` 时，必须加 request key guard，或确认 send 引用稳定且不会由本次请求结果触发依赖变化。
- 对“进入页面自动请求一次”的场景，优先参考 `AnalysisPanel` / `ResultShell` 的 `requestKeyRef` 模式。
- 不要仅依赖 `immediate: false` 防重复；它只能阻止初始化自动请求，不能阻止 effect 循环。
- 新增页面级历史列表时，必须补一个“重渲染后不会重复请求”的组件测试。

## 第七轮修复：导航按钮、JSON 漏逗号与核心竞争力漏识别

### 问题现象

- 简历导入页顶部“返回 AI 工作台 / 前往简历编辑”仍是普通 Link 样式，和页面内其他 HeroUI Button 视觉不一致。
- DeepSeek 返回的 `message.content` 虽然使用了 `response_format: json_object`，但仍出现数组元素附近漏逗号，导致 `JSON.parse` 在 `json_parsing` 阶段失败。
- `public/lifeiyu-mock-zh.md` 明确存在 `## 核心竞争力`，但真实 AI 输出可能没有把它映射到 `resume.highlights`。

### 成因定位

- 当前链路不是 OpenAI SDK / Vercel AI SDK 的结构化对象解析，而是 OpenAI-compatible HTTP 返回文本后由服务端自行 `JSON.parse`。
- `response_format: { type: 'json_object' }` 只能约束模型尽量输出 JSON object，不等于 schema 校验，也不保证复杂长 JSON 永远没有漏逗号、截断或数组元素错误。
- 原 Prompt 只给了完整 `StandardResume` 空结构示例，但没有显式说明“核心竞争力”章节必须映射到 `resume.highlights`。模型在长简历里可能把这部分当成 summary / skills 背景而忽略。

### 修复方式

- Admin 顶部两个导航入口改为 HeroUI `Button`，点击逻辑仍然跳转到原路由。
- 在 provider repair 前增加本地轻量 JSON 修复：只对“值结尾后直接跟下一个值开头”的漏逗号场景补逗号；能成功 `JSON.parse` 才采用，否则继续走 provider repair。
- Prompt 增加业务映射规则：`核心竞争力 / 核心优势 / 亮点` 必须映射到 `resume.highlights`。
- 服务端增加确定性兜底：如果候选草稿 `highlights` 为空，但原文存在 `## 核心竞争力` bullet，则从原文解析并补回 `resume.highlights`，同时记录 repair message。

### 后续规范

- `response_format: json_object` 不应被理解为“完全可靠结构化输出”；业务仍必须保留 `extract -> parse -> repair -> validate` 防线。
- 长 JSON 输出优先做本地保守修复，避免轻微漏逗号也再次调用模型造成额外等待。
- 对简历这类强结构文本，关键章节要有服务端确定性兜底，尤其是 `核心竞争力 -> highlights`、`核心项目经历 -> projects` 这种业务映射。

## 第八轮增强：Format 预处理与输入治理

### 背景

真实用户上传的简历不一定遵循 `lifeiyu-mock-zh.md` 这样的章节结构。如果直接把原始 Markdown / TXT 交给结构化识别，模型既要理解格式，又要映射字段，还要抵抗原文中的无关内容或提示词注入，失败概率会升高。

### 本次目标

在结构化识别前增加一层可审计的输入治理：

1. 备份提取后的完整原文。
2. 规则层先丢弃明显风险或无关行。
3. AI 将剩余文本归一为系统更容易识别的 Markdown 中间稿。
4. 后续仍走原有 `StandardResume` 识别、repair、validate、diff、apply 链路。

### 实际改动

- Job 阶段新增：`raw_archiving / format_normalizing / safety_filtering`。
- 新增 `resume-import-format` 工具与独立 Prompt，不和最终结构化识别 Prompt 混在一起。
- 规则层会标记并丢弃提示词注入、广告推广、脚本/HTML 注入、异常超长链接等片段。
- 结果详情新增 `sourceSnapshot` 和 `formatReport`，Admin 结果页新增“输入治理报告”。
- 成功/失败历史记录继续复用 `ai_usage_records`，成功快照中保存 `rawText / formattedText / sourceHash / resultDetail`。
- 后续结构化识别改用 `formattedText`，同时核心竞争力兜底会读取 `formattedText + rawText`，避免归一阶段漏掉原文真实亮点。

### Review 记录

- Format 阶段只做“整理输入”，不直接产出 `StandardResume`，避免把输入治理和业务结构化合成一坨。
- 安全过滤采用“丢弃并告知”，不默认阻断整次任务；只有过滤后有效内容不足才失败。
- 前端只展示丢弃内容摘要和原因，不展示完整风险原文，避免二次传播。

### 测试与验证

- 新增 `resume-import-format.spec.ts`，覆盖规则过滤、AI 格式归一、有效内容不足失败。
- 更新简历导入识别服务测试，确认 mock 样例仍能通过，并记录 `sourceSnapshot / formatReport / rawText / formattedText / sourceHash`。
- Admin 结果页测试覆盖输入治理报告展示。

### 教程/博客切入点

- AI 输出不是业务数据，用户上传输入也不是可信输入。
- 为什么要在“结构化识别”前增加 format/safety 中间层。
- 如何把安全过滤做成“可告知、可审计、可恢复”的用户体验，而不是静默吞内容。

## 第九轮修正：体验分区与单次 AI 调用收口

### 背景

第八轮加入 Format 预处理后，真实上传链路从原本约 5 分钟增长到约 8 分钟。原因是 `format_normalizing` 先调用一次 AI 生成格式化 Markdown，随后 `ai_generating` 又调用一次 AI 生成 `StandardResume` 候选草稿。虽然职责清楚，但对 MVP 来说等待成本过高，也容易让用户误以为系统卡在多个黑盒阶段。

### 本次目标

- 历史识别记录从上传识别 Card 中拆出来，作为页面级独立模块。
- 减少 Admin 端自定义 padding / Card 套壳，让 HeroUI 组件自身承担主要结构。
- 修正 Job Accordion 状态点布局，保证标题与展开详情对齐。
- 将“格式归一 / 输入治理报告 / 候选草稿识别”收口到一次 AI 调用。

### 实际改动

- `normalizeResumeImportInputFormat` 改为纯本地规则清洗，不再接收 `AiService`，也不再调用 provider。
- `formattedText` 明确定义为“规则层清洗后的中间稿”，不是 AI 重写后的 Markdown。
- 删除独立的 `resume-import-format.prompt.ts`，避免后续误用为第二次长耗时 AI 调用。
- `buildResumeImportRecognitionPrompt` 扩展为一次输出 `summary / warnings / formatReport / resume`，让模型在生成候选草稿的同时报告输入治理结果。
- 服务端合并本地规则层 `formatReport` 与 AI 返回的 `formatReport`：本地丢弃项永远保留，AI 报告只能补充，不覆盖本地审计结果。
- Admin 简历导入页拆成顶部说明、上传识别模块、历史识别记录模块三段；历史表恢复 `识别成功 / 识别失败` 文案。
- Job Accordion 改为状态点、标题内容、展开图标三列 grid；展开详情对齐标题正文列。
- running 阶段文案更新为“规则层快速处理 + 单次 AI 生成候选草稿与治理报告”。

### Review 记录

- Format / Safety 阶段仍保留在 Job 时间线中，但它们应是本地快步骤，不能再次引入 provider 长调用。
- 本地规则层承担“便宜、可解释、可审计”的输入治理；AI 层承担“理解非标准简历并结构化”的语义识别。
- 如果未来确实需要 AI 预格式化，应作为独立 Issue 重新评估成本、并在 UI 中明确它是额外长耗时阶段。

### 测试与验证

- Server 目标测试通过：`resume-import-recognition.service.spec.ts`、`resume-import-format.spec.ts`、`resume-import-json.spec.ts`。
- Admin 目标测试通过：`resume-import-panel.spec.tsx`、`resume-import-shell.spec.tsx`、`resume-import-history-table.spec.tsx`。
- 服务端测试运行中覆盖到全量 server suite，当前 55 个测试文件、216 个测试通过。

### 后续规范

- 输入治理默认采用“规则层快速处理 + 单次 AI 识别补充报告”。
- 禁止在 `format_normalizing` 阶段直接调用 provider，除非新 Issue 明确把额外等待和额外费用纳入验收标准。
- 新增 Job 阶段时必须标注该阶段是本地快步骤还是远程长耗时步骤，避免 UI 和真实链路认知错位。

## 第十轮增强：结构化输出、诊断日志与感知进度

### 背景

真实识别后页面出现“教育经历未识别到内容 / 项目经历未识别到内容”等质量提醒。排查后确认这些提醒不是写死结果，而是候选草稿模块为空或偏少时由质量规则生成；真正问题是 provider 生成的候选草稿抽取不完整。

### 实际改动

- 真实 provider 识别优先走 LangChain `withStructuredOutput`，DeepSeek / reasoner 默认使用 `jsonMode`，其他 OpenAI-compatible provider 使用 `functionCalling`。
- 保留现有 `generateText -> extract JSON -> parse/repair` fallback；结构化输出失败不会直接阻断整个导入链路。
- 新增简历导入 structured output zod schema，覆盖 `summary / warnings / formatReport / resume`。
- Prompt 强化教育、项目、技能、工作经历、核心竞争力等中文非标准标题映射规则。
- 新增 `logs/ai-server/YYYY-MM-DD.resume-import.ndjson` 诊断日志，记录 jobId、traceId、provider、model、structured method、fallback、耗时、模块统计和错误摘要。
- 新增 `AI_RESUME_IMPORT_LOG_RAW` 与 `AI_RESUME_IMPORT_LOG_DIR` 配置；生产环境默认不记录完整模型原文。
- SSE 增加 `job.progress_hint` 事件，AI 长耗时阶段每 8-13 秒随机推送可读提示；Admin 展示最近提示，不人为拖慢真实任务。

### Review 记录

- 结构化输出是提升候选草稿稳定性的主路径，但仍不能替代业务校验；后续继续执行 repair、normalize、validate 和质量提醒。
- 感知进度只表达“系统仍在工作”，不代表真实阶段完成，避免为了演示而增加服务端等待时间。
- AI 诊断日志不写 API key、Authorization 或完整请求头；完整模型原文仅在开发环境或显式开启时记录。

### 测试与验证

- `resume-import-recognition.service.spec.ts` 新增 structured output 成功路径，确认不触发 fallback，且教育、项目、技能、亮点统计完整。
- API Client SSE 测试覆盖 `job.progress_hint` 解析与回调。
- Admin 上传面板测试覆盖感知进度提示展示。

## 第十一轮修正：结构化流式工具调用与耗时收口

### 背景

真实导入中出现 `已耗时 NaN 秒`，同时 AI 识别从 3-5 分钟增长到 10 分钟以上，最终仍失败在 `json_parsing`。排查后确认，`NaN` 来自 Admin 对缺失或非法 `createdAt / elapsedMs` 缺少兜底；耗时增长来自真实 provider 链路在 LangChain structured output 失败后，又回退到完整 JSON 文本生成，再失败后继续调用 AI 修复 JSON，最坏会叠加多次 3-5 分钟长耗时调用。

### 本次目标

- 修复 Admin 已耗时 `NaN 秒` 的状态兜底。
- 将真实 AI 主链路改为 LangChain tool-call structured stream，参考 `bindTools + JsonOutputToolsParser.stream`。
- 禁止结构化输出失败后再触发完整 JSON 文本生成，避免识别链路被拉长。
- 每个关键服务端阶段写入 AI 专用日志，并在开发环境打印摘要，方便定位卡点。

### 实际改动

- `AiProvider` 增加 `generateStructuredObjectStream` 能力，`OpenAiCompatibleAiProvider` 使用 `ChatOpenAI.bindTools` 与 `JsonOutputToolsParser` 流式接收 tool args。
- `generateProviderResumeImportRecognition` 改为只走 tool-call structured stream；失败时记录诊断并直接失败，不再调用 `generateText` 生成完整 JSON，也不再追加 AI JSON repair 长调用。
- 结构化 stream 的中间增量只用于日志与可观测性；最终仍等待完整 tool args，再执行 `repairProviderResume -> normalizeStandardResume -> validateStandardResume`。
- `parseResumeImportStructuredOutput` 改为最小 provider payload 边界校验，避免模型偶发 LocalizedText 简写时在 repair 之前被严格 Zod 拦截。
- `writeResumeImportAiLog` 在 NDJSON 文件外，开发环境同步打印 `[ai-server][resume-import]` 摘要；测试环境不打印，避免测试输出污染。
- `ResumeImportRecognitionService` 在 accepted、extracting、text_validating、raw_archiving、format_normalizing、safety_filtering、schema_validating、diff_building、completed、failed 等阶段写入日志。
- `ResumeImportPanel` 对非法 `createdAt / elapsedMs` 做 finite 兜底，缺失快照时显示 `0 秒`，不再出现 `NaN 秒`。

### Review 记录

- 简历导入的远程长耗时阶段只能有一个：`ai_generating`。
- tool-call stream 的 partial args 不能进入业务结果，只能用于日志和 UI 感知进度；最终结果必须等完整 args 后再校验。
- 完整 JSON 文本 fallback 会显著拉长失败路径，且仍可能因 token 截断或漏逗号失败，本轮从主链路移除。
- JSON helper 仍保留为工具测试与后续参考，但真实识别主链路不再依赖大段 JSON 文本解析。

### 测试与验证

- Server：`pnpm --filter @my-resume/server test -- src/modules/ai/__tests__/resume-import-recognition.service.spec.ts 'src/modules/ai/application/resume-import/__tests__/*.spec.ts'` 通过。
- Server：`pnpm --filter @my-resume/server typecheck` 通过。
- Admin：`pnpm --dir apps/admin exec vitest run 'app/[locale]/dashboard/ai/_ai/__tests__/resume-import-panel.spec.tsx'` 通过，覆盖缺失时间戳不显示 `NaN 秒`。

### 后续规范

- 若结构化流失败，优先暴露诊断和 traceId，不自动追加第二次完整生成。
- 如未来要恢复 fallback，必须设置独立 Issue、明确超时预算，并在 UI 中告知“正在执行兜底识别”。
- AI 诊断日志必须持续记录阶段、耗时、provider、model、模块统计和失败原因，禁止记录 API key / Authorization。

## 第十二轮修正：进行中 Job 恢复与历史表格治理

### 背景

真实使用中，上传并启动识别后如果页面刷新、路由重载或 SSE 连接中断，用户会感觉当前进度“被打断”，甚至误以为 `jobId` 丢失。同时历史识别记录页曾出现 `history` 接口疯狂重复调用，导致浏览器内存压力快速升高。

### 成因分析

- 进行中 Job 目前仍是服务端内存态，页面刷新后 React state 会丢失；如果前端没有保存当前 `jobId`，就无法继续查询服务端仍在运行的任务。
- `history` 重复请求的直接风险来自 Client Component 中的 `useEffect + useRequest` 组合：hook 返回的 `send` 函数引用可能随渲染变化，若 effect 只依赖 `send / accessToken / status`，一次请求完成后 `data` 更新触发重渲染，可能再次触发 effect，形成请求循环。
- 修复策略不能靠“减少依赖数组”硬压，而应该引入业务级 requestKey，明确同一账号、同一接口、同一筛选条件只自动请求一次。

### 实际改动

- `ResumeImportPanel` 在创建或收到 running Job 快照时，将当前 `jobId` 写入 `localStorage`。
- 页面重新挂载时自动读取上一次 active `jobId`，调用 `GET jobs/:jobId` 恢复任务快照，并重新订阅 SSE。
- 恢复失败时不再一概清除 `jobId`：只有明确 404 / 不存在时才遗忘；网络中断等临时错误会保留 `jobId`，并提供“继续查询上一次任务”按钮。
- Job completed / failed 后清理 active `jobId`，避免下次进入页面误恢复已终结任务。
- `ResumeImportShell` 使用 `historyRequestKeyRef` 对历史列表自动请求做幂等保护，避免 hook 引用变化导致重复请求。
- 历史识别记录表升级为 10 条/页分页展示；文件/摘要最多两行并提供 Tooltip；模型使用 Chip 展示；耗时展示为 `X 分 Y 秒`；创建时间独立成列；操作区支持查看详情与删除。
- 后端补充 `DELETE /api/ai/reports/history/:recordId`，删除历史使用记录；该操作只删除审计记录，不取消内存 Job，也不影响已发布简历。

### Review 记录

- active Job 恢复只解决“同一浏览器、同一服务进程仍持有 Job”的 MVP 场景；服务重启后内存 Job 仍会丢失，这是当前内存存储方案的边界。
- 历史表删除的是 `ai_usage_records` 审计记录，不应暗示可以撤销已经回填的草稿。
- 后续所有 Client Component 自动拉取列表时，都应优先使用 requestKey 或显式触发动作，避免 `useEffect` 因 hook 返回引用变化进入请求循环。

### 测试与验证

- Admin：`resume-import-panel.spec.tsx` 覆盖刷新后从 `localStorage` 恢复 running Job 并重新订阅 SSE。
- Admin：`resume-import-history-table.spec.tsx` 覆盖历史表分页、模型 Chip、耗时格式、查看详情和删除入口。
- Admin：`resume-import-shell.spec.tsx` 覆盖历史列表只自动拉取一次，以及查看/删除历史记录。
- Server：`ai-usage-record.service.spec.ts` 与 `ai-report.controller.spec.ts` 覆盖历史删除服务与控制器。
- API Client：`ai.spec.ts` 覆盖删除历史记录 Method。
