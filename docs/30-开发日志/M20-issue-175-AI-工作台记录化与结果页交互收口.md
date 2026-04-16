# M20-issue-175：AI 工作台记录化与结果页交互收口

- Issue：M20 Follow-up v3 / AI 工作台记录化 + 分析中交互 + 结果页细节收口
- 里程碑：M20
- 日期：2026-04-15

## 背景

前两轮已经把“AI 工作台 → 独立结果页 → 优化记录页”的主链路拆开，但真实使用时又暴露出几个更细的交互问题：

- `草稿反馈` 与 `运行时摘要` 信息有价值，但作为大块内容放在工作台底部会挤占主路径空间
- 辅助分析报告会因不同分析场景产生不同结果，但原布局无法直观看到“每一次 AI 调用”的区别
- 真实 Provider 调用会产生费用，不能只停留在前端本地记录，必须在服务端持久留痕
- 点击“分析当前草稿”后，虽然已有 pending 状态，但仍不够像一个明确的局部处理中浮层
- 结果页的模块按钮和字段对比布局还可以更接近“当前内容 vs 修改内容”的评审体验

本轮继续只处理 M20 范围，不推进 M21 编辑器内联建议，不引入 SSE，不做字段级 apply。

## 本次目标

- 将工作台顶部的辅助信息收成小型可折叠卡片
- 把辅助分析报告改成 `Table + Drawer` 的记录阅读模式
- 新增服务端 `AI 调用记录` 持久层，真实 AI 调用成功或失败都写入记录
- 将“分析当前草稿”pending 改成覆盖分析面板的局部浮层
- 收口结果页模块按钮、左右对比结构和原因说明样式

## 实际改动

### 1. 服务端新增 AI 调用记录

涉及文件：

- `apps/server/src/database/schema.ts`
- `apps/server/src/modules/ai/ai-usage-record.repository.ts`
- `apps/server/src/modules/ai/ai-usage-record.service.ts`
- `apps/server/src/modules/ai/ai-report.controller.ts`
- `apps/server/src/modules/ai/ai.module.ts`

新增 `ai_usage_records` 表，用于记录真实 Provider 调用：

- `operationType`：区分 `analysis-report` 与 `resume-optimization`
- `scenario` / `locale` / `inputPreview`：记录本次调用上下文
- `provider` / `model` / `mode` / `generator`：记录运行时来源
- `status` / `errorMessage` / `durationMs`：记录调用结果与耗时
- `relatedReportId` / `relatedResultId`：关联分析报告或简历优化结果
- `detailJson`：分析报告存完整详情，简历优化只存轻量摘要与模块变化

新增接口：

- `GET /api/ai/reports/history`
- `GET /api/ai/reports/history/:recordId`

并在以下真实调用接口中附加 `usageRecordId`：

- `POST /api/ai/reports/analyze`
- `POST /api/ai/reports/resume-optimize`

失败调用也会写入 `failed` 记录，方便后续排查模型超时、Provider 异常或提示词问题。

### 2. API Client 补齐记录读取方法

涉及文件：

- `packages/api-client/src/ai.ts`
- `packages/api-client/src/types/ai.types.ts`
- `packages/api-client/src/ai.spec.ts`
- `apps/admin/app/[locale]/dashboard/ai/_ai/services/ai-workbench-api.ts`

新增类型：

- `AiUsageRecordSummary`
- `AiUsageRecordDetail`
- `FetchAiUsageHistoryInput`
- `FetchAiUsageRecordDetailInput`

新增方法：

- `createFetchAiUsageHistoryMethod`
- `createFetchAiUsageRecordDetailMethod`

同时重建了 `@my-resume/api-client`，保证 admin 测试通过包导出时能拿到最新 `dist`。

### 3. 工作台顶部信息卡收口

涉及文件：

- `apps/admin/app/[locale]/dashboard/ai/_ai/ai-workbench-shell.tsx`
- `apps/admin/app/[locale]/dashboard/ai/_ai/components/compact-workbench-info-cards.tsx`

