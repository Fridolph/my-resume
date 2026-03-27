# M10 / issue-50 review-ready 前关键通路校验

- Issue：`#89`
- 里程碑：`M10 AI 工作台与真实分析：从基础接口到后台闭环`
- 分支：`fys-dev/feat-m10-issue-50-viewer-cache-boundary`
- 日期：`2026-03-27`

## 本轮主承诺

把 `viewer` 的 AI 体验边界真正收住：

- viewer 只能阅读缓存或预设分析结果
- viewer 不能上传文件
- viewer 不能触发真实分析
- 页面级提示能把这层边界讲清楚

本轮不承诺：

- 新角色模型
- 复杂权限系统改造
- auth 主模型改写
- 新的 AI 历史系统

## 关键通路

### 1. viewer 缓存读取通路

要证明的事情：

- viewer 登录后不只是看到“只读占位”
- 页面能真正从现有缓存接口读取列表与详情
- 缓存结果可阅读、可切换

证据落点：

- `apps/admin/lib/ai-workbench-api.ts`
- `apps/admin/lib/ai-workbench-api.spec.ts`
- `apps/admin/components/ai-cached-reports-panel.tsx`
- `apps/admin/components/ai-cached-reports-panel.spec.tsx`

当前结论：

- 已打通。前端已接入 `/ai/reports/cache` 与 `/ai/reports/cache/:reportId`
- 缓存报告面板可加载首条报告并切换详情
- viewer 进入页面后可获得真实只读体验，不再只有说明文字

### 2. viewer 禁止触发通路

要证明的事情：

- viewer 仍不能上传文件
- viewer 仍不能触发真实分析
- 页面顺序和提示语能把“能做什么、不能做什么”讲清楚

证据落点：

- `apps/admin/components/admin-ai-workbench-shell.tsx`
- `apps/admin/components/admin-ai-workbench-shell.spec.tsx`
- `apps/server/test/ai-report-role-access.e2e-spec.ts`

当前结论：

- 已满足。viewer 会优先看到缓存结果面板
- 上传面板和真实分析面板都保持只读提示
- `server` 侧回归继续证明 viewer 读缓存可以、触发新请求不行

### 3. admin / viewer 边界连续性通路

要证明的事情：

- 新增 viewer 缓存体验后，不会把上一轮 admin 真实分析闭环带坏
- 页面边界更清晰，而不是把两套体验混成一页无差别入口

证据落点：

- `pnpm --filter @my-resume/admin test`
- `pnpm --filter @my-resume/admin typecheck`
- `pnpm --filter @my-resume/admin build`
- `pnpm --filter @my-resume/server test:e2e -- test/ai-report-role-access.e2e-spec.ts`
- `pnpm --filter @my-resume/server typecheck`
- `pnpm --filter @my-resume/server build`

当前结论：

- 已满足。`admin` 仍保留上传与真实分析入口
- `viewer` 则收敛到缓存体验
- `admin / server` 自动化验证全部通过

## 是否足以进入 review-ready

可以进入。

原因：

- 本轮主承诺已经完成
- 三条关键通路均有对应代码与测试
- 没有把 M10 里程碑最后的文档收束任务混进当前 issue

## 进入 review-ready 前仍需注意

- 当前缓存报告列表默认按第一条报告进入详情，后续若缓存结果继续增长，可再考虑更明确的筛选与排序，但这不属于当前 issue
- 这一轮没有新增人工验证，原因是 viewer 权限边界与缓存读取已被页面测试和服务端 E2E 双层覆盖
