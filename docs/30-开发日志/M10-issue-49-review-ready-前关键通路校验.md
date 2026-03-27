# M10 / issue-49 review-ready 前关键通路校验

- Issue：`#91`
- 里程碑：`M10 AI 工作台与真实分析：从基础接口到后台闭环`
- 分支：`fys-dev/feat-m10-issue-49-admin-live-analysis`
- 日期：`2026-03-27`

## 本轮主承诺

把后台 AI 工作台从“上传与预览输入”推进到“管理员真实分析与结果阅读”：

- 管理员可手动输入分析内容
- 文件提取结果可接力到分析输入区
- 页面可触发 `apps/server` 的 `/ai/reports/analyze`
- 页面可阅读返回的 Provider 结果结构与错误反馈

本轮不承诺：

- Redis / BullMQ 队列
- 分析历史持久化
- 复杂 Prompt 编排系统
- viewer 真实缓存体验收束

## 关键通路

### 1. 输入接力到真实分析通路

要证明的事情：

- 分析输入不只靠手打
- 上一轮文件提取结果能直接成为这一轮真实分析输入
- 业务链路仍是前端壳调用 NestJS，而不是前端自己处理分析逻辑

证据落点：

- `apps/admin/components/ai-file-extraction-panel.tsx`
- `apps/admin/components/admin-ai-workbench-shell.tsx`
- `apps/admin/components/admin-ai-workbench-shell.spec.tsx`

当前结论：

- 已打通。文件提取成功后会把结果同步进分析输入区
- 工作台壳已验证这条接力链路
- AI 业务触发仍只通过 `apps/server`

### 2. 管理员真实分析与结果阅读通路

要证明的事情：

- `admin` 能用当前输入触发真实分析
- 页面能展示场景、语言、Provider 和结果结构
- 分析失败时不会静默失败

证据落点：

- `apps/admin/lib/ai-workbench-api.ts`
- `apps/admin/lib/ai-workbench-api.spec.ts`
- `apps/admin/components/ai-analysis-panel.tsx`
- `apps/admin/components/ai-analysis-panel.spec.tsx`
- `apps/server/test/ai-report-role-access.e2e-spec.ts`

当前结论：

- 已打通。前端已能调用 `/ai/reports/analyze`
- 管理员面板可展示结果摘要、Provider 信息和分段结果
- API 客户端与组件测试都覆盖了失败反馈
- `server` E2E 已证明管理员触发与 viewer 禁止触发边界仍成立

### 3. 最小同步闭环与后续连续性通路

要证明的事情：

- 当前轮次只做同步最小闭环，不提前走向队列和历史系统
- 页面和服务端构建没有被这次接入破坏
- 人工验证能说明这轮不是“只在测试里通过”

证据落点：

- `apps/admin/components/ai-analysis-panel.tsx`
- `pnpm --filter @my-resume/admin test`
- `pnpm --filter @my-resume/admin typecheck`
- `pnpm --filter @my-resume/admin build`
- `pnpm --filter @my-resume/server test:e2e -- test/ai-report-role-access.e2e-spec.ts`
- `pnpm --filter @my-resume/server typecheck`
- `pnpm --filter @my-resume/server build`
- 本地人工验证：管理员登录后在 `http://localhost:5566/dashboard/ai` 成功触发真实分析并看到结果

当前结论：

- 已满足。当前页面明确保留同步触发方案
- 自动化验证与人工验证都已成立
- 后续可继续在同一入口上接 viewer 缓存体验，而不必返工本轮输入与分析链路

## 是否足以进入 review-ready

可以进入。

原因：

- 本轮主承诺已经完成
- 三条关键通路都有代码、测试和人工验证支撑
- 没有把 `issue-50` 的 viewer 缓存体验提前做进来

## 进入 review-ready 前仍需注意

- `admin typecheck` 与 `next build` 不适合并行执行，`.next/types` 会被并行重建影响
- 真实 Provider 返回的是长文本，当前已改成正文块展示；后续若继续做结构化结果，可考虑更细的段落拆分而不是继续堆长字符串
