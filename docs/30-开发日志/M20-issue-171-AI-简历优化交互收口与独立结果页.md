# M20-issue-171：AI 简历优化交互收口与独立结果页

- Issue：M20 Follow-up / AI 简历优化交互收口 + 独立结果页
- 里程碑：M20
- 分支：`fys-dev/feat-m20-issue-171-ai-draft-optimization`
- 日期：2026-04-15

## 背景

当前 AI 工作台已经能基于后台草稿生成结构化 patch，但用户验收时暴露出四个关键问题：

- 等待过程只有按钮 loading，分析中几乎无感知
- 返回数据过重，直接把双语 patch / suggestedResume 全量塞给前端
- diff 直接堆在工作台页里，信息墙感明显
- 只能一键应用全部，缺少模块级操作

这次任务的目标不是推进 M21 编辑器内联，而是先把“当前草稿分析 → 结果阅读 → 模块应用”打磨成一个可演示、可讲解、可继续演进的完整闭环。

## 本次目标

- 为“分析当前草稿”补齐 Rich Loading、可取消和长等待提示
- 后续根据真实体验继续收口模拟进度节奏：
  - `0s → 30s` 改成 `0 / 5 / 10 / 15 / 20 / 25 / 30s` 锚点曲线，逐步增长到 `70%`
  - 之后每 `5s` 增长 `5%`
  - pending 最多只到 `95%`
  - 请求成功后先展示 `100%`，停留 `1s` 再跳转结果页
- 新增独立结果页，承接 diff 阅读、模块级 apply / reset 与全局 apply
- 服务端引入结果缓存，用 `resultId` 解耦展示 DTO 与真正 apply patch
- 收紧 locale 展示 DTO，只返回当前语言结果
- 补开发日志与教程大纲，为后续 AI 前端交互专题做沉淀

## 非目标

- 不做 SSE / streaming 协议
- 不做编辑器内联建议层与逐字段 accept / reject
- 不做真正的“撤销已写回数据库”
- 不处理 server 全局 `/api` e2e 404 基线问题

## TDD / 测试设计

- Admin：
  - `analysis-panel.spec.tsx` 覆盖 Rich Loading、取消、结果页跳转
  - `resume-optimization-result-shell.spec.tsx` 覆盖结果页加载、reset、单模块 apply
  - `ai-workbench-api.spec.ts` 覆盖新 GET result 接口、`resultId + modules` apply 形态、`signal` 透传
- Server：
  - `ai-resume-optimization.service.spec.ts` 覆盖 `resultId` 返回、缓存读取、按模块 apply
  - `resume-optimization-result-cache.service.spec.ts` 覆盖缓存读写与 TTL 过期
- 额外验证：
  - `pnpm --filter @my-resume/admin exec tsc --noEmit`
  - `pnpm --filter @my-resume/server exec tsc --noEmit -p tsconfig.build.json`
  - `pnpm --filter @my-resume/admin build`

## 实际改动

- Server：
  - 新增 `apps/server/src/modules/ai/resume-optimization-result-cache.service.ts`
  - `resume-optimize` 现在返回轻量结果 DTO：`resultId / summary / focusAreas / changedModules / moduleDiffs / providerSummary / createdAt / locale`
  - 新增 `GET /api/ai/reports/resume-optimize/results/:resultId`
  - `resume-optimize/apply` 切换为 `resultId + modules`
  - `moduleDiffs.entries` 从 `before / after` 改为 `currentValue / suggestedValue`
  - prompt 加入 locale 约束，强调 `zh` / `en` 不要拼接混用
- API Client：
  - `requestInit.signal` 允许透传给 `resume-optimize`
  - 新增 `createFetchAiResumeOptimizationResultMethod`
  - apply DTO 切换为 `resultId + modules`
- Admin：
  - `analysis-panel` 改成“工作台输入 + Rich Loading + 成功后跳结果页”
  - 新增独立结果页 shell：概览区、对比 legend、模块卡片、模块级 apply/reset、底部全局 apply
  - 结果页默认全选所有受影响模块；reset 语义为取消待应用状态，不回滚数据库
  - 结果页支持刷新后通过 `resultId` 重新读取

## Review 记录

- 仍然严格聚焦 M20 Follow-up，没有提前推进 SSE 和编辑器内联
- 将“展示 DTO”和“apply patch”彻底分层，后续做 SSE 或版本化撤销时边界更清晰
- 把结果页拆成独立路由后，工作台只负责输入与触发，页面职责明显更稳定
- `ResumeOptimizationResultCacheService` 可继续复用到后续 AI 结果承接场景

## 自测结果

- 类型检查：
  - `pnpm --filter @my-resume/admin exec tsc --noEmit`
  - `pnpm --filter @my-resume/server exec tsc --noEmit -p tsconfig.build.json`
- 测试：
  - `pnpm --filter @my-resume/admin exec vitest run 'app/[locale]/dashboard/ai/_ai/__tests__/analysis-panel.spec.tsx' 'app/[locale]/dashboard/ai/_ai/__tests__/ai-workbench-api.spec.ts' 'app/[locale]/dashboard/ai/_ai/__tests__/resume-optimization-result-shell.spec.tsx'`
  - `pnpm --filter @my-resume/server exec vitest run 'src/modules/ai/__tests__/ai-resume-optimization.service.spec.ts' 'src/modules/ai/__tests__/resume-optimization-result-cache.service.spec.ts' --config ./vitest.config.mts`
- 构建：
  - 待补本轮 admin build 结果
- 手工验证：
  - 待在浏览器内确认 pending 文案节奏、长等待提示与结果页阅读体验

## 遇到的问题

- `@my-resume/api-client` 运行时导出走 `dist`，新增 method 后 admin 测试拿到的是旧构建产物
  - 处理方式：补跑 `pnpm --filter @my-resume/api-client build`，并保留源码契约更新
- HeroUI Button / Checkbox 的 props 与预期不同
  - 处理方式：结果页返回工作台改成原生 `Link` 样式链接，Checkbox 改回 `onChange`
- fake timers 下 `waitFor` 容易卡住
  - 处理方式：pending/cancel 测试改成 `fireEvent + advanceTimers + 微任务冲刷`

## 可沉淀为教程/博客的点

- 为什么同步 AI 接口阶段也值得先做 Rich Loading，而不是直接上 SSE
- 为什么模拟进度不能涨得过快：如果 6 秒就接近完成，会比“没有进度”更容易误导用户
- 为什么结果页要独立于工作台，而不是继续堆在同一页
- 为什么“服务端结果缓存 + resultId”比纯前端状态更适合 AI 结果承接
- 如何把双语 patch 与 locale 展示 DTO 分层，降低前端复杂度

## 后续待办

- M20 下一个收尾项：补 admin build 结果与真实页面截图验收
- M21 再推进编辑器联动、section 级跳转与更细粒度 accept / reject
- 后续可继续拆：SSE 协议、结果持久化、版本化 undo、结果历史列表
