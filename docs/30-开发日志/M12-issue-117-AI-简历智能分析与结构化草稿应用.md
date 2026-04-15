# M12 / issue-117 开发日志：AI 简历智能分析与结构化草稿应用

- Issue：`#117`
- 里程碑：`M12 开源版收尾与智能简历改写`
- 分支：`fys-dev/feat-m12-issue-117-ai-resume-optimization`
- 日期：`2026-03-30`

## 背景

`M10` 结束后，AI 工作台已经具备：

- 运行时摘要
- 文件提取预览
- 管理员真实分析
- viewer 缓存只读体验

但 AI 能力还偏独立，没有真正回到简历主线本身。对于开源版来说，这会带来一个明显缺口：

- 可以分析
- 可以看结果
- 但分析结果还不能反向作用到当前草稿

所以这轮选择收一条最小但完整的闭环：

- 基于当前草稿和输入内容生成结构化改写建议
- 服务端回填成当前项目支持的 `StandardResume`
- 后台支持管理员一键把建议稿应用到草稿

## 本次目标

- 新增面向当前草稿的 AI 智能分析接口
- 返回结构化建议与完整 `StandardResume` 建议稿
- 后台支持“一键应用到当前草稿”
- 保持当前范围只服务于开源版最小可用闭环

## 非目标

- 不做多版本简历系统
- 不做 AI 历史持久化
- 不做异步任务队列
- 不做复杂 Prompt 编排系统
- 不扩展 viewer 新能力

## TDD / 测试设计

### 1. 先锁服务端结构化建议逻辑

新增：

- `apps/server/src/modules/ai/ai-resume-optimization.service.spec.ts`

验证：

- mock 模式下也能稳定生成建议稿
- Provider JSON patch 可被解析并合并到当前草稿
- 非法结构化结果会被拒绝

### 2. 再锁角色边界 E2E

更新：

- `apps/server/test/ai-report-role-access.e2e-spec.ts`

验证：

- `admin` 可调用新接口
- `viewer` 继续被禁止
- 返回结果里包含 `changedModules` 与完整 `suggestedResume`

### 3. 最后锁后台生成与一键应用

更新 / 新增：

- `apps/admin/lib/ai-workbench-api.spec.ts`
- `apps/admin/components/ai-analysis-panel.spec.tsx`

验证：

- 后台能请求结构化建议接口
- 只能在 `resume-review` 场景下生成结构化建议
- 建议稿可一键应用到当前草稿
- 应用后仍维持“保存草稿，不自动发布”的边界

## 实际改动

### 1. 服务端新增结构化建议服务

新增：

- `apps/server/src/modules/ai/ai-resume-optimization.service.ts`
- `apps/server/src/modules/ai/ai-resume-optimization.service.spec.ts`

这一层做了三件事：

- 读取当前草稿
- 让 AI 返回结构化 patch，而不是直接自由生成整份简历
- 将 patch 合并回当前草稿，生成完整 `StandardResume` 建议稿

这样做的价值是：

- 结构更稳
- 风险更可控
- 更适合当前开源版的教学节奏

### 2. 新增 AI 简历智能分析接口

更新：

- `apps/server/src/modules/ai/ai-report.controller.ts`
- `apps/server/src/modules/ai/ai.module.ts`

新增接口：

- `POST /ai/reports/resume-optimize`

当前接口输入：

- `instruction`
- `locale`

当前接口输出：

- `summary`
- `focusAreas`
- `changedModules`
- `suggestedResume`
- `providerSummary`

也就是说，这一轮不只是返回“分析报告”，而是第一次返回一个可直接应用的、通过当前项目结构校验的建议稿。

### 3. 后台接入结构化建议与一键应用

更新：

- `apps/admin/lib/ai-workbench.types.ts`
- `apps/admin/lib/ai-workbench-api.ts`
- `apps/admin/lib/ai-workbench-api.spec.ts`
- `apps/admin/components/ai-analysis-panel.tsx`
- `apps/admin/components/ai-analysis-panel.spec.tsx`