将原先底部较大的 `草稿反馈` 与 `运行时摘要` 改成 hero 下方的小型可折叠卡片：

- 默认只展示摘要行，减少滚动占用
- 点击展开后查看更完整的草稿摘要、更新时间、Provider、模型、支持场景
- 删除底部原大块卡片，让工作台更聚焦输入、分析、跳结果页三段式

这个调整适合后续教程讲解：重要上下文不消失，但不抢主操作区。

### 4. 辅助分析改成 Table + Drawer

涉及文件：

- `apps/admin/app/[locale]/dashboard/ai/_ai/components/analysis-panel.tsx`
- `apps/admin/app/[locale]/dashboard/ai/_ai/components/ai-analysis-history-table.tsx`
- `apps/admin/app/[locale]/dashboard/ai/_ai/components/ai-analysis-report-drawer.tsx`

辅助分析区从“单次结果展示”升级为“记录列表 + 详情抽屉”：

- Table 列表展示场景、语言、来源、评分 / 摘要、Provider、生成时间与操作
- 点击行或 `查看详情` 打开 Drawer
- Drawer 复用已有结论层、依据层、风险层、建议动作结构
- 生成辅助分析报告成功后会刷新记录列表，并默认打开本次记录详情

这样每次使用 AI 都能被看见，也能解释不同分析场景为什么有不同输出。

### 5. 分析当前草稿改成局部 pending 浮层

涉及文件：

- `apps/admin/app/[locale]/dashboard/ai/_ai/components/resume-optimization-pending-panel.tsx`
- `apps/admin/app/[locale]/dashboard/ai/_ai/components/resume-optimization-pending-overlay.tsx`
- `apps/admin/app/[locale]/dashboard/ai/_ai/components/analysis-panel.tsx`

点击 `分析当前草稿并生成建议` 后，不再只靠按钮 loading，而是覆盖当前分析面板主要区域：

- 明确展示 `正在分析当前草稿`
- 展示阶段标题、阶段说明、已等待时长
- 保留长等待提示、180s 硬超时和用户取消能力
- 使用半透明背景和 blur 阻止用户误点下方表单

本轮仍不做 SSE，但这个浮层让同步接口等待过程具备可感知、可讲解的产品形态。

### 6. 结果页细节收口

涉及文件：

- `apps/admin/app/[locale]/dashboard/ai/_ai/resume-optimization-result-shell.tsx`
- `apps/admin/app/[locale]/dashboard/ai/_ai/__tests__/resume-optimization-result-shell.spec.tsx`

结果页继续保持模块级 apply，不进入字段级 apply：

- `加入批量应用` 改成 HeroUI `Button`
- 模块右侧按钮组统一靠右，状态切换为 `加入批量应用 / 已加入批量 / 已应用`
- 字段对比改成明确的 `grid xl:grid-cols-2`
- 左侧 `resume-diff-current-section` 使用中性当前内容样式
- 右侧 `resume-diff-recommend-section` 使用蓝色建议样式
- 建议内容与建议说明合并在一张建议卡中
- 原因说明使用浅黄色背景、小字号和偏弱文本色，降低喧宾夺主感
- 底部 `返回工作台` 与 `应用所有已选模块` 都统一为 HeroUI `Button size="md"`

## Review 记录

本轮 review 重点检查：

1. 是否只围绕 M20 工作台与结果页交互收口，没有进入编辑器内联建议
2. 服务端记录是否只覆盖真实 Provider 调用，没有把缓存读取、文件提取、apply 也计入付费调用
3. 分析报告详情是否可以刷新后从服务端记录读取，而不是只依赖当前页面内存状态
4. 结果页是否仍保持模块级 apply 语义，避免提前扩大到字段级写回
5. 新增 TSX 文件是否符合模块类型拆分约定

结论：

- 范围符合当前 issue
- 记录层与展示层职责清晰
- 工作台主路径更聚焦，分析记录更适合后续作为教程重点案例
- 结果页交互更接近“审阅 AI 建议后再应用”的产品形态

## 遇到的问题

- `@my-resume/api-client` 的包导出指向 `dist`，admin 测试新增方法后需要先执行客户端包 build，否则测试会读到旧导出。
- 小型草稿反馈卡增加了更新时间后，原测试中对标题的精确文本断言变得过严，已改为前缀匹配。
- `已应用` 同时出现在状态与按钮中，测试改为多元素断言，避免把 UI 状态表达误判为重复错误。
- `ResumeOptimizationPendingOverlay` 的 `hint` 允许 `undefined`，而内层 pending panel 只接受 `string | null`，已在传参时收口为 `hint ?? null`。
- `AnalysisForm` 内部原先把 `AiFileExtractionPanel` 作为 `inputAccessory` 直接渲染在 `<form>` 内，导致工作台出现 `<form>` 嵌套 `<form>` 的 hydration 报错；这一轮将两者统一改为 HeroUI `Form`，并把辅助材料卡移出主表单。
- `GET /api/ai/reports/history` 在本地旧库上报 500，根因不是 controller，而是 `.data/my-resume.db` 尚未执行 `db:push`，缺少 `ai_usage_records` 表；本轮按既定策略执行显式 `pnpm --filter @my-resume/server db:push`，不引入启动自动迁移。
- `refreshAnalysisHistory` 原先直接 `await` 请求，接口失败时会把异常抛进 React 渲染链；这一轮改成局部错误卡收口，保证 history 失败不会阻断结果页跳转。

## 测试与验证

本轮执行并通过：

- `pnpm --filter @my-resume/api-client build`
- `pnpm --filter @my-resume/api-client test`
- `pnpm --filter @my-resume/admin exec vitest run 'app/[locale]/dashboard/ai/_ai/__tests__/analysis-panel.spec.tsx' 'app/[locale]/dashboard/ai/_ai/__tests__/resume-optimization-result-shell.spec.tsx' 'app/[locale]/dashboard/ai/_ai/__tests__/ai-workbench-shell.spec.tsx' 'app/[locale]/dashboard/ai/_ai/__tests__/ai-workbench-api.spec.ts'`
- `pnpm --filter @my-resume/server exec vitest run 'src/database/__tests__/schema.spec.ts' 'src/modules/ai/__tests__/ai-resume-optimization.service.spec.ts' 'src/modules/ai/__tests__/ai-usage-record.service.spec.ts' 'src/modules/ai/__tests__/ai-report.controller.spec.ts' --config ./vitest.config.mts`
- `pnpm --filter @my-resume/admin exec tsc --noEmit`
- `pnpm --filter @my-resume/server typecheck`
- `pnpm check:tsx-types`
- `pnpm --filter @my-resume/admin build`

本轮额外执行：

- `pnpm --filter @my-resume/admin exec vitest run 'app/[locale]/dashboard/ai/_ai/__tests__/analysis-panel.spec.tsx' 'app/[locale]/dashboard/ai/_ai/__tests__/file-extraction-panel.spec.tsx' 'app/[locale]/dashboard/ai/_ai/__tests__/ai-workbench-shell.spec.tsx'`
- `pnpm --filter @my-resume/server db:push`

## 后续可写成教程的切入点

- 为什么 AI 功能需要“调用记录”，尤其是真实 Provider 成本可见化
- `Table + Drawer` 为什么适合承接多场景 AI 分析报告
- 同步接口阶段如何用局部 pending 浮层替代“无感等待”
- 为什么结果页要先做模块级 apply，而不是直接进入字段级 accept / reject
- `detailJson` 存什么、不存什么：分析报告可持久回看，apply patch 仍交给短期 result cache

## 后续边界

- 真实 token usage 统计后续等 Provider 稳定返回 usage 后再补
- AI 调用记录本轮只做审计与回看，不做账单系统
- 简历优化历史本轮不持久化完整 apply patch，避免长期保存可直接写回草稿的数据
- SSE 留到后续“AI 前端交互协议”专题，不在本轮混入