后台当前新增两步动作：

- 生成结构化简历建议
- 一键应用到当前草稿

这里刻意没有新开一张“AI 改写页”，而是继续放在 AI 工作台现有的分析面板内。这样读者更容易理解：

- 同样的输入内容
- 一条线用于“看分析结果”
- 一条线用于“生成结构化建议稿并写回草稿”

## Review 记录

### 是否符合当前 Issue 与里程碑目标

符合。

本轮只完成：

- AI 简历智能分析接口
- 结构化建议稿生成
- 后台一键应用到草稿
- admin / viewer 权限边界回归

没有越界去做：

- 多版本简历
- 历史记录
- 异步任务系统
- viewer 新入口

### 是否存在可抽离的组件、公共函数、skills 或其他复用能力

本轮已经完成当前最合适的一层抽离：

- `AiResumeOptimizationService`：统一承接草稿读取、结构化 patch 解析、建议稿生成与校验
- `generateAiResumeOptimization`：后台最小 API 客户端

刻意没有继续把“AI 改写工作流”抽成更大的编排层，因为当前开源版只需要证明这条最小闭环成立，不需要提前做历史、重试和复杂工作流抽象。

### 本次最重要的边界判断

这轮不是让 AI 直接自由生成一份全新的简历，而是让 AI 返回结构化 patch，再由服务端合并回当前草稿。

这个边界非常关键。因为它保证了：

- 当前事实信息更稳定
- 当前项目的 `StandardResume` 结构不被破坏
- 一键应用到草稿的风险可控

## 自测结果

已执行：

- `pnpm --filter @my-resume/server typecheck`
- `pnpm --filter @my-resume/admin typecheck`
- `pnpm --filter @my-resume/server test -- ai-resume-optimization.service.spec.ts`
- `pnpm --filter @my-resume/admin exec vitest run components/ai-analysis-panel.spec.tsx lib/ai-workbench-api.spec.ts`
- `pnpm --filter @my-resume/server test:e2e -- test/ai-report-role-access.e2e-spec.ts`
- `pnpm --filter @my-resume/server build`
- `pnpm --filter @my-resume/admin build`

结果：

- 服务端类型检查通过
- 后台类型检查通过
- 服务端结构化建议单测通过
- 后台结构化建议与一键应用测试通过
- admin / viewer 权限边界 E2E 通过
- `server / admin` 构建通过

补充说明：

- `apps/admin` 全量测试在本地并发运行时仍有历史上的超时波动，本轮改动相关的定向测试均已通过
- 当前构建结果中已包含 `/dashboard/ai` 页面更新，说明功能不只停留在测试层

## 遇到的问题

### 1. 直接让 AI 输出整份简历风险太高

问题：

如果这一轮直接让 AI 自由生成整份 `StandardResume`，很容易出现：

- 结构不稳定
- 事实信息漂移
- 一键应用风险过高

处理：

- 改为“AI 返回结构化 patch”
- 服务端再统一合并回当前草稿
- 最终再走现有简历结构校验

### 2. mock 模式下也要保证闭环可验证

问题：

当前开源仓库不一定每个人都有真实 API Key，如果 mock 模式下新接口不可用，这条能力就很难在开源环境中被验证。

处理：

- 在 `mock` 模式下补 deterministic suggestion
- 让这条链路在没有真实 Provider 时仍然可演示、可测试、可讲解

## 可沉淀为教程 / 博客的点

- 为什么开源版 AI 改写不应该一开始就做“自由生成整份简历”
- 为什么“结构化 patch + 服务端合并”更适合当前阶段
- 如何把 AI 分析结果真正接回当前简历草稿，而不是只停留在报告展示
- 如何在保持单后端原则的同时，把 AI 改写能力接进后台工作台

## 后续待办

- 可在后续里程碑中继续补“改写前后 diff 展示”
- 可在个人产品线中扩展多版本简历、历史记录与任务队列
- 开源版当前先停在“结构化建议 + 一键应用草稿”即可
